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

        const userId = await db.transaction(async (tx) => {
            const ctx = await auth.$context;
            const hashedPassword = await ctx.password.hash(password);
            const now = new Date();
            const newUserId = randomUUID();

            await tx.insert(users).values({
                id: newUserId,
                name,
                email,
                emailVerified: true,
                role,
                createdAt: now,
                updatedAt: now,
            });

            await tx.insert(accounts).values({
                id: randomUUID(),
                accountId: newUserId,
                providerId: "credential",
                userId: newUserId,
                password: hashedPassword,
                createdAt: now,
                updatedAt: now,
            });

            await tx.insert(restaurantUsers).values({
                id: randomUUID(),
                restaurantId: req.restaurant.restaurantId,
                userId: newUserId,
                role,
                status: "active",
            });

            return newUserId;
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

export const updateTenantUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { name, role } = req.body;

        if (role && !ALLOWED_EMPLOYEE_ROLES.has(role)) {
            return res.status(400).json({
                success: false,
                message: "Rol invalido para empleado.",
            });
        }

        const [existingLink] = await db
            .select()
            .from(restaurantUsers)
            .where(and(
                eq(restaurantUsers.userId, userId),
                eq(restaurantUsers.restaurantId, req.restaurant.restaurantId)
            ))
            .limit(1);

        if (!existingLink) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado en este restaurante." });
        }

        // Actualizar datos globales del usuario (si envía nombre)
        if (name) {
            await db.update(users)
                .set({ name, updatedAt: new Date() })
                .where(eq(users.id, userId));
        }

        // Actualizar el rol específico en este restaurante (si envía rol)
        if (role) {
            await db.update(restaurantUsers)
                .set({ role })
                .where(and(
                    eq(restaurantUsers.userId, userId),
                    eq(restaurantUsers.restaurantId, req.restaurant.restaurantId)
                ));
        }

        res.json({ success: true, message: "Usuario actualizado correctamente." });
    } catch (error) {
        next(error);
    }
};

export const deleteTenantUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const [existingLink] = await db
            .select()
            .from(restaurantUsers)
            .where(and(
                eq(restaurantUsers.userId, userId),
                eq(restaurantUsers.restaurantId, req.restaurant.restaurantId)
            ))
            .limit(1);

        if (!existingLink) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado en este restaurante." });
        }

        // Soft Delete: en lugar de borrar el registro, lo marcamos como inactivo
        await db.update(restaurantUsers)
            .set({ status: "inactive" })
            .where(and(
                eq(restaurantUsers.userId, userId),
                eq(restaurantUsers.restaurantId, req.restaurant.restaurantId)
            ));

        res.json({ success: true, message: "Usuario desactivado correctamente." });
    } catch (error) {
        next(error);
    }
};
