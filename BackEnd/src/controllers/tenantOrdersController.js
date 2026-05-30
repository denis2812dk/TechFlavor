import { randomUUID } from "crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
    menuCombos,
    menuProducts,
    orderItems,
    orders,
    promotions, 
    promotionTargets,
    tables
} from "../models/tenantSchema.js";
import { deductInventoryForOrder, validateInventoryForOrder } from "../services/tenantInventoryService.js";

const money = (value) => Number(value).toFixed(2);
const toCents = (value) => Math.round(Number(value || 0) * 100);
const fromCents = (value) => Number((value / 100).toFixed(2));

const getPromotionTarget = (promotionTargets) => promotionTargets[0] || null;

const isItemEligibleForTarget = (item, target) => {
    if (!target || target.targetType === "all") return true;
    if (target.targetType === "product") return target.targetId === item.itemId;
    if (target.targetType === "category") return target.targetId === item.categoryId;
    return false;
};

const distributeDiscountAcrossItems = (items, discountCents, eligibleSubtotalCents) => {
    if (discountCents <= 0 || eligibleSubtotalCents <= 0 || items.length === 0) {
        return;
    }

    let allocated = 0;
    items.forEach((item, index) => {
        if (index === items.length - 1) {
            item.lineDiscountCents = Math.max(0, discountCents - allocated);
            return;
        }

        const rawShare = Math.floor((discountCents * item.lineSubtotalCents) / eligibleSubtotalCents);
        const share = Math.min(rawShare, item.lineSubtotalCents);
        item.lineDiscountCents = share;
        allocated += share;
    });

    let remaining = discountCents - items.reduce((sum, item) => sum + item.lineDiscountCents, 0);
    if (remaining > 0) {
        for (const item of items) {
            if (remaining <= 0) break;
            const room = item.lineSubtotalCents - item.lineDiscountCents;
            const extra = Math.min(room, remaining);
            item.lineDiscountCents += extra;
            remaining -= extra;
        }
    }
};

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
        console.log("\n[DEBUG - ORDERS] === NUEVA PETICIÓN DE ORDEN RECIBIDA ===");
        console.log("[DEBUG - ORDERS] Payload:", JSON.stringify(req.body, null, 2));

        const { items, fulfillmentType, tableId, promoCode, paymentMethod, customerName } = req.body;

        const saleItems = [];
        for (const item of items) {
            const saleItem = await findSaleItem(req.tenantDb, item);
            if (!saleItem) {
                console.log(`[DEBUG - ORDERS] Producto/combo no encontrado o inactivo: ${item.itemId}`);
                return res.status(400).json({
                    success: false,
                    message: "Uno de los productos o combos ya no esta disponible.",
                });
            }
            saleItems.push(saleItem);
        }
        console.log("[DEBUG - ORDERS] Productos analizados listos para validar:", saleItems);

        // ==========================================
        // FASE 2: VALIDACIÓN DE INVENTARIO
        // ==========================================
        const inventoryCheck = await validateInventoryForOrder(req.tenantDb, saleItems);
        console.log("[DEBUG - ORDERS] Resultado de validación final:", inventoryCheck);
        
        if (!inventoryCheck.valid) {
            console.log("[DEBUG - ORDERS] ❌ Orden rechazada por falta de stock.");
            return res.status(400).json({
                success: false,
                message: inventoryCheck.message
            });
        }
        
        let subtotal = 0;
        let discountTotal = 0;
        let activePromotion = null;
        let promoTargets = [];
        let promotionTarget = null;
        
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
                    promotionTarget = getPromotionTarget(promoTargets);
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

        const eligibleItems = [];
        let eligibleSubtotalCents = 0;

        for (const item of saleItems) {
            const lineSubtotalCents = toCents(item.unitPrice) * item.quantity;
            const appliesToItem = activePromotion ? isItemEligibleForTarget(item, promotionTarget) : false;

            item.lineSubtotalCents = lineSubtotalCents;
            item.lineDiscountCents = 0;
            item.lineNetTotalCents = lineSubtotalCents;

            if (appliesToItem) {
                eligibleItems.push(item);
                eligibleSubtotalCents += lineSubtotalCents;
            }

            subtotal += fromCents(lineSubtotalCents);
        }

        let discountTotalCents = 0;
        if (activePromotion && eligibleSubtotalCents > 0) {
            const discountValueCents = toCents(activePromotion.discountValue);

            if (activePromotion.discountType === "percentage") {
                discountTotalCents = Math.min(
                    eligibleSubtotalCents,
                    Math.round(eligibleSubtotalCents * (Number(activePromotion.discountValue) / 100))
                );
            } else if (activePromotion.discountType === "fixed_amount") {
                discountTotalCents = Math.min(discountValueCents, eligibleSubtotalCents);
            }

            distributeDiscountAcrossItems(eligibleItems, discountTotalCents, eligibleSubtotalCents);
        }

        for (const item of saleItems) {
            item.lineNetTotalCents = item.lineSubtotalCents - item.lineDiscountCents;
            item.lineSubtotal = fromCents(item.lineSubtotalCents);
            item.lineDiscount = fromCents(item.lineDiscountCents);
            item.lineNetTotal = fromCents(item.lineNetTotalCents);
        }

        discountTotal = fromCents(discountTotalCents);

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
            customerName: customerName || "Cliente",
            status: "in_preparation",
            fulfillmentType,
            tableId: fulfillmentType === "dine_in" ? tableId : null,
            paymentMethod: paymentMethod || "cash",
            subtotal: money(subtotal),
            discountTotal: money(discountTotal),
            promotionId: activePromotion ? activePromotion.id : null,
            total: money(total),
            cashierUserId: req.user.id,
            cashierName: req.user.name || req.user.email || "Usuario de caja",
        };

        console.log("[DEBUG - ORDERS] Guardando orden en base de datos:", orderId);
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

        console.log("[DEBUG - ORDERS] Orden guardada. Mandando a descontar inventario...");
        await deductInventoryForOrder(req.tenantDb, orderId, saleItems);
        console.log("[DEBUG - ORDERS] === ORDEN COMPLETADA CON ÉXITO ===");

        res.status(201).json({
            success: true,
            message: "Pedido generado correctamente.",
            ticket: {
                code: ticketCode,
                customerName: order.customerName,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableId: order.tableId,
                cashierName: order.cashierName,
                paymentMethod: order.paymentMethod,
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
                promotionApplied: activePromotion ? activePromotion.name : null,
            },
        });
    } catch (error) {
        console.error("[DEBUG - ORDERS] ❌ ERROR EN LA ORDEN:", error);
        next(error);
    }
};

export const listTenantOrders = async (req, res, next) => {
    try {
        const tenantOrders = await req.tenantDb
            .select({
                order: orders,
                tableName: tables.identifier
            })
            .from(orders)
            .leftJoin(tables, eq(orders.tableId, tables.id))
            .orderBy(desc(orders.createdAt));

        const orderPayload = [];

        for (const row of tenantOrders) {
            const order = row.order;
            const items = await req.tenantDb
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, order.id));

            orderPayload.push({
                id: order.id,
                code: order.ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableId: order.tableId,
                tableName: row.tableName,
                customerName: order.customerName,
                paymentMethod: order.paymentMethod,
                subtotal: order.subtotal,
                total: order.total,
                cashierUserId: order.cashierUserId,
                cashierName: order.cashierName,
                createdAt: order.updatedAt?.toISOString() || order.createdAt?.toISOString(),
                updatedAt: order.updatedAt?.toISOString(),
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
            .select({
                order: orders,
                tableName: tables.identifier
            })
            .from(orders)
            .leftJoin(tables, eq(orders.tableId, tables.id))
            .where(eq(orders.status, "in_preparation"))
            .orderBy(desc(orders.createdAt));

        const orderPayload = [];

        for (const row of kitchenOrders) {
            const order = row.order;
            const items = await req.tenantDb
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, order.id));

            orderPayload.push({
                id: order.id,
                code: order.ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableId: order.tableId,
                tableName: row.tableName,
                customerName: order.customerName,
                cashierName: order.cashierName,
                createdAt: order.updatedAt?.toISOString() || order.createdAt?.toISOString(),
                updatedAt: order.updatedAt?.toISOString(),
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
            .select({
                order: orders,
                tableName: tables.identifier
            })
            .from(orders)
            .leftJoin(tables, eq(orders.tableId, tables.id))
            .where(eq(orders.status, "finished"))
            .orderBy(desc(orders.updatedAt));

        const orderPayload = [];

        for (const row of dispatchOrders) {
            const order = row.order;
            const items = await req.tenantDb
                .select()
                .from(orderItems)
                .where(eq(orderItems.orderId, order.id));

            orderPayload.push({
                id: order.id,
                code: order.ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableId: order.tableId,
                tableName: row.tableName,
                customerName: order.customerName,
                cashierName: order.cashierName,
                createdAt: order.updatedAt?.toISOString() || order.createdAt?.toISOString(),
                updatedAt: order.updatedAt?.toISOString(),
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
            serverTime: new Date().toISOString(),
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