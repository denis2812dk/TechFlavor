import { randomUUID } from "crypto";
import mysql from "mysql2/promise";
import { eq, desc } from "drizzle-orm";
import { auth } from "../config/auth.js";
import { db } from "../config/db.js";
import { getTenantDb } from "../config/tenantDb.js";
import { ROLES } from "../constants/roles.js";
import { accounts, restaurantUsers, restaurants, tenantRequests, users } from "../models/schema.js";
import { initializeTenantDatabase } from "./tenantProvisioningService.js";

export const registerTenantRequest = async (data) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
    const [existingRequest] = await db
        .select({ id: tenantRequests.id })
        .from(tenantRequests)
        .where(eq(tenantRequests.email, normalizedEmail))
        .limit(1);

    if (existingUser || existingRequest) {
        throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const requestId = randomUUID();
    
    await db.insert(tenantRequests).values({
        id: requestId,
        restaurantName: data.restaurantName.trim(),
        ownerName: data.ownerName.trim(),
        email: normalizedEmail,
        phone: data.phone?.trim() || null,
        planRequested: data.planRequested || "starter",
        notes: data.notes?.trim() || null,
        status: "pending",
    });

    return requestId;
};
const generateSafeDbName = (restaurantName) => {
    const cleanName = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomPart = Math.random().toString(36).slice(2, 6);
    return `techflavor_tenant_${cleanName}_${randomPart}`;
};

const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8) + "Tf$1"; 
};

export const approveTenantRequest = async (requestId) => {
    const [request] = await db.select().from(tenantRequests).where(eq(tenantRequests.id, requestId)).limit(1);

    if (!request) throw new Error("REQUEST_NOT_FOUND");
    if (request.status !== "pending") throw new Error("REQUEST_ALREADY_PROCESSED");
    const restaurantId = randomUUID();
    const dbName = generateSafeDbName(request.restaurantName);
    const slug = dbName.replace("techflavor_tenant_", "").replace(/_/g, "-");
    const tempPassword = generateTempPassword();
    const serverConnection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 3306,
    });
    
    await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await serverConnection.end();
    const newTenantDb = getTenantDb(dbName);
    await initializeTenantDatabase(newTenantDb);
    await db.transaction(async (tx) => {
        await tx.update(tenantRequests)
            .set({ status: "approved", updatedAt: new Date() })
            .where(eq(tenantRequests.id, requestId));
        await tx.insert(restaurants).values({
            id: restaurantId,
            name: request.restaurantName,
            slug: slug,
            databaseName: dbName,
            plan: request.planRequested,
            status: "active",
        });
        const userId = randomUUID();
        const ctx = await auth.$context;
        const hashedPassword = await ctx.password.hash(tempPassword);
        const now = new Date();

        await tx.insert(users).values({
            id: userId,
            name: request.ownerName,
            email: request.email,
            emailVerified: true,
            role: ROLES.GERENTE, 
            createdAt: now,
            updatedAt: now,
        });

        await tx.insert(accounts).values({
            id: randomUUID(),
            accountId: userId,
            providerId: "credential",
            userId: userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        });
        await tx.insert(restaurantUsers).values({
            id: randomUUID(),
            restaurantId: restaurantId,
            userId: userId,
            role: ROLES.GERENTE,
            status: "active",
        });
    });
    return {
        restaurantName: request.restaurantName,
        email: request.email,
        tempPassword: tempPassword,
        slug: slug
    };
};
export const rejectTenantRequest = async (requestId, reason) => {
    const [request] = await db
        .select()
        .from(tenantRequests)
        .where(eq(tenantRequests.id, requestId))
        .limit(1);
    if (!request) throw new Error("REQUEST_NOT_FOUND");
    if (request.status !== "pending") throw new Error("REQUEST_ALREADY_PROCESSED");
    let updatedNotes = request.notes;
    if (reason) {
        const rejectionNote = `[Rechazado]: ${reason.trim()}`;
        updatedNotes = request.notes ? `${request.notes}\n${rejectionNote}` : rejectionNote;
    }

    await db.update(tenantRequests)
        .set({ 
            status: "rejected", 
            notes: updatedNotes,
            updatedAt: new Date() 
        })
        .where(eq(tenantRequests.id, requestId));

    return true;
};
export const getPendingRequests = async () => {
    return await db.select()
        .from(tenantRequests)
        .where(eq(tenantRequests.status, "pending"))
        .orderBy(desc(tenantRequests.createdAt));
};
export const getRegisteredRestaurants = async () => {
    
    return await db.select()
        .from(restaurants)
        .orderBy(desc(restaurants.createdAt));
};