import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { 
    getMyShift, 
    openMyShift, 
    addMovement, 
    getMovements, 
    closeMyShift, 
    getShiftHistory,
    getShiftDetails
} from "../controllers/tenantCashController.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { validateRequest } from "../middleware/validateSchema.js";
import { readLimiter, writeLimiter, criticalLimiter } from "../middleware/rateLimiter.js";
import { 
    openShiftSchema, 
    createMovementSchema, 
    closeShiftSchema 
} from "../schemas/tenantSchemas.js";

const router = Router();

router.use(tenantContext);

router.use("/my-shift", requireTenantRoles(ROLES.CAJERO, ROLES.GERENTE));

router.get("/my-shift", readLimiter, getMyShift);
router.get("/my-shift/:shiftId/movements", readLimiter, getMovements);

router.post("/my-shift/open", criticalLimiter, validateRequest(openShiftSchema), openMyShift);
router.post("/my-shift/:shiftId/movements", writeLimiter, validateRequest(createMovementSchema), addMovement);
router.post("/my-shift/:shiftId/close", criticalLimiter, validateRequest(closeShiftSchema), closeMyShift);


router.use("/history", requireTenantRoles(ROLES.GERENTE));

router.get("/history", readLimiter, getShiftHistory);
router.get("/history/:shiftId", readLimiter, getShiftDetails);

export default router;