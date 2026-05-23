import { randomUUID } from "crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
    menuCombos,
    menuProducts,
    orderItems,
    orders,
    promotions, 
    promotionTargets 
} from "../models/tenantSchema.js";
import { deductInventoryForOrder } from "../services/tenantInventoryService.js";

const money = (value) => Number(value).toFixed(2);

const createTicketCode = () => {
    const date = new Date();
    const stamp = [
        date.getFullYear().toString().slice(2),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("");
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `TF-${stamp}-${randomPart}`;
};

const findSaleItem = async (tenantDb, item) => {
    if (item.itemType === "product") {
        const [product] = await tenantDb
            .select()
            .from(menuProducts)
            .where(eq(menuProducts.id, item.itemId))
            .limit(1);

        if (!product?.isActive) return null;
        return {
            itemType: item.itemType,
            itemId: product.id,
            categoryId: product.categoryId, 
            name: product.name,
            unitPrice: Number(product.price),
            quantity: item.quantity,
        };
    }

    const [combo] = await tenantDb
        .select()
        .from(menuCombos)
        .where(eq(menuCombos.id, item.itemId))
        .limit(1);

    if (!combo?.isActive) return null;
    return {
        itemType: item.itemType,
        itemId: combo.id,
        categoryId: null, 
        name: combo.name,
        unitPrice: Number(combo.price),
        quantity: item.quantity,
    };
};

export const createTenantOrder = async (req, res, next) => {
    try {
        const { items, fulfillmentType, tableIdentifier, promoCode } = req.body;

        const saleItems = [];
        for (const item of items) {
            const saleItem = await findSaleItem(req.tenantDb, item);
            if (!saleItem) {
                return res.status(400).json({
                    success: false,
                    message: "Uno de los productos o combos ya no esta disponible.",
                });
            }
            saleItems.push(saleItem);
        }
        
        let subtotal = 0;
        let discountTotal = 0;
        let activePromotion = null;
        let promoTargets = [];
        
        if (promoCode) {
            const normalizedCode = promoCode.trim().toUpperCase();
            
            const [promo] = await req.tenantDb.select().from(promotions)
                .where(and(
                    eq(promotions.code, normalizedCode),
                    eq(promotions.isActive, true)
                )).limit(1);

            if (promo) {
                const now = new Date();
                const start = new Date(promo.startDate);
                const end = new Date(promo.endDate);

                if (now >= start && now <= end) {
                    activePromotion = promo;
                    promoTargets = await req.tenantDb.select().from(promotionTargets)
                        .where(eq(promotionTargets.promotionId, promo.id));
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "El código promocional ha expirado o aún no está vigente.",
                    });
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: "El código promocional no existe o está inactivo.",
                });
            }
        }
        
        for (const item of saleItems) {
            const lineSubtotal = item.unitPrice * item.quantity;
            let lineDiscount = 0;

            if (activePromotion) {
                const appliesToItem = promoTargets.some(target => 
                    target.targetType === 'all' || 
                    (target.targetType === 'product' && target.targetId === item.itemId) ||
                    (target.targetType === 'category' && target.targetId === item.categoryId)
                );

                if (appliesToItem) {
                    if (activePromotion.discountType === 'percentage') {
                        lineDiscount = lineSubtotal * (Number(activePromotion.discountValue) / 100);
                    } else if (activePromotion.discountType === 'fixed_amount') {
                        lineDiscount = Number(activePromotion.discountValue) * item.quantity;
                    }
                }
            }

            if (lineDiscount > lineSubtotal) lineDiscount = lineSubtotal;

            item.lineSubtotal = lineSubtotal;
            item.lineDiscount = lineDiscount;
            item.lineNetTotal = lineSubtotal - lineDiscount; 

            subtotal += lineSubtotal;
            discountTotal += lineDiscount;
        }

        if (promoCode && activePromotion && discountTotal <= 0) {
            return res.status(400).json({
                success: false,
                message: "No Aplicable",
            });
        }

        const total = subtotal - discountTotal;
        const orderId = randomUUID();
        const ticketCode = createTicketCode();

        const order = {
            id: orderId,
            ticketCode,
            status: "in_preparation",
            fulfillmentType,
            tableIdentifier: fulfillmentType === "dine_in" ? tableIdentifier : null,
            subtotal: money(subtotal),
            discountTotal: money(discountTotal), 
            promotionId: activePromotion ? activePromotion.id : null,
            total: money(total),
            cashierUserId: req.user.id,
            cashierName: req.user.name || req.user.email || "Usuario de caja",
        };

        await req.tenantDb.insert(orders).values(order);
        
        await req.tenantDb.insert(orderItems).values(saleItems.map((item) => ({
            id: randomUUID(),
            orderId,
            itemType: item.itemType,
            itemId: item.itemId,
            name: item.name,
            unitPrice: money(item.unitPrice),
            quantity: item.quantity,
            lineTotal: money(item.lineNetTotal),
        })));
        
        await deductInventoryForOrder(req.tenantDb, orderId, saleItems);

        res.status(201).json({
            success: true,
            message: "Pedido generado correctamente.",
            ticket: {
                code: ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableIdentifier: order.tableIdentifier,
                cashierName: order.cashierName,
                createdAt: new Date().toISOString(),
                items: saleItems.map((item) => ({
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: money(item.unitPrice),
                    discount: money(item.lineDiscount),
                    lineTotal: money(item.lineNetTotal),
                })),
                subtotal: order.subtotal,
                discountTotal: order.discountTotal,
                total: order.total,
                promotionApplied: activePromotion ? activePromotion.name : null
            },
        });
    } catch (error) {
        next(error);
    }
};

export const listTenantOrders = async (req, res, next) => {
    try {
        const tenantOrders = await req.tenantDb
            .select()
            .from(orders)
            .orderBy(desc(orders.createdAt));

        const orderPayload = [];

        for (const order of tenantOrders) {
            const items = await req.tenantDb
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, order.id));

            orderPayload.push({
                id: order.id,
                code: order.ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableIdentifier: order.tableIdentifier,
                subtotal: order.subtotal,
                total: order.total,
                cashierUserId: order.cashierUserId,
                cashierName: order.cashierName,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                items: items.map((item) => ({
                    id: item.id,
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                })),
            });
        }

        res.json({
            success: true,
            orders: orderPayload,
        });
    } catch (error) {
        next(error);
    }
};

export const listKitchenOrders = async (req, res, next) => {
    try {
        const kitchenOrders = await req.tenantDb
            .select()
            .from(orders)
            .where(eq(orders.status, "in_preparation"))
            .orderBy(desc(orders.createdAt));

        const orderPayload = [];

        for (const order of kitchenOrders) {
            const items = await req.tenantDb
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, order.id));

            orderPayload.push({
                id: order.id,
                code: order.ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableIdentifier: order.tableIdentifier,
                cashierName: order.cashierName,
                createdAt: order.createdAt,
                items: items.map((item) => ({
                    id: item.id,
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                })),
            });
        }

        res.json({
            success: true,
            orders: orderPayload,
        });
    } catch (error) {
        next(error);
    }
};

export const finishKitchenOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const [existingOrder] = await req.tenantDb
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado.",
            });
        }

        if (existingOrder.status !== "in_preparation") {
            return res.status(400).json({
                success: false,
                message: "Solo se pueden terminar pedidos en preparacion.",
            });
        }

        await req.tenantDb
            .update(orders)
            .set({
                status: "finished",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        res.json({
            success: true,
            message: "Pedido terminado.",
        });
    } catch (error) {
        next(error);
    }
};

export const listDispatchOrders = async (req, res, next) => {
    try {
        const dispatchOrders = await req.tenantDb
            .select()
            .from(orders)
            .where(eq(orders.status, "finished"))
            .orderBy(desc(orders.updatedAt));

        const orderPayload = [];

        for (const order of dispatchOrders) {
            const items = await req.tenantDb
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, order.id));

            orderPayload.push({
                id: order.id,
                code: order.ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableIdentifier: order.tableIdentifier,
                cashierName: order.cashierName,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                items: items.map((item) => ({
                    id: item.id,
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                })),
            });
        }

        res.json({
            success: true,
            orders: orderPayload,
        });
    } catch (error) {
        next(error);
    }
};

export const deliverDispatchOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const [existingOrder] = await req.tenantDb
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado.",
            });
        }

        if (existingOrder.status !== "finished") {
            return res.status(400).json({
                success: false,
                message: "Solo se pueden entregar pedidos terminados por cocina.",
            });
        }

        await req.tenantDb
            .update(orders)
            .set({
                status: "delivered",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        res.json({
            success: true,
            message: "Entrega confirmada.",
        });
    } catch (error) {
        next(error);
    }
};