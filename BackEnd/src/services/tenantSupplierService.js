import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { 
    suppliers, 
    supplierIngredients, 
    ingredients, 
    inventory, 
    supplierIncidences, 
    inventoryMovements 
} from "../models/tenantSchema.js";


export const createSupplier = async (tenantDb, { name, contactName, dui, nit, phone, email, address }) => {
    const supplierId = randomUUID();
    
    await tenantDb.insert(suppliers).values({
        id: supplierId,
        name: name.trim(),
        contactName: contactName?.trim() || null,
        dui: dui.trim(), 
        nit: nit?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        isActive: true
    });

    return supplierId;
};

export const updateSupplier = async (tenantDb, supplierId, { name, contactName, dui, nit, phone, email, address, isActive }) => {
    const [existing] = await tenantDb.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (!existing) throw new Error("SUPPLIER_NOT_FOUND");

    await tenantDb.update(suppliers)
        .set({ 
            name: name?.trim() || existing.name,
            contactName: contactName !== undefined ? contactName?.trim() : existing.contactName,
            dui: dui?.trim() || existing.dui,
            nit: nit !== undefined ? nit?.trim() : existing.nit,
            phone: phone !== undefined ? phone?.trim() : existing.phone,
            email: email !== undefined ? email?.trim() : existing.email,
            address: address !== undefined ? address?.trim() : existing.address,
            isActive: isActive !== undefined ? isActive : existing.isActive,
            updatedAt: new Date()
        })
        .where(eq(suppliers.id, supplierId));
};

export const softDeleteSupplier = async (tenantDb, supplierId) => {
    const [existing] = await tenantDb.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
    if (!existing) throw new Error("SUPPLIER_NOT_FOUND");

    await tenantDb.update(suppliers)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(suppliers.id, supplierId));
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

        if (!items || items.length === 0) return;

        for (const item of items) {
            let finalIngredientId = item.ingredientId;

            if (!finalIngredientId && item.ingredientName && item.unitOfMeasure) {
                const normalizedName = item.ingredientName.trim();
                
                const [existingIng] = await tx.select().from(ingredients).where(eq(ingredients.name, normalizedName)).limit(1);
                
                if (existingIng) {
                    finalIngredientId = existingIng.id;
                } else {
                    finalIngredientId = randomUUID();
                    await tx.insert(ingredients).values({
                        id: finalIngredientId,
                        name: normalizedName,
                        unitOfMeasure: item.unitOfMeasure.trim()
                    });
                    await tx.insert(inventory).values({
                        id: randomUUID(),
                        ingredientId: finalIngredientId,
                        currentStock: "0.00"
                    });
                }
            }

            if (finalIngredientId) {
                await tx.insert(supplierIngredients).values({
                    id: randomUUID(),
                    supplierId,
                    ingredientId: finalIngredientId,
                    priceReference: item.priceReference || null,
                    isPreferred: item.isPreferred || false
                });
            }
        }
    });
};


export const createIncidence = async (tenantDb, supplierId, description) => {
    const incidenceId = randomUUID();
    await tenantDb.insert(supplierIncidences).values({
        id: incidenceId,
        supplierId,
        description: description.trim(),
        status: "ABIERTA"
    });
    return incidenceId;
};

export const getSupplierIncidences = async (tenantDb, supplierId) => {
    return await tenantDb.select().from(supplierIncidences).where(eq(supplierIncidences.supplierId, supplierId));
};

export const resolveIncidence = async (tenantDb, incidenceId, resolutionData) => {
    const [incidence] = await tenantDb.select().from(supplierIncidences).where(eq(supplierIncidences.id, incidenceId)).limit(1);
    if (!incidence) throw new Error("INCIDENCE_NOT_FOUND");
    if (incidence.status === "RESUELTA") throw new Error("ALREADY_RESOLVED");

    await tenantDb.transaction(async (tx) => {
        await tx.update(supplierIncidences).set({
            status: "RESUELTA",
            resolutionDate: new Date(),
            updatedAt: new Date(),
            description: `${incidence.description} | Resolución: ${resolutionData.notes}`
        }).where(eq(supplierIncidences.id, incidenceId));
        if (resolutionData.action === "DEVOLUCION" && resolutionData.ingredientId && resolutionData.quantityToDeduct > 0) {
            await tx.update(inventory)
                .set({ currentStock: sql`${inventory.currentStock} - ${resolutionData.quantityToDeduct}` })
                .where(eq(inventory.ingredientId, resolutionData.ingredientId));
            await tx.insert(inventoryMovements).values({
                id: randomUUID(),
                type: "SALIDA", 
                quantity: resolutionData.quantityToDeduct,
                reason: `Devolución al proveedor - Incidencia ${incidenceId.slice(0,6)}`,
                ingredientId: resolutionData.ingredientId,
                date: new Date()
            });
        }
    });
};