import { randomUUID } from "crypto";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import {
    ingredients,
    inventory,
    inventoryMovements,
    productIngredients,
    restaurantSettings,
    purchaseOrderItems,
    orderItems,
    menuComboItems
} from "../models/tenantSchema.js";

const getRequiredProductsMap = async (tenantDb, saleItems) => {
    const productQuantities = {};

    for (const item of saleItems) {
        if (item.itemType === "product") {
            productQuantities[item.itemId] = (productQuantities[item.itemId] || 0) + item.quantity;
        } else if (item.itemType === "combo") {
            const comboParts = await tenantDb.select().from(menuComboItems).where(eq(menuComboItems.comboId, item.itemId));
            for (const part of comboParts) {
                const totalPartQty = part.quantity * item.quantity;
                productQuantities[part.productId] = (productQuantities[part.productId] || 0) + totalPartQty;
            }
        }
    }
    return productQuantities;
};

export const validateInventoryForOrder = async (tenantDb, saleItems) => {
    const [settings] = await tenantDb.select({ allowInventory: restaurantSettings.allowInventory }).from(restaurantSettings).limit(1);
    if (!settings?.allowInventory) return { valid: true };

    const productQuantities = await getRequiredProductsMap(tenantDb, saleItems);
    const productIds = Object.keys(productQuantities);
    
    if (productIds.length === 0) return { valid: true };

    const recipes = await tenantDb.select().from(productIngredients).where(inArray(productIngredients.productId, productIds));
    if (recipes.length === 0) return { valid: true };

    const requiredIngredients = {};
    for (const recipeItem of recipes) {
        const qtyNeeded = Number(recipeItem.quantity) * productQuantities[recipeItem.productId];
        requiredIngredients[recipeItem.ingredientId] = (requiredIngredients[recipeItem.ingredientId] || 0) + qtyNeeded;
    }

    const ingredientIds = Object.keys(requiredIngredients);
    const currentStocks = await tenantDb
        .select({
            id: inventory.ingredientId,
            name: ingredients.name,
            unit: ingredients.unitOfMeasure,
            stock: inventory.currentStock
        })
        .from(inventory)
        .innerJoin(ingredients, eq(ingredients.id, inventory.ingredientId))
        .where(inArray(inventory.ingredientId, ingredientIds));

    for (const stockRow of currentStocks) {
        const required = requiredIngredients[stockRow.id];
        const available = Number(stockRow.stock);

        if (available < required) {
            return { 
                valid: false, 
                message: `Stock insuficiente de "${stockRow.name}". Necesitas ${required.toFixed(2)} ${stockRow.unit}, pero solo quedan ${available.toFixed(2)} ${stockRow.unit}.` 
            };
        }
    }

    return { valid: true };
};

export const getCatalogStockStatus = async (tenantDb) => {
    const [settings] = await tenantDb.select({ allowInventory: restaurantSettings.allowInventory }).from(restaurantSettings).limit(1);
    
    if (!settings?.allowInventory) {
        return { productsStock: {}, combosStock: {} }; 
    }

    const allInventory = await tenantDb.select().from(inventory);
    const stockMap = {};
    allInventory.forEach(inv => {
        stockMap[inv.ingredientId] = Number(inv.currentStock);
    });

    const recipes = await tenantDb.select().from(productIngredients);
    const productRecipes = {};
    recipes.forEach(r => {
        if (!productRecipes[r.productId]) productRecipes[r.productId] = [];
        productRecipes[r.productId].push({ ingredientId: r.ingredientId, qty: Number(r.quantity) });
    });

    const productsStock = {};
    for (const [productId, reqs] of Object.entries(productRecipes)) {
        let canMakeAtLeastOne = true;
        for (const req of reqs) {
            const available = stockMap[req.ingredientId] || 0;
            if (available < req.qty) {
                canMakeAtLeastOne = false;
                break;
            }
        }
        productsStock[productId] = canMakeAtLeastOne;
    }

    const comboItems = await tenantDb.select().from(menuComboItems);
    const combosMap = {};
    comboItems.forEach(ci => {
        if (!combosMap[ci.comboId]) combosMap[ci.comboId] = [];
        combosMap[ci.comboId].push({ productId: ci.productId, qty: Number(ci.quantity) });
    });

    const combosStock = {};
    for (const [comboId, items] of Object.entries(combosMap)) {
        let canMakeCombo = true;
        for (const item of items) {
            const isProductAvailable = productsStock[item.productId] !== false; 
            if (!isProductAvailable) {
                canMakeCombo = false;
                break;
            }
        }
        combosStock[comboId] = canMakeCombo;
    }

    return { productsStock, combosStock };
};

export const deductInventoryForOrder = async (tenantDb, orderId, saleItems) => {
    const [settings] = await tenantDb.select({ allowInventory: restaurantSettings.allowInventory }).from(restaurantSettings).limit(1);
    if (!settings?.allowInventory) return;

    const productQuantities = await getRequiredProductsMap(tenantDb, saleItems);
    const productIds = Object.keys(productQuantities);
    
    if (productIds.length === 0) return;

    const recipes = await tenantDb.select().from(productIngredients).where(inArray(productIngredients.productId, productIds));
    if (recipes.length === 0) return;

    const ingredientDeductions = {};
    for (const recipeItem of recipes) {
        const totalNeeded = Number(recipeItem.quantity) * productQuantities[recipeItem.productId];
        ingredientDeductions[recipeItem.ingredientId] = (ingredientDeductions[recipeItem.ingredientId] || 0) + totalNeeded;
    }
    
    await tenantDb.transaction(async (tx) => {
        const movements = [];
        
        for (const [ingredientId, totalNeeded] of Object.entries(ingredientDeductions)) {
            await tx.update(inventory)
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

export const restockInventoryForOrder = async (tenantDb, orderId, reason = "Orden Cancelada / Editada") => {
    const [settings] = await tenantDb
        .select({ allowInventory: restaurantSettings.allowInventory })
        .from(restaurantSettings)
        .limit(1);

    if (!settings?.allowInventory) return;

    const items = await tenantDb.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    if (items.length === 0) return;

    const productQuantities = {};

    for (const item of items) {
        if (item.itemType === "product") {
            productQuantities[item.itemId] = (productQuantities[item.itemId] || 0) + item.quantity;
        } else if (item.itemType === "combo") {
            const comboParts = await tenantDb.select().from(menuComboItems).where(eq(menuComboItems.comboId, item.itemId));
            for (const part of comboParts) {
                const totalPartQty = part.quantity * item.quantity;
                productQuantities[part.productId] = (productQuantities[part.productId] || 0) + totalPartQty;
            }
        }
    }

    const productIds = Object.keys(productQuantities);
    if (productIds.length === 0) return;

    const ingredientsUsed = await tenantDb.select().from(productIngredients).where(inArray(productIngredients.productId, productIds));
    const ingredientRestockMap = {};
    for (const pi of ingredientsUsed) {
        const qtyToRestore = Number(pi.quantity) * productQuantities[pi.productId];
        ingredientRestockMap[pi.ingredientId] = (ingredientRestockMap[pi.ingredientId] || 0) + qtyToRestore;
    }
    
    await tenantDb.transaction(async (tx) => {
        const movements = [];
        
        for (const [ingredientId, qty] of Object.entries(ingredientRestockMap)) {
            await tx.update(inventory)
                .set({ currentStock: sql`${inventory.currentStock} + ${qty}` })
                .where(eq(inventory.ingredientId, ingredientId));

            movements.push({
                id: randomUUID(),
                type: "ENTRADA",
                quantity: qty,
                reason: reason,
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