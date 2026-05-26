import { randomUUID } from "crypto";
import { eq, desc, sql } from "drizzle-orm";
import { 
    purchaseOrders, 
    purchaseOrderItems, 
    inventory, 
    inventoryMovements,
    suppliers,
    ingredients
} from "../models/tenantSchema.js";

export const createPurchaseOrder = async (tenantDb, supplierId, items) => {
    const orderId = randomUUID();

    await tenantDb.transaction(async (tx) => {
        await tx.insert(purchaseOrders).values({
            id: orderId,
            supplierId,
            status: "pending",
        });
        const orderItemsData = items.map(item => ({
            id: randomUUID(),
            purchaseOrderId: orderId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
        }));

        await tx.insert(purchaseOrderItems).values(orderItemsData);
    });

    return orderId;
};

export const getAllPurchaseOrders = async (tenantDb) => {
    const orders = await tenantDb
        .select({
            id: purchaseOrders.id,
            supplierId: purchaseOrders.supplierId,
            supplierName: suppliers.name,
            status: purchaseOrders.status,
            createdAt: purchaseOrders.createdAt,
            updatedAt: purchaseOrders.updatedAt
        })
        .from(purchaseOrders)
        .innerJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
        .orderBy(desc(purchaseOrders.createdAt));
    const allItems = await tenantDb
        .select({
            id: purchaseOrderItems.id,
            purchaseOrderId: purchaseOrderItems.purchaseOrderId,
            ingredientId: purchaseOrderItems.ingredientId,
            ingredientName: ingredients.name,
            unitOfMeasure: ingredients.unitOfMeasure,
            quantity: purchaseOrderItems.quantity,
            unitPrice: purchaseOrderItems.unitPrice
        })
        .from(purchaseOrderItems)
        .innerJoin(ingredients, eq(purchaseOrderItems.ingredientId, ingredients.id));
    return orders.map(order => ({
        ...order,
        items: allItems.filter(item => item.purchaseOrderId === order.id)
    }));
};

export const receivePurchaseOrder = async (tenantDb, orderId) => {
    const [order] = await tenantDb.select().from(purchaseOrders).where(eq(purchaseOrders.id, orderId)).limit(1);
    
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "pending") throw new Error("ORDER_NOT_PENDING");

    const items = await tenantDb.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, orderId));
    await tenantDb.transaction(async (tx) => {
        // 1. Marcar como recibida
        await tx.update(purchaseOrders)
            .set({ status: "received", updatedAt: new Date() })
            .where(eq(purchaseOrders.id, orderId));
        for (const item of items) {
            await tx.update(inventory)
                .set({ currentStock: sql`${inventory.currentStock} + ${item.quantity}` })
                .where(eq(inventory.ingredientId, item.ingredientId));
            await tx.insert(inventoryMovements).values({
                id: randomUUID(),
                type: "ENTRADA",
                quantity: item.quantity,
                reason: `Recepción de Orden de Compra #${orderId.slice(0,6)}`,
                ingredientId: item.ingredientId,
                purchaseOrderId: orderId,
                date: new Date()
            });
        }
    });
};

export const cancelPurchaseOrder = async (tenantDb, orderId) => {
    const [order] = await tenantDb.select().from(purchaseOrders).where(eq(purchaseOrders.id, orderId)).limit(1);
    
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "pending") throw new Error("ORDER_NOT_PENDING"); 

    await tenantDb.update(purchaseOrders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(purchaseOrders.id, orderId));
};