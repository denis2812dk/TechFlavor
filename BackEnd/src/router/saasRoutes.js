import { Router } from "express";
import { approveSubscription,rejectSubscription,listPendingRequests, listRegisteredRestaurants, getSaaSStatistics, 
    toggleRestaurantStatus, listSaasPlans, createNewPlan, listPublicSaasPlans } from "../controllers/saasController.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { readLimiter, criticalLimiter } from "../middleware/rateLimiter.js";
import { ROLES } from "../constants/roles.js";

const router = Router();
const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== ROLES.ADMIN) {
        return res.status(403).json({
            success: false,
            message: "Acceso denegado. Solo el administrador del sistema puede realizar esta acción."
        });
    }
    next();
};

router.get("/requests", tenantContext, readLimiter, requireSuperAdmin, listPendingRequests);
router.get("/restaurants", tenantContext, readLimiter, requireSuperAdmin, listRegisteredRestaurants);
router.get("/plans", tenantContext, requireSuperAdmin, listSaasPlans);
router.post("/plans", tenantContext, requireSuperAdmin, createNewPlan);
router.post("/requests/:requestId/approve", tenantContext, criticalLimiter, requireSuperAdmin, approveSubscription);
router.post("/requests/:requestId/reject", tenantContext, criticalLimiter, requireSuperAdmin, rejectSubscription);
router.get("/statistics", tenantContext, readLimiter, requireSuperAdmin, getSaaSStatistics);
router.patch("/restaurants/:restaurantId/toggle-status", tenantContext, criticalLimiter, requireSuperAdmin, toggleRestaurantStatus);
export default router;