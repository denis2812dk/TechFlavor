import { Router } from "express";
import { getSalon, addZone, addTable, changeTableStatus, editTable, editZone, changeZoneStatus } from "../controllers/tenantTableController.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { ROLES } from "../constants/roles.js";
import { readLimiter, writeLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/salon", tenantContext, readLimiter, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), getSalon);
router.post("/zones", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), addZone);
router.put("/zones/:zoneId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), editZone);
router.patch("/zones/:zoneId/status", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), changeZoneStatus);
router.post("/", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), addTable);
router.put("/:tableId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), editTable);
router.patch("/:tableId/status", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), changeTableStatus);

export default router;