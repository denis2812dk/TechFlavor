import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { menuProducts, productIngredients } from "../models/tenantSchema.js";

export const updateProductRecipe = async (tenantDb, productId, ingredientsList) => {
    return await tenantDb.transaction(async (tx) => {
        await tx.delete(productIngredients)
            .where(eq(productIngredients.productId, productId));
        if (ingredientsList && ingredientsList.length > 0) {
            const newRows = ingredientsList.map(item => ({
                id: randomUUID(),
                productId: productId,
                ingredientId: item.ingredientId,
                quantity: item.quantity.toFixed(2)
            }));
            
            await tx.insert(productIngredients).values(newRows);
        }
        
        return true;
    });
};

export const softDeleteProduct = async (tenantDb, productId) => {
    await tenantDb.update(menuProducts)
        .set({ 
            isActive: false, 
            updatedAt: new Date() 
        })
        .where(eq(menuProducts.id, productId));
};