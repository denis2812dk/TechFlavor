import "dotenv/config";
import { randomUUID } from "crypto";
import mysql from "mysql2/promise";
import { and, eq } from "drizzle-orm";
import { auth } from "./config/auth.js";
import { connectDB, db } from "./config/db.js";
import { ROLES } from "./constants/roles.js";
import { accounts, restaurantUsers, restaurants, users } from "./Models/schema.js";

const DEMO_RESTAURANT = {
  id: "restaurant_brasa_norte",
  name: "Brasa Norte",
  slug: "brasa-norte",
  databaseName: "techflavor_tenant_brasa_norte",
  plan: "starter",
  status: "active",
};

const USERS_TO_CREATE = [
  {
    email: "admin@techflavor.com",
    password: "AdminPassword123!",
    name: "Administrador General",
    role: ROLES.ADMIN,
  },
  {
    email: "operador@techflavor.com",
    password: "OperadorPassword123!",
    name: "Operador General",
    role: ROLES.OPERADOR,
  },
  {
    email: "cajero@techflavor.com",
    password: "CajeroPassword123!",
    name: "Caja Principal",
    role: ROLES.CAJERO,
  },
  {
    email: "cocina@techflavor.com",
    password: "CocinaPassword123!",
    name: "Equipo de Cocina",
    role: ROLES.COCINA,
  },
  {
    email: "despacho@techflavor.com",
    password: "DespachoPassword123!",
    name: "Area de Despacho",
    role: ROLES.DESPACHO,
  },
  {
    email: "gerente@techflavor.com",
    password: "GerentePassword123!",
    name: "Gerente de Restaurante",
    role: ROLES.GERENTE,
  },
];

const createId = () => randomUUID();

const assertSafeDatabaseName = (databaseName) => {
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(`Nombre de base tenant inseguro: ${databaseName}`);
  }
};

const getMysqlConnection = async (database) => {
  return mysql.createConnection({
    host: process.env.TENANT_DB_HOST || process.env.DB_HOST,
    user: process.env.TENANT_DB_USER || process.env.DB_USER,
    password: process.env.TENANT_DB_PASSWORD || process.env.DB_PASSWORD,
    database,
    port: Number(process.env.TENANT_DB_PORT || process.env.DB_PORT) || 3306,
  });
};

const provisionTenantDatabase = async (restaurant) => {
  assertSafeDatabaseName(restaurant.databaseName);

  const serverConnection = await getMysqlConnection(undefined);
  await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${restaurant.databaseName}\``);
  await serverConnection.end();

  const tenantConnection = await getMysqlConnection(restaurant.databaseName);
  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS restaurant_settings (
      id varchar(36) NOT NULL,
      restaurant_name varchar(120) NOT NULL,
      currency varchar(10) NOT NULL DEFAULT 'USD',
      timezone varchar(80) NOT NULL DEFAULT 'America/El_Salvador',
      tax_rate decimal(5,2) NOT NULL DEFAULT 0.00,
      primary_color varchar(30) NOT NULL DEFAULT '#ea580c',
      allow_delivery boolean NOT NULL DEFAULT true,
      allow_inventory boolean NOT NULL DEFAULT false,
      notes text,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);

  const [settings] = await tenantConnection.query("SELECT id FROM restaurant_settings LIMIT 1");
  if (settings.length === 0) {
    await tenantConnection.query(
      `INSERT INTO restaurant_settings
        (id, restaurant_name, currency, timezone, tax_rate, primary_color, allow_delivery, allow_inventory, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createId(),
        restaurant.name,
        "USD",
        "America/El_Salvador",
        "0.00",
        "#ea580c",
        true,
        false,
        "Tenant demo creado desde seed inicial.",
      ],
    );
  }

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id varchar(36) NOT NULL,
      name varchar(80) NOT NULL,
      description text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS menu_products (
      id varchar(36) NOT NULL,
      category_id varchar(36) NOT NULL,
      name varchar(120) NOT NULL,
      description text NOT NULL,
      price decimal(10,2) NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      CONSTRAINT menu_products_category_id_fk
        FOREIGN KEY (category_id) REFERENCES menu_categories(id)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS menu_combos (
      id varchar(36) NOT NULL,
      name varchar(120) NOT NULL,
      description text NOT NULL,
      price decimal(10,2) NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS menu_combo_items (
      id varchar(36) NOT NULL,
      combo_id varchar(36) NOT NULL,
      product_id varchar(36) NOT NULL,
      quantity int NOT NULL DEFAULT 1,
      PRIMARY KEY (id),
      CONSTRAINT menu_combo_items_combo_id_fk
        FOREIGN KEY (combo_id) REFERENCES menu_combos(id) ON DELETE CASCADE,
      CONSTRAINT menu_combo_items_product_id_fk
        FOREIGN KEY (product_id) REFERENCES menu_products(id)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id varchar(36) NOT NULL,
      ticket_code varchar(30) NOT NULL,
      status varchar(30) NOT NULL DEFAULT 'open',
      fulfillment_type varchar(30) NOT NULL DEFAULT 'takeaway',
      table_identifier varchar(60),
      subtotal decimal(10,2) NOT NULL,
      total decimal(10,2) NOT NULL,
      cashier_user_id varchar(36) NOT NULL,
      cashier_name varchar(120) NOT NULL,
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY orders_ticket_code_unique (ticket_code)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id varchar(36) NOT NULL,
      order_id varchar(36) NOT NULL,
      item_type varchar(20) NOT NULL,
      item_id varchar(36) NOT NULL,
      name varchar(120) NOT NULL,
      unit_price decimal(10,2) NOT NULL,
      quantity int NOT NULL,
      line_total decimal(10,2) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT order_items_order_id_fk
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  await tenantConnection.query(`
    ALTER TABLE orders
    ADD COLUMN fulfillment_type varchar(30) NOT NULL DEFAULT 'takeaway' AFTER status
  `).catch((error) => {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  });

  await tenantConnection.query(`
    ALTER TABLE orders
    ADD COLUMN table_identifier varchar(60) NULL AFTER fulfillment_type
  `).catch((error) => {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  });

  await tenantConnection.query(`
    ALTER TABLE orders
    ADD COLUMN cashier_user_id varchar(36) NOT NULL DEFAULT 'legacy' AFTER total
  `).catch((error) => {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  });

  await tenantConnection.query(`
    ALTER TABLE orders
    ADD COLUMN cashier_name varchar(120) NOT NULL DEFAULT 'Sin responsable' AFTER cashier_user_id
  `).catch((error) => {
    if (error.code !== "ER_DUP_FIELDNAME") throw error;
  });

  await tenantConnection.end();
};

const ensureRestaurant = async () => {
  const [existing] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, DEMO_RESTAURANT.slug))
    .limit(1);

  if (existing) return existing;

  await db.insert(restaurants).values(DEMO_RESTAURANT);
  return DEMO_RESTAURANT;
};

const ensureUser = async (userData) => {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, userData.email))
    .limit(1);

  if (!existingUser) {
    const created = await auth.api.createUser({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
      },
    });

    return created.user;
  }

  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(userData.password);

  const [credentialAccount] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, existingUser.id), eq(accounts.providerId, "credential")))
    .limit(1);

  if (credentialAccount) {
    await ctx.internalAdapter.updatePassword(existingUser.id, hashedPassword);
  } else {
    await ctx.internalAdapter.createAccount({
      accountId: existingUser.id,
      providerId: "credential",
      userId: existingUser.id,
      password: hashedPassword,
    });
  }

  await db
    .update(users)
    .set({
      name: userData.name,
      role: userData.role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existingUser.id));

  return { ...existingUser, name: userData.name, role: userData.role };
};

const ensureMembership = async ({ restaurant, user }) => {
  const [existingMembership] = await db
    .select()
    .from(restaurantUsers)
    .where(and(eq(restaurantUsers.restaurantId, restaurant.id), eq(restaurantUsers.userId, user.id)))
    .limit(1);

  if (existingMembership) {
    await db
      .update(restaurantUsers)
      .set({
        role: user.role,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(restaurantUsers.id, existingMembership.id));

    return { ...existingMembership, role: user.role, status: "active" };
  }

  const membership = {
    id: createId(),
    restaurantId: restaurant.id,
    userId: user.id,
    role: user.role,
    status: "active",
  };

  await db.insert(restaurantUsers).values(membership);
  return membership;
};

const seed = async () => {
  try {
    console.log("Starting TechFlavor single-tenant seed...");
    await connectDB();

    const restaurant = await ensureRestaurant();
    await provisionTenantDatabase(restaurant);

    for (const userData of USERS_TO_CREATE) {
      console.log(`Ensuring user: ${userData.email}`);
      const user = await ensureUser(userData);
      await ensureMembership({ restaurant, user });
    }

    console.log("Seed completed.");
    console.log(`Platform database: ${process.env.DB_NAME}`);
    console.log(`Tenant database: ${restaurant.databaseName}`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seed();
