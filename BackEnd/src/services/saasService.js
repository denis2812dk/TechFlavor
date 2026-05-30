import { randomUUID } from "crypto";
import mysql from "mysql2/promise";
import { eq, desc,sql } from "drizzle-orm";
import { auth } from "../config/auth.js";
import { db } from "../config/db.js";
import { getTenantDb } from "../config/tenantDb.js";
import { ROLES } from "../constants/roles.js";
import { accounts, restaurantUsers, restaurants, tenantRequests, users, saasPlans } from "../models/schema.js";
import { initializeTenantDatabase } from "./tenantProvisioningService.js";

export const registerTenantRequest = async (data) => {
    const normalizedEmail = data.email.trim().toLowerCase();
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
    console.log(`DEBUG: [saasService] Iniciando aprobación para requestId: ${requestId}`);
    try {
        const [request] = await db.select().from(tenantRequests).where(eq(tenantRequests.id, requestId)).limit(1);

        if (!request) {
            console.log(`DEBUG: [saasService] Solicitud ${requestId} no encontrada.`);
            throw new Error("REQUEST_NOT_FOUND");
        }
        if (request.status !== "pending") {
            console.log(`DEBUG: [saasService] Solicitud ${requestId} ya procesada. Estado: ${request.status}`);
            throw new Error("REQUEST_ALREADY_PROCESSED");
        }
        
        console.log(`DEBUG: [saasService] Procesando solicitud para restaurante: ${request.restaurantName}`);
        const restaurantId = randomUUID();
        const dbName = generateSafeDbName(request.restaurantName);
        const slug = dbName.replace("techflavor_tenant_", "").replace(/_/g, "-");
        const tempPassword = generateTempPassword();

        console.log(`DEBUG: [saasService] Intentando crear conexión al servidor MySQL para crear DB: ${dbName}`);
        const serverConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: Number(process.env.DB_PORT) || 3306,
        });
        
        console.log(`DEBUG: [saasService] Ejecutando CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await serverConnection.end();
        console.log(`DEBUG: [saasService] Base de datos ${dbName} asegurada/creada.`);

        console.log(`DEBUG: [saasService] Obteniendo conexión Drizzle para el nuevo tenant: ${dbName}`);
        const newTenantDb = getTenantDb(dbName);
        
        console.log(`DEBUG: [saasService] Inicializando esquema de base de datos para el tenant ${dbName}...`);
        await initializeTenantDatabase(newTenantDb); // CRITICAL STEP
        console.log(`DEBUG: [saasService] Esquema de tenant ${dbName} inicializado.`);

        console.log(`DEBUG: [saasService] Iniciando transacción para actualizar DB principal.`);
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

            await tx.insert(users).values({ id: userId, name: request.ownerName, email: request.email, emailVerified: true, role: ROLES.GERENTE, createdAt: now, updatedAt: now });
            await tx.insert(accounts).values({ id: randomUUID(), accountId: userId, providerId: "credential", userId: userId, password: hashedPassword, createdAt: now, updatedAt: now });
            await tx.insert(restaurantUsers).values({ id: randomUUID(), restaurantId: restaurantId, userId: userId, role: ROLES.GERENTE, status: "active" });
        });
        console.log(`DEBUG: [saasService] Transacción de DB principal completada.`);

        return { restaurantName: request.restaurantName, email: request.email, tempPassword: tempPassword, slug: slug };
    } catch (error) {
        console.error(`ERROR: [saasService] Fallo crítico en approveTenantRequest para requestId ${requestId}:`, error);
        throw error; // Re-lanza el error para que el controlador lo maneje
    }
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
export const getPlatformStatistics = async () => {
    const [totalRestaurants] = await db.select({ count: sql`count(*)` }).from(restaurants);
    
    const [activeRestaurants] = await db.select({ count: sql`count(*)` })
        .from(restaurants)
        .where(eq(restaurants.status, "active"));
        
    const [pendingRequests] = await db.select({ count: sql`count(*)` })
        .from(tenantRequests)
        .where(eq(tenantRequests.status, "pending"));

    return {
        totalRestaurants: Number(totalRestaurants?.count || 0),
        activeRestaurants: Number(activeRestaurants?.count || 0),
        pendingApprovals: Number(pendingRequests?.count || 0),
    };
};
export const toggleRestaurantStatus = async (restaurantId) => {
    const [restaurant] = await db.select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

    if (!restaurant) {
        throw new Error("RESTAURANT_NOT_FOUND");
    }

    const newStatus = restaurant.status === "active" ? "suspended" : "active";

    await db.update(restaurants)
        .set({ status: newStatus })
        .where(eq(restaurants.id, restaurantId));

    return {
        name: restaurant.name,
        newStatus: newStatus
    };
};
export const getSaasPlans = async () => {
    return await db.select()
        .from(saasPlans)
        .orderBy(desc(saasPlans.createdAt));
};

export const createSaasPlan = async (data) => {
    const planId = randomUUID();
    
    await db.insert(saasPlans).values({
        id: planId,
        name: data.name,
        code: data.code.toLowerCase().trim(),
        price: data.price,
        maxTables: data.maxTables || 10,
        maxUsers: data.maxUsers || 3,
        hasInventory: data.hasInventory || false,
        hasKitchenDisplay: data.hasKitchenDisplay || false,
        isActive: true
    });

    return planId;
};