import { Router } from "express";
import {
    getTenantSettings,
    updateTenantSettings,
} from "../controllers/tenantSettingsController.js";
import { createMenuCategory, updateMenuCategory, createMenuCombo, createMenuProduct, listMenuCatalog, updateMenuCombo, updateMenuProduct,
    setProductRecipe, deleteProduct } from "../controllers/tenantMenuController.js";
import { createTenantOrder, deliverDispatchOrder, finishKitchenOrder, listDispatchOrders, listKitchenOrders, listTenantOrders,cancelTenantOrder, editTenantOrder} from "../controllers/tenantOrdersController.js";
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
import { readLimiter, writeLimiter, criticalLimiter } from "../middleware/rateLimiter.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { 
    createOrderSchema, 
    createCategorySchema,
    createProductSchema, 
    createComboSchema, 
    createShrinkageSchema,
    updateRecipeSchema, createPromotionSchema,
    updateCategorySchema,
    updateProductSchema
} from "../schemas/tenantSchemas.js";

const router = Router();

// Configuraciones
router.get("/settings", tenantContext, readLimiter, getTenantSettings);
router.patch("/settings", tenantContext, criticalLimiter, updateTenantSettings);
// Usuarios
router.get("/users", tenantContext, readLimiter, requireTenantRoles( ROLES.GERENTE), listTenantUsers);
router.post("/users", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), createTenantUser);
router.patch("/users/:userId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), updateTenantUser);
router.delete("/users/:userId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), deleteTenantUser);
// Catálogo / Menú
router.get("/menu", tenantContext, readLimiter, requireTenantRoles( ROLES.GERENTE, ROLES.CAJERO), listMenuCatalog);
router.post("/menu/categories", tenantContext, writeLimiter, requireTenantRoles( ROLES.GERENTE), validateSchema(createCategorySchema), createMenuCategory);
router.patch("/menu/categories/:categoryId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(updateCategorySchema), updateMenuCategory);
router.post("/menu/products", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(createProductSchema), createMenuProduct);
router.patch("/menu/products/:productId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(updateProductSchema), updateMenuProduct);
router.put("/menu/products/:productId/recipe", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(updateRecipeSchema), setProductRecipe);
router.delete("/menu/products/:productId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), deleteProduct);
router.post("/menu/combos", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(createComboSchema), createMenuCombo);
router.patch("/menu/combos/:comboId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), updateMenuCombo);
// Pedidos
router.post("/orders", tenantContext, writeLimiter, requireTenantRoles(ROLES.CAJERO), validateSchema(createOrderSchema), createTenantOrder);
router.get("/orders", tenantContext, readLimiter, requireTenantRoles( ROLES.GERENTE, ROLES.CAJERO), listTenantOrders);
router.get("/orders/kitchen", tenantContext, readLimiter, requireTenantRoles(ROLES.COCINA), listKitchenOrders);
router.patch("/orders/:orderId/finish", tenantContext, writeLimiter, requireTenantRoles(ROLES.COCINA), finishKitchenOrder);
router.get("/orders/dispatch", tenantContext, readLimiter, requireTenantRoles(ROLES.DESPACHO), listDispatchOrders);
router.patch("/orders/:orderId/deliver", tenantContext, writeLimiter, requireTenantRoles(ROLES.DESPACHO), deliverDispatchOrder);
router.patch("/orders/:orderId/cancel", tenantContext, writeLimiter, requireTenantRoles(ROLES.CAJERO, ROLES.GERENTE), cancelTenantOrder);
router.put("/orders/:orderId", tenantContext, writeLimiter, requireTenantRoles(ROLES.CAJERO, ROLES.GERENTE), validateSchema(createOrderSchema), editTenantOrder);
// RUTAS DE INVENTARIO Y PROVEEDORES
router.get("/inventory/ingredients", tenantContext, readLimiter, requireTenantRoles( ROLES.GERENTE), listIngredients);
router.post("/inventory/ingredients", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), createIngredient);
router.patch("/inventory/ingredients/:ingredientId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), updateIngredient);
router.delete("/inventory/ingredients/:ingredientId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), deleteIngredient);
router.post("/inventory/shrinkage", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(createShrinkageSchema),registerShrinkage);
router.get("/inventory/catalog-status", tenantContext, readLimiter, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), getCatalogStatus);
//Rutas de promociones
router.post("/promotions", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(createPromotionSchema), createTenantPromotion);
router.get( "/promotions/active", tenantContext, readLimiter, requireTenantRoles(ROLES.GERENTE, ROLES.CAJERO), listActivePromotions);
router.get( "/promotions", tenantContext, readLimiter, requireTenantRoles(ROLES.GERENTE), listAllPromotions);
router.patch("/promotions/:promotionId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), validateSchema(createPromotionSchema), updateTenantPromotion);
router.delete("/promotions/:promotionId", tenantContext, writeLimiter, requireTenantRoles(ROLES.GERENTE), deleteTenantPromotion);
export default router;
