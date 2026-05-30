import { eq } from "drizzle-orm";
import { restaurantSettings } from "../models/tenantSchema.js";
import { updateRestaurantSettingsSchema } from "../schemas/tenantSchemas.js";

const SETTINGS_NOT_FOUND = "No se encontro configuracion para este restaurante.";

export const getSettings = async (req, res, next) => {
    try {
        const [settings] = await req.tenantDb.select().from(restaurantSettings).limit(1);

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
            },
            settings,
        });
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req, res, next) => {
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
