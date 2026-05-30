import { and, eq } from "drizzle-orm";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { db } from "../config/db.js";
import { restaurantUsers, restaurants } from "../models/schema.js";
import { getTenantDb } from "../config/tenantDb.js";
import { ROLES } from "../constants/roles.js";
import { ensureTenantIncidencesCompatibility, ensureTenantSettingsCompatibility } from "../services/tenantProvisioningService.js";

export const tenantContext = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({
                success: false,
                message: "Debes iniciar sesion.",
            });
        }
        req.user = session.user;
        req.session = session.session;
        if (session.user.role === ROLES.ADMIN) {
            return next();
        }
        const [membership] = await db
            .select({
                restaurantId: restaurants.id,
                restaurantName: restaurants.name,
                restaurantSlug: restaurants.slug,
                databaseName: restaurants.databaseName,
                restaurantStatus: restaurants.status,
                tenantRole: restaurantUsers.role,
                membershipStatus: restaurantUsers.status,
            })
            .from(restaurantUsers)
            .innerJoin(restaurants, eq(restaurantUsers.restaurantId, restaurants.id))
            .where(and(eq(restaurantUsers.userId, session.user.id), eq(restaurantUsers.status, "active")))
            .limit(1);

        if (!membership || membership.restaurantStatus !== "active") {
            return res.status(403).json({
                success: false,
                message: "No tienes un restaurante activo asignado.",
            });
        }
        req.restaurant = membership;
        req.tenantDb = getTenantDb(membership.databaseName);
        await ensureTenantIncidencesCompatibility(req.tenantDb);
        await ensureTenantSettingsCompatibility(req.tenantDb, membership.restaurantName);

        next();
    } catch (error) {
        next(error);
    }
};