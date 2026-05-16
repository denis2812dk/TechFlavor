import * as inventoryService from "../services/tenantInventoryService.js";

const requiredText = (value) => typeof value === "string" && value.trim().length > 0;

const parseQuantity = (qty) => {
    const parsed = Number(qty);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed.toFixed(2);
};

const parseStock = (qty) => {
    const parsed = Number(qty);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
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

 //Actualización de Receta (Transaccional)
export const updateProductRecipe = async (tenantDb, productId, ingredientsList) => {
    return await tenantDb.transaction(async (tx) => {
        await tx.delete(productIngredients)
            .where(eq(productIngredients.productId, productId));
        if (ingredientsList.length > 0) {
            const newRows = ingredientsList.map(item => ({
                id: randomUUID(),
                productId: productId,
                ingredientId: item.ingredientId,
                quantity: item.quantity.toFixed(2)
            }));
            
            await tx.insert(productIngredients).values(newRows);
        }
        
        return { success: true };
    });
};

 // Borrado (Soft Delete) de Producto

export const softDeleteProduct = async (tenantDb, productId) => {
    await tenantDb.update(menuProducts)
        .set({ 
            isActive: false,
            updatedAt: new Date() 
        })
        .where(eq(menuProducts.id, productId));
};
export const createIngredient = async (req, res, next) => {
    try {
        const { name, unitOfMeasure } = req.body;
        const currentStock = parseStock(req.body.currentStock ?? 0);

        if (!requiredText(name) || !requiredText(unitOfMeasure) || currentStock === null) {
            return res.status(400).json({
                success: false,
                message: "Se requiere nombre, unidad de medida y stock inicial valido.",
            });
        }

        const ingredientId = await inventoryService.createIngredient(req.tenantDb, {
            name,
            unitOfMeasure,
            currentStock,
        });

        res.status(201).json({
            success: true,
            message: "Ingrediente creado correctamente.",
            ingredientId,
        });
    } catch (error) {
        if (error.message === "INGREDIENT_NAME_EXISTS") {
            return res.status(409).json({ success: false, message: "Ya existe un ingrediente con ese nombre." });
        }
        next(error);
    }
};

export const updateIngredient = async (req, res, next) => {
    try {
        const { ingredientId } = req.params;
        const { name, unitOfMeasure } = req.body;
        const currentStock = parseStock(req.body.currentStock ?? 0);

        if (!requiredText(name) || !requiredText(unitOfMeasure) || currentStock === null) {
            return res.status(400).json({
                success: false,
                message: "Se requiere nombre, unidad de medida y stock valido.",
            });
        }

        await inventoryService.updateIngredient(req.tenantDb, ingredientId, {
            name,
            unitOfMeasure,
            currentStock,
        });

        res.json({
            success: true,
            message: "Ingrediente actualizado correctamente.",
        });
    } catch (error) {
        if (error.message === "INGREDIENT_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Ingrediente no encontrado." });
        }
        if (error.message === "INGREDIENT_NAME_EXISTS") {
            return res.status(409).json({ success: false, message: "Ya existe un ingrediente con ese nombre." });
        }
        next(error);
    }
};

export const deleteIngredient = async (req, res, next) => {
    try {
        await inventoryService.deleteIngredient(req.tenantDb, req.params.ingredientId);

        res.json({
            success: true,
            message: "Ingrediente eliminado correctamente.",
        });
    } catch (error) {
        if (error.message === "INGREDIENT_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "Ingrediente no encontrado." });
        }
        if (error.message === "INGREDIENT_IN_USE") {
            return res.status(409).json({
                success: false,
                message: "No puedes eliminar este ingrediente porque esta ligado a una receta. Primero quitalo del producto.",
            });
        }
        next(error);
    }
};

export const listIngredients = async (req, res, next) => {
    try {
        const ingredientsList = await inventoryService.getAllIngredients(req.tenantDb);

        res.json({
            success: true,
            ingredients: ingredientsList,
        });
    } catch (error) {
        next(error);
    }
};
