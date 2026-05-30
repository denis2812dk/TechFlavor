import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
    schema: "./src/models/tenantSchema.js",
    dialect: "mysql",
    dbCredentials: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.TARGET_TENANT_DB,
        port: Number(process.env.DB_PORT) || 3306,
    },
});