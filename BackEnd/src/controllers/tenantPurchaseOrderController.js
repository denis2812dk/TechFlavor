import * as purchaseOrderService from "../services/tenantPurchaseOrderService.js";

export const listPurchaseOrders = async (req, res, next) => {
    try {
        const orders = await purchaseOrderService.getAllPurchaseOrders(req.tenantDb);
        res.json({ success: true, orders });
    } catch (error) { next(error); }
};

export const createPurchaseOrder = async (req, res, next) => {
    try {
        const { supplierId, items } = req.body;
        const orderId = await purchaseOrderService.createPurchaseOrder(req.tenantDb, supplierId, items);
        
        res.status(201).json({ 
            success: true, 
            message: "Orden de compra generada correctamente.", 
            orderId 
        });
    } catch (error) { next(error); }
};

export const receivePurchaseOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        await purchaseOrderService.receivePurchaseOrder(req.tenantDb, orderId);
        
        res.json({ 
            success: true, 
            message: "Orden recibida. El inventario ha sido actualizado automáticamente." 
        });
    } catch (error) {
        if (error.message === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: "Orden no encontrada." });
        if (error.message === "ORDER_NOT_PENDING") return res.status(400).json({ success: false, message: "La orden ya fue procesada o cancelada previamente." });
        next(error);
    }
};

export const cancelPurchaseOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        await purchaseOrderService.cancelPurchaseOrder(req.tenantDb, orderId);
        
        res.json({ success: true, message: "Orden de compra cancelada." });
    } catch (error) {
        if (error.message === "ORDER_NOT_FOUND") return res.status(404).json({ success: false, message: "Orden no encontrada." });
        if (error.message === "ORDER_NOT_PENDING") return res.status(400).json({ success: false, message: "Solo puedes cancelar órdenes pendientes." });
        next(error);
    }
};