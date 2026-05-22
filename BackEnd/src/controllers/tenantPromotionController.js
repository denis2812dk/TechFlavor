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
export const listAllPromotions = async (req, res, next) => {
    try {
        const allPromotions = await promotionService.getAllPromotions(req.tenantDb);

        res.json({
            success: true,
            promotions: allPromotions
        });
    } catch (error) {
        next(error);
    }
};
export const updateTenantPromotion = async (req, res, next) => {
    try {
        const { promotionId } = req.params;
        const promotionData = req.body;

        await promotionService.updatePromotion(req.tenantDb, promotionId, promotionData);

        res.json({
            success: true,
            message: "Promoción actualizada correctamente."
        });
    } catch (error) {
        if (error.message === "PROMOTION_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "La promoción no existe." });
        }
        if (error.message === "PROMOTION_ALREADY_STARTED") {
            return res.status(403).json({ 
                success: false, 
                message: "No puedes editar una promoción que ya está en curso o ha finalizado. Desactívala y crea una nueva." 
            });
        }
        if (error?.code === 'ER_DUP_ENTRY' || error?.cause?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "Ese código promocional ya está siendo usado por otra campaña." });
        }
        next(error);
    }
};

export const deleteTenantPromotion = async (req, res, next) => {
    try {
        const { promotionId } = req.params;
        
        await promotionService.softDeletePromotion(req.tenantDb, promotionId);

        res.json({
            success: true,
            message: "Promoción desactivada. Los clientes ya no podrán usar este código."
        });
    } catch (error) {
        if (error.message === "PROMOTION_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "La promoción no existe." });
        }
        if (error.message === "PROMOTION_ALREADY_EXPIRED") {
            return res.status(400).json({ 
                success: false, 
                message: "Esta promoción ya finalizó su vigencia, no es necesario desactivarla." 
            });
        }
        next(error);
    }
};