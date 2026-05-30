import { Router } from "express";
import {
    getTenantSettings,
    updateTenantSettings,
} from "../controllers/tenantSettingsController.js";
import { createMenuCategory, updateMenuCategory, createMenuCombo, createMenuProduct, listMenuCatalog, updateMenuCombo, updateMenuProduct,
    setProductRecipe, deleteProduct } from "../controllers/tenantMenuController.js";
import { createTenantOrder, deliverDispatchOrder, finishKitchenOrder, listDispatchOrders, listKitchenOrders, listTenantOrders,} from "../controllers/tenantOrdersController.js";
import {
    createTenantUser,
    listTenantUsers,
    updateTenantUser,
    deleteTenantUser,
} from "../controllers/tenantUsersController.js";
import {
    createIngredient,
    deleteIngredient,
    updateIngredient,
    registerShrinkage,
    listIngredients,
    getCatalogStatus
} from "../controllers/tenantInventoryController.js";
import { createTenantPromotion, listActivePromotions, listAllPromotions, deleteTenantPromotion, updateTenantPromotion,  } from "../controllers/tenantPromotionController.js";
import { ROLES } from "../constants/roles.js";
import { requireTenantRoles } from "../middleware/tenantAuthorization.js";
import { tenantContext } from "../middleware/tenantContext.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { 
    createOrderSchema, 
    createProductSchema, 
    createComboSchema, 
    createShrinkageSchema,
    updateRecipeSchema, createPromotionSchema
} from "../schemas/tenantSchemas.js";

const router = Router();

// Configuraciones
router.get("/settings", tenantContext, getTenantSettings);
router.patch("/settings", tenantContext, updateTenantSettings);
// Usuarios
router.get("/users", tenantContext, requireTenantRoles( ROLES.GERENTE), listTenantUsers);
router.post("/users", tenantContext, requireTenantRoles(ROLES.GERENTE), createTenantUser);
router.patch("/users/:userId", tenantContext, requireTenantRoles(ROLES.GERENTE), updateTenantUser);
router.delete("/users/:userId", tenantContext, requireTenantRoles(ROLES.GERENTE), deleteTenantUser);
// Catálogo / Menú
router.get("/menu", tenantContext, requireTenantRoles( ROLES.GERENTE, ROLES.CAJERO), listMenuCatalog);
router.post("/menu/categories", tenantContext, requireTenantRoles( ROLES.GERENTE), createMenuCategory);
router.patch("/menu/categories/:categoryId", tenantContext, requireTenantRoles(ROLES.GERENTE), updateMenuCategory);
router.post("/menu/products", tenantContext, requireTenantRoles(ROLES.GERENTE), validateSchema(createProductSchema), createMenuProduct);
router.patch("/menu/products/:productId", tenantContext, requireTenantRoles(ROLES.GERENTE), updateMenuProduct);
router.put("/menu/products/:productId/recipe", tenantContext, requireTenantRoles(ROLES.GERENTE), validateSchema(updateRecipeSchema), setProductRecipe);
router.delete("/menu/products/:productId", tenantContext, requireTenantRoles(ROLES.GERENTE), deleteProduct);
router.post("/menu/combos", tenantContext, requireTenantRoles(ROLES.GERENTE), validateSchema(createComboSchema), createMenuCombo);
router.patch("/menu/combos/:comboId", tenantContext, requireTenantRoles(ROLES.GERENTE), updateMenuCombo);
// Pedidos
router.post("/orders", tenantContext, requireTenantRoles(ROLES.CAJERO), validateSchema(createOrderSchema), createTenantOrder);
router.get("/orders", tenantContext, requireTenantRoles( ROLES.GERENTE, ROLES.CAJERO), listTenantOrders);
router.get("/orders/kitchen", tenantContext, requireTenantRoles(ROLES.COCINA), listKitchenOrders);
router.patch("/orders/:orderId/finish", tenantContext, requireTenantRoles(ROLES.COCINA), finishKitchenOrder);
router.get("/orders/dispatch", tenantContext, requireTenantRoles(ROLES.DESPACHO), listDispatchOrders);
router.patch("/orders/:orderId/deliver", tenantContext, requireTenantRoles(ROLES.DESPACHO), deliverDispatchOrder);

// RUTAS DE INVENTARIO Y PROVEEDORES
router.get("/inventory/ingredients", tenantContext, requireTenantRoles( ROLES.GERENTE), listIngredients);
router.post("/inventory/ingredients", tenantContext, requireTenantRoles(ROLES.GERENTE), createIngredient);
router.patch("/inventory/ingredients/:ingredientId", tenantContext, requireTenantRoles(ROLES.GERENTE), updateIngredient);
router.delete("/inventory/ingredients/:ingredientId", tenantContext, requireTenantRoles(ROLES.GERENTE), deleteIngredient);
router.post("/inventory/shrinkage", tenantContext, requireTenantRoles(ROLES.GERENTE), validateSchema(createShrinkageSchema),registerShrinkage);
router.get("/inventory/catalog-status", tenantContext, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), getCatalogStatus);
//Rutas de promociones
router.post("/promotions", tenantContext, requireTenantRoles(ROLES.GERENTE), validateSchema(createPromotionSchema), createTenantPromotion);
router.get( "/promotions/active", tenantContext, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), listActivePromotions);
router.get( "/promotions", tenantContext, requireTenantRoles(ROLES.GERENTE), listAllPromotions);
router.patch("/promotions/:promotionId", tenantContext, requireTenantRoles(ROLES.GERENTE), validateSchema(createPromotionSchema), updateTenantPromotion);
router.delete("/promotions/:promotionId", tenantContext, requireTenantRoles(ROLES.GERENTE), deleteTenantPromotion);
export default router;
