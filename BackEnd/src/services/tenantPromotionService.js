import { randomUUID } from "crypto";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { promotions, promotionTargets } from "../models/tenantSchema.js";

// ==========================================
// SERVICIOS DE PROMOCIÓN
// ==========================================

export const createPromotion = async (tenantDb, data) => {
    const promotionId = randomUUID();

    await tenantDb.transaction(async (tx) => {
        await tx.insert(promotions).values({
            id: promotionId,
            code: data.code,
            name: data.name,
            description: data.description,
            discountType: data.discountType,
            discountValue: data.discountValue,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            isActive: data.isActive !== undefined ? data.isActive : true,
        });

        if (data.targets && data.targets.length > 0) {
            const targetsToInsert = data.targets.map(target => ({
                id: randomUUID(),
                promotionId,
                targetType: target.targetType,
                targetId: target.targetId || null,
            }));
            await tx.insert(promotionTargets).values(targetsToInsert);
        }
    });

    return promotionId;
};

export const getActivePromotions = async (tenantDb) => {
    const now = new Date();

    const activePromos = await tenantDb
        .select()
        .from(promotions)
        .where(
            and(
                eq(promotions.isActive, true),
                lte(promotions.startDate, now),
                gte(promotions.endDate, now)
            )
        );

    const promosWithTargets = [];
    for (const promo of activePromos) {
        const targets = await tenantDb
            .select()
            .from(promotionTargets)
            .where(eq(promotionTargets.promotionId, promo.id));
        
        promosWithTargets.push({ ...promo, targets });
    }

    return promosWithTargets;
};

export const getAllPromotions = async (tenantDb) => {
    const allPromos = await tenantDb
        .select()
        .from(promotions)
        .orderBy(desc(promotions.createdAt));

    const promosWithTargets = [];
    for (const promo of allPromos) {
        const targets = await tenantDb
            .select()
            .from(promotionTargets)
            .where(eq(promotionTargets.promotionId, promo.id));
        
        promosWithTargets.push({ ...promo, targets });
    }

    return promosWithTargets;
};

export const updatePromotion = async (tenantDb, promotionId, data) => {
    const [currentPromo] = await tenantDb.select()
        .from(promotions)
        .where(eq(promotions.id, promotionId))
        .limit(1);

    if (!currentPromo) {
        throw new Error("PROMOTION_NOT_FOUND");
    }

    const now = new Date();
    if (new Date(currentPromo.startDate) <= now) {
        throw new Error("PROMOTION_ALREADY_STARTED");
    }
    
    await tenantDb.transaction(async (tx) => {
        await tx.update(promotions).set({
            code: data.code,
            name: data.name,
            description: data.description,
            discountType: data.discountType,
            discountValue: data.discountValue,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            isActive: data.isActive !== undefined ? data.isActive : true,
            updatedAt: new Date()
        }).where(eq(promotions.id, promotionId));

        await tx.delete(promotionTargets).where(eq(promotionTargets.promotionId, promotionId));
        
        if (data.targets && data.targets.length > 0) {
            const targetsToInsert = data.targets.map(target => ({
                id: randomUUID(),
                promotionId,
                targetType: target.targetType,
                targetId: target.targetId || null,
            }));
            await tx.insert(promotionTargets).values(targetsToInsert);
        }
    });
};

export const softDeletePromotion = async (tenantDb, promotionId) => {
    const [currentPromo] = await tenantDb.select()
        .from(promotions)
        .where(eq(promotions.id, promotionId))
        .limit(1);

    if (!currentPromo) {
        throw new Error("PROMOTION_NOT_FOUND");
    }

    const now = new Date();
    if (new Date(currentPromo.endDate) < now) {
        throw new Error("PROMOTION_ALREADY_EXPIRED");
    }

    await tenantDb.update(promotions)
        .set({ 
            isActive: false, 
            updatedAt: new Date() 
        })
        .where(eq(promotions.id, promotionId));
};