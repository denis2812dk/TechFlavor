import { Router } from "express";
import { approveSubscription,rejectSubscription,listPendingRequests, listRegisteredRestaurants } from "../controllers/saasController.js";
import { tenantContext } from "../middleware/tenantContext.js";
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
router.get("/requests", tenantContext, requireSuperAdmin, listPendingRequests);
router.get("/restaurants", tenantContext, requireSuperAdmin, listRegisteredRestaurants);
router.post("/requests/:requestId/approve", tenantContext, requireSuperAdmin, approveSubscription);
router.post("/requests/:requestId/reject", tenantContext, requireSuperAdmin, rejectSubscription);
export default router;