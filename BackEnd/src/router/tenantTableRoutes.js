import { Router } from "express";
import { getSalon, addZone, addTable, changeTableStatus, editTable, editZone, changeZoneStatus } from "../controllers/tenantTableController.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.get("/salon", tenantContext, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), getSalon);
router.post("/zones", tenantContext, requireTenantRoles(ROLES.GERENTE), addZone);
router.put("/zones/:zoneId", tenantContext, requireTenantRoles(ROLES.GERENTE), editZone);
router.patch("/zones/:zoneId/status", tenantContext, requireTenantRoles(ROLES.GERENTE), changeZoneStatus);
router.post("/", tenantContext, requireTenantRoles(ROLES.GERENTE), addTable);
router.put("/:tableId", tenantContext, requireTenantRoles(ROLES.GERENTE), editTable);
router.patch("/:tableId/status", tenantContext, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), changeTableStatus);

export default router;