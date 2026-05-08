import { Router } from "express";
import {
    getTenantSettings,
    updateTenantSettings,
} from "../controllers/tenantSettingsController.js";
import {
    createMenuCategory,
    createMenuCombo,
    createMenuProduct,
    listMenuCatalog,
    updateMenuCombo,
    updateMenuProduct,
} from "../controllers/tenantMenuController.js";
import {
    createTenantOrder,
    deliverDispatchOrder,
    finishKitchenOrder,
    listDispatchOrders,
    listKitchenOrders,
    listTenantOrders,
} from "../controllers/tenantOrdersController.js";
import {
    createTenantUser,
    listTenantUsers,
} from "../controllers/tenantUsersController.js";
import { ROLES } from "../constants/roles.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { tenantContext } from "../middleware/tenantContext.js";

const router = Router();

router.get("/settings", tenantContext, getTenantSettings);
router.patch("/settings", tenantContext, updateTenantSettings);
router.get("/users", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), listTenantUsers);
router.post("/users", tenantContext, requireTenantRoles(ROLES.ADMIN), createTenantUser);
router.get("/menu", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE, ROLES.CAJERO), listMenuCatalog);
router.post("/menu/categories", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), createMenuCategory);
router.post("/menu/products", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), createMenuProduct);
router.patch("/menu/products/:productId", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), updateMenuProduct);
router.post("/menu/combos", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), createMenuCombo);
router.patch("/menu/combos/:comboId", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), updateMenuCombo);
router.post("/orders", tenantContext, requireTenantRoles(ROLES.CAJERO, ROLES.ADMIN), createTenantOrder);
router.get("/orders", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE, ROLES.CAJERO), listTenantOrders);
router.get("/orders/kitchen", tenantContext, requireTenantRoles(ROLES.COCINA, ROLES.ADMIN), listKitchenOrders);
router.patch("/orders/:orderId/finish", tenantContext, requireTenantRoles(ROLES.COCINA, ROLES.ADMIN), finishKitchenOrder);
router.get("/orders/dispatch", tenantContext, requireTenantRoles(ROLES.DESPACHO, ROLES.ADMIN), listDispatchOrders);
router.patch("/orders/:orderId/deliver", tenantContext, requireTenantRoles(ROLES.DESPACHO, ROLES.ADMIN), deliverDispatchOrder);

export default router;
