import { getTenantDb } from "./src/config/tenantDb.js";
import { orders } from "./src/models/tenantSchema.js";
import { desc } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function run() {
  const db = getTenantDb("techflavor_tenant_demo"); // Assuming standard tenant db name
  const res = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1);
  if (res.length > 0) {
    console.log("Raw DB Result createdAt:", res[0].createdAt);
    console.log("Type:", typeof res[0].createdAt);
    console.log("JSON Stringify:", JSON.stringify(res[0].createdAt));
  } else {
    console.log("No orders found");
  }
  process.exit(0);
}
run();
