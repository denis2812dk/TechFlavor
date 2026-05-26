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
        const { name, phone, email, address } = req.body;

        if (!requiredText(name)) {
            return res.status(400).json({ success: false, message: "El nombre del proveedor es obligatorio." });
        }

        const supplierId = await supplierService.createSupplier(req.tenantDb, { name, phone, email, address });
        res.status(201).json({ success: true, message: "Proveedor registrado.", supplierId });
    } catch (error) { next(error); }
};

export const updateSupplier = async (req, res, next) => {
    try {
        const { supplierId } = req.params;
        const { name, phone, email, address, isActive } = req.body;

        if (!requiredText(name)) {
            return res.status(400).json({ success: false, message: "El nombre no puede estar vacío." });
        }

        await supplierService.updateSupplier(req.tenantDb, supplierId, { name, phone, email, address, isActive });
        res.json({ success: true, message: "Proveedor actualizado." });
    } catch (error) {
        if (error.message === "SUPPLIER_NOT_FOUND") return res.status(404).json({ success: false, message: "Proveedor no encontrado." });
        next(error);
    }
};

export const deleteSupplier = async (req, res, next) => {
    try {
        await supplierService.deleteSupplier(req.tenantDb, req.params.supplierId);
        res.json({ success: true, message: "Proveedor eliminado." });
    } catch (error) {
        if (error.message === "SUPPLIER_NOT_FOUND") return res.status(404).json({ success: false, message: "Proveedor no encontrado." });
        if (error.message === "SUPPLIER_HAS_ORDERS") return res.status(409).json({ success: false, message: "No puedes eliminar un proveedor al que ya le has hecho compras. Considera desactivarlo." });
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