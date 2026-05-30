import { sql } from "drizzle-orm";
import { getTenantDb } from "./src/config/tenantDb.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function run() {
  const db = getTenantDb("techflavor_tenant_demo");
  const res = await db.execute(sql`SELECT count(*) as count FROM restaurant_settings`);
  console.log(res);
  process.exit(0);
}
run();