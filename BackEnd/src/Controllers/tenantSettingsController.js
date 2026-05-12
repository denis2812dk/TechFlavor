import { eq } from "drizzle-orm";
import { restaurantSettings } from "../models/tenantSchema.js";

const SETTINGS_NOT_FOUND = "No se encontro configuracion para este restaurante.";

export const getTenantSettings = async (req, res, next) => {
    try {
        const [settings] = await req.tenantDb
            .select()
            .from(restaurantSettings)
            .limit(1);

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

export const updateTenantSettings = async (req, res, next) => {
    try {
        const [currentSettings] = await req.tenantDb
            .select()
            .from(restaurantSettings)
            .limit(1);

        if (!currentSettings) {
            return res.status(404).json({
                success: false,
                message: SETTINGS_NOT_FOUND,
            });
        }

        const allowedFields = [
            "restaurantName",
            "currency",
            "timezone",
            "taxRate",
            "primaryColor",
            "allowDelivery",
            "allowInventory",
            "notes",
        ];

        const dataToUpdate = allowedFields.reduce((data, field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                data[field] = req.body[field];
            }

            return data;
        }, {});

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No enviaste campos validos para actualizar.",
            });
        }

        await req.tenantDb
            .update(restaurantSettings)
            .set(dataToUpdate)
            .where(eq(restaurantSettings.id, currentSettings.id));

        const [updatedSettings] = await req.tenantDb
            .select()
            .from(restaurantSettings)
            .where(eq(restaurantSettings.id, currentSettings.id))
            .limit(1);

        res.json({
            success: true,
            message: "Configuracion actualizada correctamente.",
            settings: updatedSettings,
        });
    } catch (error) {
        next(error);
    }
};
