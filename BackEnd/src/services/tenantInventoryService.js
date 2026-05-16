import { randomUUID } from "crypto";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import {
    ingredients,
    inventory,
    inventoryMovements,
    productIngredients,
    restaurantSettings,
    supplierIncidences,
    suppliers
} from "../models/tenantSchema.js";

export const ensureInventoryTables = async (tenantDb) => {
    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS ingredients (
            id varchar(36) NOT NULL,
            name varchar(150) NOT NULL,
            unit_measure varchar(50) NOT NULL,
            PRIMARY KEY (id)
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS inventory (
            id varchar(36) NOT NULL,
            ingredient_id varchar(36) NOT NULL,
            current_stock decimal(10,2) NOT NULL DEFAULT 0.00,
            PRIMARY KEY (id),
            UNIQUE KEY inventory_ingredient_id_unique (ingredient_id),
            CONSTRAINT inventory_ingredient_id_fk
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS product_ingredients (
            id varchar(36) NOT NULL,
            product_id varchar(36) NOT NULL,
            ingredient_id varchar(36) NOT NULL,
            quantity decimal(10,2) NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT product_ingredients_product_id_fk
                FOREIGN KEY (product_id) REFERENCES menu_products(id) ON DELETE CASCADE,
            CONSTRAINT product_ingredients_ingredient_id_fk
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS inventory_movements (
            id varchar(36) NOT NULL,
            type varchar(20) NOT NULL,
            quantity decimal(10,2) NOT NULL,
            date timestamp DEFAULT CURRENT_TIMESTAMP,
            reason varchar(255),
            ingredient_id varchar(36) NOT NULL,
            order_id varchar(36),
            PRIMARY KEY (id),
            CONSTRAINT inventory_movements_ingredient_id_fk
                FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS suppliers (
            id varchar(36) NOT NULL,
            name varchar(150) NOT NULL,
            contact varchar(150),
            PRIMARY KEY (id)
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS supplier_incidences (
            id varchar(36) NOT NULL,
            supplier_id varchar(36) NOT NULL,
            description text NOT NULL,
            date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            status varchar(20) NOT NULL DEFAULT 'ABIERTA',
            resolution_date timestamp NULL,
            PRIMARY KEY (id),
            CONSTRAINT supplier_incidences_supplier_id_fk
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
        )
    `);
};

/**
 * ==========================================
 * HU 11: Descuento de Inventario por Venta 
 * ==========================================
 */
export const deductInventoryForOrder = async (tenantDb, orderId, saleItems) => {
    await ensureInventoryTables(tenantDb);

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
    await ensureInventoryTables(tenantDb);

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
    await ensureInventoryTables(tenantDb);

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

export const createIngredient = async (tenantDb, { name, unitOfMeasure, currentStock }) => {
    await ensureInventoryTables(tenantDb);

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
    await ensureInventoryTables(tenantDb);

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
    await ensureInventoryTables(tenantDb);

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

    await tenantDb
        .delete(ingredients)
        .where(eq(ingredients.id, ingredientId));
};

export const getAllIngredients = async (tenantDb) => {
    await ensureInventoryTables(tenantDb);

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
