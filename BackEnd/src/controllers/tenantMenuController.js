import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { ROLES } from "../constants/roles.js";
import {
    ingredients,
    menuCategories,
    menuComboItems,
    menuCombos,
    menuProducts,
    productIngredients,
} from "../models/tenantSchema.js";
import * as menuService from "../services/tenantMenuService.js";

const canManageMenu = (role) => [ROLES.ADMIN, ROLES.GERENTE].includes(role);

const parseActiveFilter = (req) => {
    if (canManageMenu(req.restaurant.tenantRole)) {
        return req.query.includeInactive !== "true";
    }
    return true;
};

const requiredText = (value) => typeof value === "string" && value.trim().length > 0;

const parsePrice = (price) => {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed.toFixed(2);
};

const parseComboItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;

    const parsedItems = items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity || 1),
    }));

    if (parsedItems.some((item) => !requiredText(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1)) {
        return null;
    }
    return parsedItems;
};

export const listMenuCatalog = async (req, res, next) => {
    try {
        const activeOnly = parseActiveFilter(req);
        const productWhere = activeOnly ? eq(menuProducts.isActive, true) : undefined;
        const comboWhere = activeOnly ? eq(menuCombos.isActive, true) : undefined;

        const categories = await req.tenantDb.select().from(menuCategories);
        const productsQuery = req.tenantDb
            .select({
                id: menuProducts.id,
                categoryId: menuProducts.categoryId,
                categoryName: menuCategories.name,
                name: menuProducts.name,
                description: menuProducts.description,
                price: menuProducts.price,
                isActive: menuProducts.isActive,
                createdAt: menuProducts.createdAt,
            })
            .from(menuProducts)
            .innerJoin(menuCategories, eq(menuProducts.categoryId, menuCategories.id));

        const combosQuery = req.tenantDb.select().from(menuCombos);

        const products = productWhere ? await productsQuery.where(productWhere) : await productsQuery;
        const combos = comboWhere ? await combosQuery.where(comboWhere) : await combosQuery;
        
        const comboItems = await req.tenantDb
            .select({
                id: menuComboItems.id,
                comboId: menuComboItems.comboId,
                productId: menuComboItems.productId,
                productName: menuProducts.name,
                quantity: menuComboItems.quantity,
            })
            .from(menuComboItems)
            .innerJoin(menuProducts, eq(menuComboItems.productId, menuProducts.id));

        const recipeItems = await req.tenantDb
            .select({
                id: productIngredients.id,
                productId: productIngredients.productId,
                ingredientId: productIngredients.ingredientId,
                ingredientName: ingredients.name,
                unitOfMeasure: ingredients.unitOfMeasure,
                quantity: productIngredients.quantity,
            })
            .from(productIngredients)
            .innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id));

        res.json({
            success: true,
            categories,
            products: products.map((product) => ({
                ...product,
                recipe: recipeItems.filter((item) => item.productId === product.id),
            })),
            combos: combos.map((combo) => ({
                ...combo,
                items: comboItems.filter((item) => item.comboId === combo.id),
            })),
        });
    } catch (error) {
        next(error);
    }
};

export const createMenuCategory = async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const description = req.body.description?.trim() || null;

        if (!requiredText(name)) {
            return res.status(400).json({ success: false, message: "La categoria necesita nombre." });
        }

        const category = {
            id: randomUUID(),
            name,
            description,
            isActive: true,
        };

        await req.tenantDb.insert(menuCategories).values(category);
        res.status(201).json({ success: true, category });
    } catch (error) {
        next(error);
    }
};

export const createMenuProduct = async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const description = req.body.description?.trim();
        const categoryId = req.body.categoryId;
        const price = parsePrice(req.body.price);

        if (!requiredText(name) || !requiredText(description) || !requiredText(categoryId) || price === null) {
            return res.status(400).json({
                success: false,
                message: "Producto requiere nombre, precio valido, categoria y descripcion.",
            });
        }

        const [category] = await req.tenantDb
            .select()
            .from(menuCategories)
            .where(and(eq(menuCategories.id, categoryId), eq(menuCategories.isActive, true)))
            .limit(1);

        if (!category) {
            return res.status(404).json({ success: false, message: "La categoria no existe o esta inactiva." });
        }

        const product = {
            id: randomUUID(),
            categoryId,
            name,
            description,
            price,
            isActive: true,
        };

        await req.tenantDb.insert(menuProducts).values(product);
        res.status(201).json({ success: true, product });
    } catch (error) {
        next(error);
    }
};

export const updateMenuProduct = async (req, res, next) => {
    try {
        const allowedFields = ["name", "description", "categoryId", "price", "isActive"];
        const dataToUpdate = {};

        for (const field of allowedFields) {
            if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

            if (field === "price") {
                const price = parsePrice(req.body.price);
                if (price === null) {
                    return res.status(400).json({ success: false, message: "Precio invalido." });
                }
                dataToUpdate.price = price;
            } else if (field === "isActive") {
                dataToUpdate.isActive = Boolean(req.body.isActive);
            } else if (!requiredText(req.body[field])) {
                return res.status(400).json({ success: false, message: `${field} no puede ir vacio.` });
            } else {
                dataToUpdate[field] = req.body[field].trim();
            }
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ success: false, message: "No enviaste campos para actualizar." });
        }

        await req.tenantDb.update(menuProducts).set(dataToUpdate).where(eq(menuProducts.id, req.params.productId));
        const [product] = await req.tenantDb.select().from(menuProducts).where(eq(menuProducts.id, req.params.productId)).limit(1);

        if (!product) {
            return res.status(404).json({ success: false, message: "Producto no encontrado." });
        }

        res.json({ success: true, product });
    } catch (error) {
        next(error);
    }
};

export const createMenuCombo = async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const description = req.body.description?.trim();
        const price = parsePrice(req.body.price);
        const items = parseComboItems(req.body.items);

        if (!requiredText(name) || !requiredText(description) || price === null || !items) {
            return res.status(400).json({
                success: false,
                message: "Combo requiere nombre, precio especial, descripcion y productos.",
            });
        }

        const productIds = items.map((item) => item.productId);
        const products = await req.tenantDb.select().from(menuProducts);
        const activeProducts = products.filter((product) => product.isActive && productIds.includes(product.id));

        if (activeProducts.length !== new Set(productIds).size) {
            return res.status(400).json({
                success: false,
                message: "Todos los productos del combo deben existir y estar activos.",
            });
        }

        const combo = {
            id: randomUUID(),
            name,
            description,
            price,
            isActive: true,
        };

        await req.tenantDb.insert(menuCombos).values(combo);
        await req.tenantDb.insert(menuComboItems).values(items.map((item) => ({
            id: randomUUID(),
            comboId: combo.id,
            productId: item.productId,
            quantity: item.quantity,
        })));

        res.status(201).json({ success: true, combo: { ...combo, items } });
    } catch (error) {
        next(error);
    }
};

export const updateMenuCombo = async (req, res, next) => {
    try {
        const allowedFields = ["name", "description", "price", "isActive"];
        const dataToUpdate = {};

        for (const field of allowedFields) {
            if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

            if (field === "price") {
                const price = parsePrice(req.body.price);
                if (price === null) {
                    return res.status(400).json({ success: false, message: "Precio invalido." });
                }
                dataToUpdate.price = price;
            } else if (field === "isActive") {
                dataToUpdate.isActive = Boolean(req.body.isActive);
            } else if (!requiredText(req.body[field])) {
                return res.status(400).json({ success: false, message: `${field} no puede ir vacio.` });
            } else {
                dataToUpdate[field] = req.body[field].trim();
            }
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ success: false, message: "No enviaste campos para actualizar." });
        }

        await req.tenantDb.update(menuCombos).set(dataToUpdate).where(eq(menuCombos.id, req.params.comboId));
        const [combo] = await req.tenantDb.select().from(menuCombos).where(eq(menuCombos.id, req.params.comboId)).limit(1);

        if (!combo) {
            return res.status(404).json({ success: false, message: "Combo no encontrado." });
        }

        res.json({ success: true, combo });
    } catch (error) {
        next(error);
    }
};

export const setProductRecipe = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { ingredients } = req.body; 
        
        await menuService.updateProductRecipe(req.tenantDb, productId, ingredients);

        res.json({
            success: true,
            message: "Receta actualizada correctamente."
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        
        await menuService.softDeleteProduct(req.tenantDb, productId);

        res.json({
            success: true,
            message: "Producto eliminado correctamente del menú activo."
        });
    } catch (error) {
        next(error);
    }
};