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

export const updateTable = async (tenantDb, tableId, { zoneId, identifier, capacity }) => {
    return await tenantDb.update(tables)
        .set({ 
            ...(zoneId && { zoneId }),
            ...(identifier && { identifier }),
            ...(capacity && { capacity }),
            updatedAt: new Date() 
        })
        .where(eq(tables.id, tableId));
};

export const updateZone = async (tenantDb, zoneId, name) => {
    return await tenantDb.update(restaurantZones)
        .set({ name, updatedAt: new Date() })
        .where(eq(restaurantZones.id, zoneId));
};

export const updateZoneStatus = async (tenantDb, zoneId, isActive) => {
    await tenantDb.transaction(async (tx) => {
        await tx.update(restaurantZones)
            .set({ isActive, updatedAt: new Date() })
            .where(eq(restaurantZones.id, zoneId));
        
        if (!isActive) {
            await tx.update(tables)
                .set({ status: "inactive", updatedAt: new Date() })
                .where(eq(tables.zoneId, zoneId));
        }
    });
};

export const getSalonStatus = async (tenantDb) => {
    // Retornamos las zonas con sus mesas para que el frontend las mapee
    const zones = await tenantDb.select().from(restaurantZones);
    const allTables = await tenantDb.select().from(tables);
    
    return zones.map(zone => ({
        ...zone,
        tables: allTables.filter(t => t.zoneId === zone.id)
    }));
};