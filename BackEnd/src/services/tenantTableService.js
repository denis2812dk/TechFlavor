import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { restaurantZones, tables } from "../models/tenantSchema.js";

export const createZone = async (tenantDb, name) => {
    return await tenantDb.insert(restaurantZones).values({
        id: randomUUID(),
        name,
        isActive: true
    });
};

export const createTable = async (tenantDb, { zoneId, identifier, capacity }) => {
    return await tenantDb.insert(tables).values({
        id: randomUUID(),
        zoneId,
        identifier,
        capacity,
        status: "available"
    });
};

export const updateTableStatus = async (tenantDb, tableId, status) => {
    return await tenantDb.update(tables)
        .set({ status, updatedAt: new Date() })
        .where(eq(tables.id, tableId));
};

export const getSalonStatus = async (tenantDb) => {
    // Retornamos las zonas con sus mesas para que el frontend las mapee
    const zones = await tenantDb.select().from(restaurantZones).where(eq(restaurantZones.isActive, true));
    const allTables = await tenantDb.select().from(tables);
    
    return zones.map(zone => ({
        ...zone,
        tables: allTables.filter(t => t.zoneId === zone.id)
    }));
};