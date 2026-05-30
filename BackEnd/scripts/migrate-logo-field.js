import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { db } from "../src/config/db.js";
import { restaurants } from "../src/models/schema.js";

dotenv.config();

/**
 * Script para actualizar retroactivamente la tabla restaurant_settings
 * en todas las bases de datos de los inquilinos.
 */
async function runMigration() {
    console.log("🚀 Iniciando migración de configuración de restaurantes (Logo Base64)...");

    try {
        // 1. Obtener la lista de todos los restaurantes registrados desde la DB central
        const activeRestaurants = await db.select().from(restaurants);
        console.log(`Se encontraron ${activeRestaurants.length} restaurantes para procesar.\n`);

        for (const restaurant of activeRestaurants) {
            console.log(`📦 Procesando: ${restaurant.name} [DB: ${restaurant.databaseName}]`);

            // 2. Establecer conexión directa con la base de datos del inquilino
            const tenantConn = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: restaurant.databaseName,
            });

            try {
                // 3. Crear la tabla si no existe (con columnas base)
                await tenantConn.execute(`
                    CREATE TABLE IF NOT EXISTS restaurant_settings (
                        id VARCHAR(36) PRIMARY KEY,
                        restaurant_name VARCHAR(120) NOT NULL
                    )
                `);

                // 4. Sincronizar todas las columnas necesarias para la configuración
                const columnsToAdd = [
                    { name: "logo_base_64", type: "MEDIUMTEXT AFTER restaurant_name" },
                    { name: "currency", type: "VARCHAR(10) NOT NULL DEFAULT 'USD'" },
                    { name: "timezone", type: "VARCHAR(80) NOT NULL DEFAULT 'America/El_Salvador'" },
                    { name: "tax_rate", type: "DECIMAL(5,2) NOT NULL DEFAULT '0.00'" },
                    { name: "primary_color", type: "VARCHAR(30) NOT NULL DEFAULT '#ea580c'" },
                    { name: "allow_delivery", type: "TINYINT(1) NOT NULL DEFAULT 1" },
                    { name: "allow_inventory", type: "TINYINT(1) NOT NULL DEFAULT 1" },
                    { name: "notes", type: "TEXT" },
                    { name: "created_at", type: "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP" },
                    { name: "updated_at", type: "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
                ];

                for (const col of columnsToAdd) {
                    await tenantConn.execute(`ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`).catch(() => {});
                }

                // Limpieza de columnas obsoletas
                await tenantConn.execute("ALTER TABLE restaurant_settings DROP COLUMN IF EXISTS logo_url").catch(() => {});

                console.log(` ✅ Estructura de settings sincronizada.`);
            } catch (err) {
                console.error(` ❌ Error en ${restaurant.databaseName}:`, err.message);
            } finally {
                await tenantConn.end();
            }
        }

        console.log("\n✨ Migración finalizada para todos los restaurantes activos.");
        process.exit(0);
    } catch (error) {
        console.error("💀 Error fatal en el script de migración:", error);
        process.exit(1);
    }
}

runMigration();