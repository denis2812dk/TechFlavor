import * as supplierService from "../services/tenantSupplierService.js";

const requiredText = (value) => typeof value === "string" && value.trim().length > 0;
export const listSuppliers = async (req, res, next) => {
    try {
        const suppliersList = await supplierService.getAllSuppliers(req.tenantDb);
        res.json({ success: true, suppliers: suppliersList });
    } catch (error) { next(error); }
};

export const createSupplier = async (req, res, next) => {
    try {
        const { name, contactName, dui, nit, phone, email, address } = req.body;

        if (!requiredText(name) || !requiredText(dui)) {
            return res.status(400).json({ success: false, message: "La Razón Social/Marca y el DUI son obligatorios." });
        }

        const supplierId = await supplierService.createSupplier(req.tenantDb, { name, contactName, dui, nit, phone, email, address });
        res.status(201).json({ success: true, message: "Proveedor registrado.", supplierId });
    } catch (error) { next(error); }
};

export const updateSupplier = async (req, res, next) => {
    try {
        const { supplierId } = req.params;
        const { name, contactName, dui, nit, phone, email, address, isActive } = req.body;

        if (name !== undefined && !requiredText(name)) {
            return res.status(400).json({ success: false, message: "El nombre no puede estar vacío." });
        }

        await supplierService.updateSupplier(req.tenantDb, supplierId, { name, contactName, dui, nit, phone, email, address, isActive });
        res.json({ success: true, message: "Proveedor actualizado." });
    } catch (error) {
        if (error.message === "SUPPLIER_NOT_FOUND") return res.status(404).json({ success: false, message: "Proveedor no encontrado." });
        next(error);
    }
};

export const deleteSupplier = async (req, res, next) => {
    try {
        await supplierService.softDeleteSupplier(req.tenantDb, req.params.supplierId);
        res.json({ success: true, message: "Proveedor desactivado correctamente." });
    } catch (error) {
        if (error.message === "SUPPLIER_NOT_FOUND") return res.status(404).json({ success: false, message: "Proveedor no encontrado." });
        next(error);
    }
};

export const setSupplierCatalog = async (req, res, next) => {
    try {
        const { supplierId } = req.params;
        const { items } = req.body; 

        await supplierService.updateSupplierCatalog(req.tenantDb, supplierId, items);
        res.json({ success: true, message: "Catálogo del proveedor actualizado." });
    } catch (error) {
        if (error.message === "SUPPLIER_NOT_FOUND") return res.status(404).json({ success: false, message: "Proveedor no encontrado." });
        next(error);
    }
};

export const listIncidences = async (req, res, next) => {
    try {
        const incidences = await supplierService.getSupplierIncidences(req.tenantDb, req.params.supplierId);
        res.json({ success: true, incidences });
    } catch (error) { next(error); }
};
export const addIncidence = async (req, res, next) => {
    try {
        const { description, purchaseOrderId } = req.body; 
        if (!requiredText(description)) {
            return res.status(400).json({ success: false, message: "La descripción de la falla es obligatoria." });
        }

        if (!requiredText(purchaseOrderId)) {
            return res.status(400).json({ success: false, message: "Debes seleccionar una compra relacionada." });
        }
        
        const incidenceId = await supplierService.createIncidence(req.tenantDb, req.params.supplierId, description, purchaseOrderId);
        res.status(201).json({ success: true, message: "Incidencia registrada en bitácora.", incidenceId });
    } catch (error) { next(error); }
};
export const resolveSupplierIncidence = async (req, res, next) => {
    try {
        const { incidenceId } = req.params;
        const { notes, action, ingredientId, quantityToDeduct } = req.body;

        if (!requiredText(notes)) {
            return res.status(400).json({ success: false, message: "Debes proveer las notas de cómo se resolvió." });
        }

        await supplierService.resolveIncidence(req.tenantDb, incidenceId, {
            notes, action, ingredientId, quantityToDeduct: Number(quantityToDeduct)
        });

        res.json({ success: true, message: "Incidencia cerrada correctamente." });
    } catch (error) {
        if (error.message === "INCIDENCE_NOT_FOUND") return res.status(404).json({ success: false, message: "Incidencia no encontrada." });
        if (error.message === "ALREADY_RESOLVED") return res.status(400).json({ success: false, message: "Esta incidencia ya fue resuelta previamente." });
        next(error);
    }
};