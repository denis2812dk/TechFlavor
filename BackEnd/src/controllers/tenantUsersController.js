import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "../config/auth.js";
import { db } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { accounts, restaurantUsers, users } from "../models/schema.js";

const ALLOWED_EMPLOYEE_ROLES = new Set([
    ROLES.CAJERO,
    ROLES.COCINA,
    ROLES.DESPACHO,
    ROLES.GERENTE,
]);

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const createTenantUser = async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const email = normalizeEmail(req.body.email || "");
        const password = req.body.password || "";
        const role = req.body.role;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Nombre, email, contrasena y rol son obligatorios.",
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "El nombre de acceso debe ser un email valido.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "La contrasena debe tener al menos 8 caracteres.",
            });
        }

        if (!ALLOWED_EMPLOYEE_ROLES.has(role)) {
            return res.status(400).json({
                success: false,
                message: "Rol invalido para empleado.",
            });
        }

        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Ya existe un usuario con ese nombre de acceso.",
            });
        }

        const ctx = await auth.$context;
        const hashedPassword = await ctx.password.hash(password);
        const now = new Date();
        const userId = randomUUID();

        await db.insert(users).values({
            id: userId,
            name,
            email,
            emailVerified: true,
            role,
            createdAt: now,
            updatedAt: now,
        });

        await db.insert(accounts).values({
            id: randomUUID(),
            accountId: userId,
            providerId: "credential",
            userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        });

        await db.insert(restaurantUsers).values({
            id: randomUUID(),
            restaurantId: req.restaurant.restaurantId,
            userId,
            role,
            status: "active",
        });

        res.status(201).json({
            success: true,
            message: "Usuario creado y asignado al restaurante correctamente.",
            user: {
                id: userId,
                name,
                email,
                role,
                restaurantId: req.restaurant.restaurantId,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const listTenantUsers = async (req, res, next) => {
    try {
        const employees = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                globalRole: users.role,
                tenantRole: restaurantUsers.role,
                status: restaurantUsers.status,
                createdAt: users.createdAt,
            })
            .from(restaurantUsers)
            .innerJoin(users, eq(restaurantUsers.userId, users.id))
            .where(and(
                eq(restaurantUsers.restaurantId, req.restaurant.restaurantId),
                eq(restaurantUsers.status, "active"),
            ));

        res.json({
            success: true,
            restaurant: {
                id: req.restaurant.restaurantId,
                name: req.restaurant.restaurantName,
            },
            users: employees,
        });
    } catch (error) {
        next(error);
    }
};
