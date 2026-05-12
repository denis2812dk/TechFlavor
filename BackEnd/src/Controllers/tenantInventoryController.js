import * as inventoryService from "../services/tenantInventoryService.js";

const requiredText = (value) => typeof value === "string" && value.trim().length > 0;

const parseQuantity = (qty) => {
    const parsed = Number(qty);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed.toFixed(2);
};

export const registerShrinkage = async (req, res, next) => {
    try {
        const { ingredientId, reason } = req.body;
        const quantity = parseQuantity(req.body.quantity);

        if (!requiredText(ingredientId) || !requiredText(reason) || quantity === null) {
            return res.status(400).json({
                success: false,
                message: "Se requiere el ingrediente, una cantidad válida (mayor a 0) y el motivo de la merma.",
            });
        }

        const movementId = await inventoryService.createShrinkageRecord(req.tenantDb, {
            ingredientId,
            quantity,
            reason: reason.trim()
        });

        res.status(201).json({
            success: true,
            message: "Merma registrada correctamente y stock actualizado.",
            movementId
        });
    } catch (error) {
        if (error.message === "INGREDIENT_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Ingrediente no encontrado." });
        }
        next(error);
    }
};

export const registerSupplierIncidence = async (req, res, next) => {
    try {
        const { supplierId, description } = req.body;

        // 1. Validación de entrada
        if (!requiredText(supplierId) || !requiredText(description)) {
            return res.status(400).json({
                success: false,
                message: "Se requiere seleccionar un proveedor y detallar la descripción de la falla.",
            });
        }

        const incidenceId = await inventoryService.createSupplierIncidence(req.tenantDb, {
            supplierId,
            description: description.trim()
        });
        res.status(201).json({
            success: true,
            message: "Incidencia con el proveedor registrada en la bitácora.",
            incidenceId
        });
    } catch (error) {
        if (error.message === "SUPPLIER_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Proveedor no encontrado." });
        }
        next(error);
    }
};