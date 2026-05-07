import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as tenantSchema from "../models/tenantSchema.js";

const tenantPools = new Map();

const getTenantPool = (databaseName) => {
    if (!databaseName) {
        const error = new Error("Tenant database name is required.");
        error.status = 500;
        throw error;
    }

    if (tenantPools.has(databaseName)) {
        return tenantPools.get(databaseName);
    }

    const pool = mysql.createPool({
        host: process.env.TENANT_DB_HOST || process.env.DB_HOST,
        user: process.env.TENANT_DB_USER || process.env.DB_USER,
        password: process.env.TENANT_DB_PASSWORD || process.env.DB_PASSWORD,
        database: databaseName,
        port: Number(process.env.TENANT_DB_PORT || process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: Number(process.env.TENANT_DB_CONNECTION_LIMIT) || 5,
        queueLimit: 0,
    });

    tenantPools.set(databaseName, pool);
    return pool;
};

export const getTenantDb = (databaseName) => {
    const pool = getTenantPool(databaseName);
    return drizzle(pool, { schema: tenantSchema, mode: "default" });
};

export const closeTenantPools = async () => {
    await Promise.all([...tenantPools.values()].map((pool) => pool.end()));
    tenantPools.clear();
};
