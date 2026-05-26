import { randomUUID } from "crypto";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import {
    ingredients,
    inventory,
    inventoryMovements,
    productIngredients,
    restaurantSettings,
    purchaseOrderItems 
} from "../models/tenantSchema.js";

/**
 * ==========================================
 * HU 11: Descuento de Inventario por Venta 
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
                type: "SALIDA", 
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

export const createIngredient = async (tenantDb, { name, unitOfMeasure, currentStock }) => {
    const normalizedName = name.trim();
    const [existingIngredient] = await tenantDb
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(eq(ingredients.name, normalizedName))
        .limit(1);

    if (existingIngredient) {
        throw new Error("INGREDIENT_NAME_EXISTS");
    }

    const ingredientId = randomUUID();

    await tenantDb.transaction(async (tx) => {
        await tx.insert(ingredients).values({
            id: ingredientId,
            name: normalizedName,
            unitOfMeasure: unitOfMeasure.trim(),
        });

        await tx.insert(inventory).values({
            id: randomUUID(),
            ingredientId,
            currentStock,
        });
    });

    return ingredientId;
};

export const updateIngredient = async (tenantDb, ingredientId, { name, unitOfMeasure, currentStock }) => {
    const [ingredientExists] = await tenantDb
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(eq(ingredients.id, ingredientId))
        .limit(1);

    if (!ingredientExists) {
        throw new Error("INGREDIENT_NOT_FOUND");
    }

    const normalizedName = name.trim();
    const [duplicatedName] = await tenantDb
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(and(eq(ingredients.name, normalizedName), ne(ingredients.id, ingredientId)))
        .limit(1);

    if (duplicatedName) {
        throw new Error("INGREDIENT_NAME_EXISTS");
    }

    await tenantDb.transaction(async (tx) => {
        await tx
            .update(ingredients)
            .set({
                name: normalizedName,
                unitOfMeasure: unitOfMeasure.trim(),
            })
            .where(eq(ingredients.id, ingredientId));

        await tx
            .update(inventory)
            .set({ currentStock })
            .where(eq(inventory.ingredientId, ingredientId));
    });
};

export const deleteIngredient = async (tenantDb, ingredientId) => {
    const [ingredientExists] = await tenantDb
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(eq(ingredients.id, ingredientId))
        .limit(1);

    if (!ingredientExists) {
        throw new Error("INGREDIENT_NOT_FOUND");
    }

    const [usedInRecipe] = await tenantDb
        .select({ id: productIngredients.id })
        .from(productIngredients)
        .where(eq(productIngredients.ingredientId, ingredientId))
        .limit(1);

    if (usedInRecipe) {
        throw new Error("INGREDIENT_IN_USE");
    }

    const [usedInPurchase] = await tenantDb
        .select({ id: purchaseOrderItems.id })
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.ingredientId, ingredientId))
        .limit(1);

    if (usedInPurchase) {
        throw new Error("INGREDIENT_IN_PURCHASE_ORDER");
    }

    await tenantDb
        .delete(ingredients)
        .where(eq(ingredients.id, ingredientId));
};

export const getAllIngredients = async (tenantDb) => {
    return await tenantDb
        .select({
            id: ingredients.id,
            name: ingredients.name,
            unitOfMeasure: ingredients.unitOfMeasure,
            currentStock: inventory.currentStock,
        })
        .from(ingredients)
        .innerJoin(inventory, eq(inventory.ingredientId, ingredients.id))
        .orderBy(asc(ingredients.name)); 
};