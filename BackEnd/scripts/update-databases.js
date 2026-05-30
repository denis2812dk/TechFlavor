import dotenv from "dotenv";
import { execSync } from "child_process";
import { db } from "../src/config/db.js";
import { restaurants } from "../src/models/schema.js";
import { getTenantDb } from "../src/config/tenantDb.js";
import { ensureTenantMenuImagesCompatibility, ensureTenantSettingsCompatibility } from "../src/services/tenantProvisioningService.js";

dotenv.config();

/**
 * Script para sincronizar esquemas usando Drizzle Push de manera inteligente.
 * Mantiene sincronizados los esquemas de manera segura.
 */
async function runUpdate() {
    console.log("🚀 Iniciando actualización inteligente (Push) en bases de datos de inquilinos...");

    try {
        // 1. Obtener la lista de todos los restaurantes registrados desde la DB central
        const activeRestaurants = await db.select().from(restaurants);
        console.log(`Se encontraron ${activeRestaurants.length} restaurantes para procesar.\n`);

        for (const restaurant of activeRestaurants) {
            console.log(`📦 Procesando: ${restaurant.name} [DB: ${restaurant.databaseName}]`);

            try {
                // 2. Ejecutar drizzle-kit push usando la configuración dinámica
                // Pasamos TARGET_TENANT_DB para que el archivo de configuración sepa a qué DB conectarse
                execSync(`npx drizzle-kit push --config=drizzle.tenant.config.js --force`, {
                    env: {
                        ...process.env,
                        TARGET_TENANT_DB: restaurant.databaseName
                    },
                    stdio: "pipe" // Cambia a "inherit" si prefieres ver los logs detallados de Drizzle
                });

                console.log(` ✅ Esquema sincronizado con éxito en ${restaurant.databaseName}.`);
                
                // 3. Ejecutar funciones de compatibilidad específicas para el tenant
                const tenantDb = getTenantDb(restaurant.databaseName);
                await ensureTenantSettingsCompatibility(tenantDb, restaurant.name);
                await ensureTenantMenuImagesCompatibility(tenantDb);
                console.log(` ✅ Funciones de compatibilidad ejecutadas para ${restaurant.databaseName}.`);
            } catch (err) {
                console.error(` ❌ Error en ${restaurant.databaseName}:`);
                if (err.stdout) console.error(err.stdout.toString());
                if (err.stderr) console.error(err.stderr.toString());
            }
        }

        console.log("\n✨ Actualización de esquemas finalizada para todos los restaurantes activos.");
        process.exit(0);
    } catch (error) {
        console.error("💀 Error fatal en el script de actualización:", error);
        process.exit(1);
    }
}

runUpdate();