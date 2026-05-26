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
import { createPurchaseOrderSchema } from "../schemas/tenantSchemas.js";

const router = Router();

router.use(tenantContext, requireTenantRoles(ROLES.GERENTE));

router.get("/", listPurchaseOrders);
router.post("/", validateRequest(createPurchaseOrderSchema), createPurchaseOrder);
router.patch("/:orderId/receive", receivePurchaseOrder); 
router.patch("/:orderId/cancel", cancelPurchaseOrder); 

export default router;