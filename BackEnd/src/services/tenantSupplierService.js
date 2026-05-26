import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { suppliers, supplierIngredients, ingredients } from "../models/tenantSchema.js";
export const createSupplier = async (tenantDb, { name, phone, email, address }) => {
    const supplierId = randomUUID();
    
    await tenantDb.insert(suppliers).values({
        id: supplierId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        isActive: true
    });

    return supplierId;
};

export const updateSupplier = async (tenantDb, supplierId, { name, phone, email, address, isActive }) => {
    const [existing] = await tenantDb.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (!existing) throw new Error("SUPPLIER_NOT_FOUND");

    await tenantDb.update(suppliers)
        .set({ 
            name: name.trim(),
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            address: address?.trim() || null,
            isActive: isActive !== undefined ? isActive : existing.isActive,
            updatedAt: new Date()
        })
        .where(eq(suppliers.id, supplierId));
};

export const deleteSupplier = async (tenantDb, supplierId) => {
    const [existing] = await tenantDb.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (!existing) throw new Error("SUPPLIER_NOT_FOUND");

    try {
        await tenantDb.delete(suppliers).where(eq(suppliers.id, supplierId));
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new Error("SUPPLIER_HAS_ORDERS");
        }
        throw error;
    }
};

export const getAllSuppliers = async (tenantDb) => {
    const allSuppliers = await tenantDb.select().from(suppliers);
    
    const catalog = await tenantDb
        .select({
            supplierId: supplierIngredients.supplierId,
            ingredientId: supplierIngredients.ingredientId,
            ingredientName: ingredients.name,
            unitOfMeasure: ingredients.unitOfMeasure,
            priceReference: supplierIngredients.priceReference,
            isPreferred: supplierIngredients.isPreferred
        })
        .from(supplierIngredients)
        .innerJoin(ingredients, eq(supplierIngredients.ingredientId, ingredients.id));

    // Agrupamos el catálogo dentro de cada proveedor
    return allSuppliers.map(sup => ({
        ...sup,
        catalog: catalog.filter(item => item.supplierId === sup.id)
    }));
};

export const updateSupplierCatalog = async (tenantDb, supplierId, items) => {
    const [existing] = await tenantDb.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (!existing) throw new Error("SUPPLIER_NOT_FOUND");

    await tenantDb.transaction(async (tx) => {
        await tx.delete(supplierIngredients).where(eq(supplierIngredients.supplierId, supplierId));

        if (items && items.length > 0) {
            const newRows = items.map(item => ({
                id: randomUUID(),
                supplierId: supplierId,
                ingredientId: item.ingredientId,
                priceReference: item.priceReference || null,
                isPreferred: item.isPreferred || false
            }));
            await tx.insert(supplierIngredients).values(newRows);
        }
    });
};