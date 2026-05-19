import { randomUUID } from "crypto";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { promotions, promotionTargets } from "../models/tenantSchema.js";

export const ensurePromotionTables = async (tenantDb) => {
    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS promotions (
            id varchar(36) NOT NULL,
            name varchar(120) NOT NULL,
            description text,
            discount_type varchar(20) NOT NULL,
            discount_value decimal(10,2) NOT NULL,
            start_date timestamp NOT NULL,
            end_date timestamp NOT NULL,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS promotion_targets (
            id varchar(36) NOT NULL,
            promotion_id varchar(36) NOT NULL,
            target_type varchar(20) NOT NULL,
            target_id varchar(36),
            PRIMARY KEY (id),
            CONSTRAINT promotion_targets_promotion_id_fk
                FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
        )
    `);
};

// ==========================================
// SERVICIOS DE PROMOCIÓN
// ==========================================
export const createPromotion = async (tenantDb, data) => {
    await ensurePromotionTables(tenantDb);

    const promotionId = randomUUID();

    await tenantDb.transaction(async (tx) => {
        await tx.insert(promotions).values({
            id: promotionId,
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
    await ensurePromotionTables(tenantDb);

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