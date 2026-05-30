import { randomUUID } from "crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
    menuCategories,
    menuCombos,
    menuProducts,
    inventoryMovements,
    orderItems,
    orders,
    promotions, 
    promotionTargets,
    tables
} from "../models/tenantSchema.js";
import { deductInventoryForOrder, restockInventoryForOrder,validateInventoryForOrder } from "../services/tenantInventoryService.js";
import { handleCrossShiftAdjustment } from "../services/tenantCashService.js";

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
            .where(eq(menuProducts.id, item.itemId) )
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
        const { items, fulfillmentType, tableId, promoCode, paymentMethod, customerName } = req.body;
        const normalizedCustomerName = customerName?.trim() || req.user.name || req.user.email || "Cliente";

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
            customerName: normalizedCustomerName,
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
                id: orderId,
                code: ticketCode,
                status: order.status,
                fulfillmentType: order.fulfillmentType,
                tableId: order.tableId,
                customerName: order.customerName,
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
                .select({
                    id: orderItems.id,
                    itemId: orderItems.itemId,
                    itemType: orderItems.itemType,
                    name: orderItems.name,
                    quantity: orderItems.quantity,
                    unitPrice: orderItems.unitPrice,
                    lineTotal: orderItems.lineTotal,
                    imageBase64: menuProducts.imageBase64,
                    categoryImageBase64: menuCategories.imageBase64,
                })
                .from(orderItems)
                .leftJoin(menuProducts, eq(orderItems.itemId, menuProducts.id))
                .leftJoin(menuCategories, eq(menuProducts.categoryId, menuCategories.id))
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
                isEdited: order.isEdited,
                createdAt: order.createdAt?.toISOString(),
                items: items.map((item) => ({
                    id: item.id,
                    itemId: item.itemId,
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                    imageBase64: item.imageBase64,
                    categoryImageBase64: item.categoryImageBase64,
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
                .select({
                    id: orderItems.id,
                    itemId: orderItems.itemId,
                    itemType: orderItems.itemType,
                    name: orderItems.name,
                    quantity: orderItems.quantity,
                    imageBase64: menuProducts.imageBase64,
                    categoryImageBase64: menuCategories.imageBase64,
                })
                .from(orderItems)
                .leftJoin(menuProducts, eq(orderItems.itemId, menuProducts.id))
                .leftJoin(menuCategories, eq(menuProducts.categoryId, menuCategories.id))
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
                isEdited: order.isEdited,
                createdAt: order.createdAt?.toISOString(),
                items: items.map((item) => ({
                    id: item.id,
                    itemId: item.itemId,
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                    imageBase64: item.imageBase64,
                    categoryImageBase64: item.categoryImageBase64,
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
                .select({
                    id: orderItems.id,
                    itemId: orderItems.itemId,
                    itemType: orderItems.itemType,
                    name: orderItems.name,
                    quantity: orderItems.quantity,
                    imageBase64: menuProducts.imageBase64,
                    categoryImageBase64: menuCategories.imageBase64,
                })
                .from(orderItems)
                .leftJoin(menuProducts, eq(orderItems.itemId, menuProducts.id))
                .leftJoin(menuCategories, eq(menuProducts.categoryId, menuCategories.id))
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
                isEdited: order.isEdited,
                createdAt: order.createdAt?.toISOString(),
                items: items.map((item) => ({
                    id: item.id,
                    itemId: item.itemId,
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                    imageBase64: item.imageBase64,
                    categoryImageBase64: item.categoryImageBase64,
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

export const cancelTenantOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const userName = req.user.name || req.user.email || "Usuario de caja";

        const [existingOrder] = await req.tenantDb
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);

        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Pedido no encontrado." });
        }

        if (existingOrder.status === "cancelled") {
            return res.status(400).json({ success: false, message: "El pedido ya se encuentra cancelado." });
        }

        await handleCrossShiftAdjustment(
            req.tenantDb,
            existingOrder.createdAt,
            -Number(existingOrder.total),
            `Devolución por cancelación de ticket ${existingOrder.ticketCode}`,
            userId,
            userName
        );

        await req.tenantDb
            .update(orders)
            .set({
                status: "cancelled",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

        if (existingOrder.status === "finished" || existingOrder.status === "delivered") {
            
            await req.tenantDb
                .update(inventoryMovements)
                .set({
                    type: "MERMA",
                    reason: `Cancelación tardía (Merma) - Ticket ${existingOrder.ticketCode}`,
                })
                .where(eq(inventoryMovements.orderId, orderId));
        } else {
            await restockInventoryForOrder(
                req.tenantDb,
                orderId,
                `Cancelación a tiempo - Ticket ${existingOrder.ticketCode}`
            );
        }

        res.json({
            success: true,
            message: "Orden cancelada exitosamente. El inventario y el dinero han sido devueltos.",
        });
    } catch (error) {
        if (error.message === "NO_OPEN_SHIFT_FOR_ADJUSTMENT") {
            return res.status(400).json({
                success: false,
                message: "Debes tener un turno de caja abierto para poder procesar una cancelación y devolver el dinero.",
            });
        }
        next(error);
    }
};export const editTenantOrder = async (req, res, next) => {
    try {
        console.log("\n[DEBUG - EDIT] === INICIANDO EDICIÓN DE ORDEN ===");
        const { orderId } = req.params;
        const { items, fulfillmentType, tableId, promoCode, paymentMethod, customerName } = req.body;
        const userId = req.user.id;
        const userName = req.user.name || req.user.email || "Usuario de caja";

        const [existingOrder] = await req.tenantDb.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        
        if (!existingOrder) return res.status(404).json({ success: false, message: "Pedido no encontrado." });

        if (existingOrder.status !== "in_preparation") {
            return res.status(400).json({
                success: false,
                message: "No puedes editar un pedido que ya fue terminado por cocina o entregado. Si el cliente desea más productos, genera un ticket nuevo.",
            });
        }

        if (existingOrder.status === "cancelled") return res.status(400).json({ success: false, message: "No puedes editar un pedido cancelado." });
        const saleItems = [];
        for (const item of items) {
            const saleItem = await findSaleItem(req.tenantDb, item);
            if (!saleItem) {
                return res.status(400).json({ success: false, message: "Uno de los productos o combos ya no esta disponible." });
            }
            saleItems.push(saleItem);
        }
        const oldOrderItemsDb = await req.tenantDb.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        
        console.log("[DEBUG - EDIT] Devolviendo inventario viejo a bodega temporalmente...");
        await restockInventoryForOrder(req.tenantDb, orderId, `Reversión temporal por edición - Ticket ${existingOrder.ticketCode}`);

        const inventoryCheck = await validateInventoryForOrder(req.tenantDb, saleItems);
        if (!inventoryCheck.valid) {
            console.log("[DEBUG - EDIT] ❌ Falla de inventario en la edición. Deshaciendo reversión...");
            // Como falló, volvemos a descontar lo viejo para dejar todo como estaba
            const rollbackItems = oldOrderItemsDb.map(oi => ({ itemType: oi.itemType, itemId: oi.itemId, quantity: oi.quantity }));
            await deductInventoryForOrder(req.tenantDb, orderId, rollbackItems);
            
            return res.status(400).json({ success: false, message: inventoryCheck.message });
        }

        let subtotal = 0;
        let discountTotal = 0;
        let activePromotion = null;
        let promoTargets = [];
        let promotionTarget = null;

        if (promoCode) {
            const normalizedCode = promoCode.trim().toUpperCase();
            const [promo] = await req.tenantDb.select().from(promotions)
                .where(and(eq(promotions.code, normalizedCode), eq(promotions.isActive, true))).limit(1);

            if (promo) {
                const now = new Date();
                const start = new Date(promo.startDate);
                const end = new Date(promo.endDate);
                if (now >= start && now <= end) {
                    activePromotion = promo;
                    promoTargets = await req.tenantDb.select().from(promotionTargets).where(eq(promotionTargets.promotionId, promo.id));
                    promotionTarget = getPromotionTarget(promoTargets);
                } else {
                    const rollbackItems = oldOrderItemsDb.map(oi => ({ itemType: oi.itemType, itemId: oi.itemId, quantity: oi.quantity }));
                    await deductInventoryForOrder(req.tenantDb, orderId, rollbackItems);
                    return res.status(400).json({ success: false, message: "El código promocional ha expirado." });
                }
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
                discountTotalCents = Math.min(eligibleSubtotalCents, Math.round(eligibleSubtotalCents * (Number(activePromotion.discountValue) / 100)));
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
        const total = subtotal - discountTotal;
        const amountDiff = total - Number(existingOrder.total);
        const newTicketCode = createTicketCode();

        console.log(`[DEBUG - EDIT] Diferencia de dinero: ${amountDiff}. Ajustando caja chica si es necesario...`);
        await handleCrossShiftAdjustment(
            req.tenantDb,
            existingOrder.createdAt,
            amountDiff, 
            `Ajuste por edición de ticket ${existingOrder.ticketCode}`,
            userId,
            userName
        );

        await req.tenantDb.delete(orderItems).where(eq(orderItems.orderId, orderId));
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
        await req.tenantDb.update(orders).set({
            ticketCode: newTicketCode,
            customerName: customerName || existingOrder.customerName,
            status: "in_preparation", 
            isEdited: true,          
            fulfillmentType,
            tableId: fulfillmentType === "dine_in" ? tableId : null,
            paymentMethod: paymentMethod || existingOrder.paymentMethod,
            subtotal: money(subtotal),
            discountTotal: money(discountTotal),
            promotionId: activePromotion ? activePromotion.id : null,
            total: money(total),
            updatedAt: new Date()
        }).where(eq(orders.id, orderId));

        console.log("[DEBUG - EDIT] Descontando el nuevo inventario...");
        await deductInventoryForOrder(req.tenantDb, orderId, saleItems);

        console.log("[DEBUG - EDIT] === EDICIÓN COMPLETADA CON ÉXITO ===");
        res.json({
            success: true,
            message: "Orden editada correctamente.",
            ticket: {
                id: orderId,
                code: newTicketCode,
                status: "in_preparation",
                fulfillmentType,
                tableId: fulfillmentType === "dine_in" ? tableId : null,
                customerName: customerName || existingOrder.customerName,
                paymentMethod: paymentMethod || existingOrder.paymentMethod,
                createdAt: new Date().toISOString(),
                items: saleItems.map((item) => ({
                    type: item.itemType,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: money(item.unitPrice),
                    lineTotal: money(item.lineNetTotal),
                })),
                subtotal: money(subtotal),
                discountTotal: money(discountTotal),
                total: money(total),
                promotionApplied: activePromotion ? activePromotion.name : null,
            },
        });
    } catch (error) {
        console.error("[DEBUG - EDIT] ❌ ERROR EN EDICIÓN:", error);
        if (error.message === "NO_OPEN_SHIFT_FOR_ADJUSTMENT") {
            return res.status(400).json({ success: false, message: "Debes tener un turno de caja abierto para realizar ediciones que alteran el monto total." });
        }
        next(error);
    }
}; 