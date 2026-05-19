import * as promotionService from "../services/tenantPromotionService.js";

export const createTenantPromotion = async (req, res, next) => {
    try {
        const promotionData = req.body;

        const promotionId = await promotionService.createPromotion(req.tenantDb, promotionData);

        res.status(201).json({
            success: true,
            message: "Promoción creada y programada correctamente.",
            promotionId
        });
    } catch (error) {
        next(error);
    }
};

export const listActivePromotions = async (req, res, next) => {
    try {
        const activePromotions = await promotionService.getActivePromotions(req.tenantDb);

        res.json({
            success: true,
            promotions: activePromotions
        });
    } catch (error) {
        next(error);
    }
};