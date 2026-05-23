import { Router } from "express";
import { getSalon, addZone, addTable, changeTableStatus } from "../controllers/tenantTableController.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.get("/salon", tenantContext, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), getSalon);
router.post("/zones", tenantContext, requireTenantRoles(ROLES.GERENTE), addZone);
router.post("/tables", tenantContext, requireTenantRoles(ROLES.GERENTE), addTable);
router.patch("/tables/:tableId/status", tenantContext, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), changeTableStatus);

export default router;