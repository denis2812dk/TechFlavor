import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { tenantRequests, users } from "../models/schema.js";

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