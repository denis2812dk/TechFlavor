import { randomUUID } from "crypto";
import { desc, eq, sql } from "drizzle-orm";
import {
    menuCombos,
    menuProducts,
    orderItems,
    orders,
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

const ignoreDuplicateColumn = (error) => {
    if (error?.cause?.code === "ER_DUP_FIELDNAME" || error?.code === "ER_DUP_FIELDNAME") return;
    throw error;
};

const ensureOrderColumns = async (tenantDb) => {
    try {
        await tenantDb.execute(sql`
            ALTER TABLE orders
            ADD COLUMN fulfillment_type varchar(30) NOT NULL DEFAULT 'takeaway' AFTER status
        `);
    } catch (error) {
        ignoreDuplicateColumn(error);
    }

    try {
        await tenantDb.execute(sql`
            ALTER TABLE orders
            ADD COLUMN table_identifier varchar(60) NULL AFTER fulfillment_type
        `);
    } catch (error) {
        ignoreDuplicateColumn(error);
    }

    try {
        await tenantDb.execute(sql`
            ALTER TABLE orders
            ADD COLUMN cashier_user_id varchar(36) NOT NULL DEFAULT 'legacy' AFTER total
        `);
    } catch (error) {
        ignoreDuplicateColumn(error);
    }

    try {
        await tenantDb.execute(sql`
            ALTER TABLE orders
            ADD COLUMN cashier_name varchar(120) NOT NULL DEFAULT 'Sin responsable' AFTER cashier_user_id
        `);
    } catch (error) {
        ignoreDuplicateColumn(error);
    }
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
        name: combo.name,
        unitPrice: Number(combo.price),
        quantity: item.quantity,
    };
};

export const createTenantOrder = async (req, res, next) => {
    try {
        // Los datos en req.body ya han sido validados y formateados por Zod en el middleware.
        const { items, fulfillmentType, tableIdentifier } = req.body;

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

        const subtotal = saleItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const total = subtotal;
        const orderId = randomUUID();
        const ticketCode = createTicketCode();

        const order = {
            id: orderId,
            ticketCode,
            status: "in_preparation",
            fulfillmentType,
            tableIdentifier: fulfillmentType === "dine_in" ? tableIdentifier : null,
            subtotal: money(subtotal),
            total: money(total),
            cashierUserId: req.user.id,
            cashierName: req.user.name || req.user.email || "Usuario de caja",
        };

        await ensureOrderColumns(req.tenantDb);
        await req.tenantDb.insert(orders).values(order);
        
        await req.tenantDb.insert(orderItems).values(saleItems.map((item) => ({
            id: randomUUID(),
            orderId,
            itemType: item.itemType,
            itemId: item.itemId,
            name: item.name,
            unitPrice: money(item.unitPrice),
            quantity: item.quantity,
            lineTotal: money(item.unitPrice * item.quantity),
        })));

        // Procesar el descuento de inventario
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
                    lineTotal: money(item.unitPrice * item.quantity),
                })),
                subtotal: order.subtotal,
                total: order.total,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const listTenantOrders = async (req, res, next) => {
    try {
        await ensureOrderColumns(req.tenantDb);

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
        await ensureOrderColumns(req.tenantDb);

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

        await ensureOrderColumns(req.tenantDb);

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
        await ensureOrderColumns(req.tenantDb);

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

        await ensureOrderColumns(req.tenantDb);

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