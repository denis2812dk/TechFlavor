import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { restaurants, saasPlans } from "../models/schema.js";
import { restaurantSettings } from "../models/tenantSchema.js";
import { updateRestaurantSettingsSchema } from "../schemas/tenantSchemas.js";

const SETTINGS_NOT_FOUND = "No se encontro configuracion para este restaurante.";

export const getTenantSettings = async (req, res, next) => {
    try {
        const [settings] = await req.tenantDb.select().from(restaurantSettings).limit(1);
        const [restaurantRecord] = await db
            .select()
            .from(restaurants)
            .where(eq(restaurants.id, req.restaurant.restaurantId))
            .limit(1);

        const [planRecord] = restaurantRecord?.plan
            ? await db
                .select()
                .from(saasPlans)
                .where(eq(saasPlans.code, restaurantRecord.plan))
                .limit(1)
            : [];

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: SETTINGS_NOT_FOUND,
            });
        }

        res.json({
            success: true,
            restaurant: {
                id: req.restaurant.restaurantId,
                name: req.restaurant.restaurantName,
                slug: req.restaurant.restaurantSlug,
                role: req.restaurant.tenantRole,
                plan: restaurantRecord?.plan || null,
                planName: planRecord?.name || restaurantRecord?.plan || null,
                planCode: planRecord?.code || restaurantRecord?.plan || null,
            },
            settings: {
                ...settings,
                allowInventory: planRecord?.hasInventory ?? settings.allowInventory,
                allowKitchenDisplay: planRecord?.hasKitchenDisplay ?? settings.allowKitchenDisplay,
                planCode: planRecord?.code || restaurantRecord?.plan || null,
                planName: planRecord?.name || restaurantRecord?.plan || null,
                planHasInventory: planRecord?.hasInventory ?? false,
                planHasKitchenDisplay: planRecord?.hasKitchenDisplay ?? false,
            },
        });
    } catch (error) {
        console.error("DEBUG - Error en getTenantSettings:", error);
        next(error);
    }
};

export const updateTenantSettings = async (req, res, next) => {
    try {
        const validatedData = updateRestaurantSettingsSchema.parse(req.body);

        const [currentSettings] = await req.tenantDb.select().from(restaurantSettings).limit(1);

        if (!currentSettings) {
            return res.status(404).json({
                success: false,
                message: SETTINGS_NOT_FOUND,
            });
        }

        await req.tenantDb
            .update(restaurantSettings)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(restaurantSettings.id, currentSettings.id));

        res.json({ success: true, message: "Configuración actualizada correctamente." });
    } catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({ success: false, errors: error.errors });
        }
        next(error);
    }
};
