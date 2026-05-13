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
    setProductRecipe,
    deleteProduct
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
import {
    registerShrinkage,
    registerSupplierIncidence
} from "../controllers/tenantInventoryController.js";

import { ROLES } from "../constants/roles.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { 
    createOrderSchema, 
    createProductSchema, 
    createComboSchema, 
    createShrinkageSchema,
    updateRecipeSchema 
} from "../schemas/tenantSchemas.js";

const router = Router();

// Configuraciones
router.get("/settings", tenantContext, getTenantSettings);
router.patch("/settings", tenantContext, updateTenantSettings);
// Usuarios
router.get("/users", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), listTenantUsers);
router.post("/users", tenantContext, requireTenantRoles(ROLES.ADMIN), createTenantUser);
// Catálogo / Menú
router.get("/menu", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE, ROLES.CAJERO), listMenuCatalog);
router.post("/menu/categories", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), createMenuCategory);
router.post("/menu/products", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), validateSchema(createProductSchema), createMenuProduct);
router.patch("/menu/products/:productId", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), updateMenuProduct);
router.put("/menu/products/:productId/recipe", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), validateSchema(updateRecipeSchema), setProductRecipe);
router.delete("/menu/products/:productId", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), deleteProduct);
router.post("/menu/combos", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), validateSchema(createComboSchema), createMenuCombo);
router.patch("/menu/combos/:comboId", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), updateMenuCombo);
// Pedidos
router.post("/orders", tenantContext, requireTenantRoles(ROLES.CAJERO, ROLES.ADMIN), validateSchema(createOrderSchema), createTenantOrder);
router.get("/orders", tenantContext, requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE, ROLES.CAJERO), listTenantOrders);
router.get("/orders/kitchen", tenantContext, requireTenantRoles(ROLES.COCINA, ROLES.ADMIN), listKitchenOrders);
router.patch("/orders/:orderId/finish", tenantContext, requireTenantRoles(ROLES.COCINA, ROLES.ADMIN), finishKitchenOrder);
router.get("/orders/dispatch", tenantContext, requireTenantRoles(ROLES.DESPACHO, ROLES.ADMIN), listDispatchOrders);
router.patch("/orders/:orderId/deliver", tenantContext, requireTenantRoles(ROLES.DESPACHO, ROLES.ADMIN), deliverDispatchOrder);

// RUTAS DE INVENTARIO Y PROVEEDORES
router.post(
    "/inventory/shrinkage", 
    tenantContext, 
    requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), 
    validateSchema(createShrinkageSchema),
    registerShrinkage
);

router.post(
    "/inventory/suppliers/incidences", 
    tenantContext, 
    requireTenantRoles(ROLES.ADMIN, ROLES.GERENTE), 
    registerSupplierIncidence
);

export default router;