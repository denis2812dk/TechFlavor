import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { 
    listPurchaseOrders, 
    createPurchaseOrder, 
    receivePurchaseOrder, 
    cancelPurchaseOrder 
} from "../controllers/tenantPurchaseOrderController.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { validateRequest } from "../middleware/validateSchema.js";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";
import { createPurchaseOrderSchema } from "../schemas/tenantSchemas.js";

const router = Router();

router.use(tenantContext, requireTenantRoles(ROLES.GERENTE));

router.get("/", readLimiter, listPurchaseOrders);
router.post("/", writeLimiter, validateRequest(createPurchaseOrderSchema), createPurchaseOrder);
router.patch("/:orderId/receive", writeLimiter, receivePurchaseOrder); 
router.patch("/:orderId/cancel", writeLimiter, cancelPurchaseOrder); 

export default router;