import { randomUUID } from "crypto";
import { eq, inArray, sql } from "drizzle-orm";
import {
    ingredients,
    inventory,
    inventoryMovements,
    productIngredients,
    restaurantSettings,
    supplierIncidences,
    suppliers
} from "../models/tenantSchema.js";

/**
 * ==========================================
 * HU 11: Descuento de Inventario por Venta (BOM)
 * ==========================================
 */
export const deductInventoryForOrder = async (tenantDb, orderId, saleItems) => {
    const [settings] = await tenantDb
        .select({ allowInventory: restaurantSettings.allowInventory })
        .from(restaurantSettings)
        .limit(1);

    if (!settings?.allowInventory) return;

    const productIds = saleItems
        .filter(item => item.itemType === "product")
        .map(item => item.itemId);

    if (productIds.length === 0) return;

    const recipes = await tenantDb
        .select()
        .from(productIngredients)
        .where(inArray(productIngredients.productId, productIds));

    if (recipes.length === 0) return;

    const ingredientDeductions = {};
    for (const saleItem of saleItems) {
        if (saleItem.itemType !== "product") continue;
        
        const productRecipe = recipes.filter(r => r.productId === saleItem.itemId);
        for (const recipeItem of productRecipe) {
            const totalNeeded = Number(recipeItem.quantity) * saleItem.quantity;
            
            if (!ingredientDeductions[recipeItem.ingredientId]) {
                ingredientDeductions[recipeItem.ingredientId] = 0;
            }
            ingredientDeductions[recipeItem.ingredientId] += totalNeeded;
        }
    }

    // 5. Aplicar descuentos de forma atómica usando transacciones
    await tenantDb.transaction(async (tx) => {
        const movements = [];
        
        for (const [ingredientId, totalNeeded] of Object.entries(ingredientDeductions)) {
            // Actualizar el stock (permite negativos)
            await tx
                .update(inventory)
                .set({ currentStock: sql`${inventory.currentStock} - ${totalNeeded}` })
                .where(eq(inventory.ingredientId, ingredientId));

            movements.push({
                id: randomUUID(),
                type: "SALIDA", // Coincide con el ENUM del diccionario de tipos de movimiento
                quantity: totalNeeded,
                reason: `Venta - Pedido ${orderId}`,
                ingredientId: ingredientId,
                orderId: orderId,
                date: new Date()
            });
        }

        if (movements.length > 0) {
            await tx.insert(inventoryMovements).values(movements);
        }
    });
};

export const createShrinkageRecord = async (tenantDb, { ingredientId, quantity, reason }) => {
    const [ingredientExists] = await tenantDb
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(eq(ingredients.id, ingredientId))
        .limit(1);

    if (!ingredientExists) {
        throw new Error("INGREDIENT_NOT_FOUND");
    }

    const movementId = randomUUID();

    await tenantDb.transaction(async (tx) => {
        await tx.insert(inventoryMovements).values({
            id: movementId,
            type: "MERMA", 
            quantity: quantity,
            reason: reason,
            ingredientId: ingredientId,
            date: new Date()
        });

        await tx.update(inventory)
            .set({ currentStock: sql`${inventory.currentStock} - ${quantity}` })
            .where(eq(inventory.ingredientId, ingredientId));
    });

    return movementId;
};

export const createSupplierIncidence = async (tenantDb, { supplierId, description }) => {
    const [supplierExists] = await tenantDb
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(eq(suppliers.id, supplierId))
        .limit(1);

    if (!supplierExists) {
        throw new Error("SUPPLIER_NOT_FOUND");
    }

    const incidenceId = randomUUID();

    await tenantDb.insert(supplierIncidences).values({
        id: incidenceId,
        supplierId,
        description,
        status: "ABIERTA", 
        date: new Date()
    });

    return incidenceId;
};