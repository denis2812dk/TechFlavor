import "dotenv/config";
import { randomUUID } from "crypto";
import mysql from "mysql2/promise";
import { and, eq } from "drizzle-orm";
import { auth } from "./config/auth.js";
import { connectDB, db } from "./config/db.js";
import { ROLES } from "./constants/roles.js";
import { accounts, restaurantUsers, restaurants, users } from "./models/schema.js";

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

const DEMO_CATEGORIES = [
  { id: "cat_carnes", name: "Carnes", description: "Cortes, parrilla y platos fuertes." },
  { id: "cat_bebidas", name: "Bebidas", description: "Bebidas calientes y frias." },
  { id: "cat_postres", name: "Postres", description: "Dulces y cierre de comida." },
];

const DEMO_PRODUCTS = [
  {
    id: "prod_puyazo",
    categoryId: "cat_carnes",
    name: "Puyazo a la parrilla",
    description: "Corte de res a la parrilla con guarnicion.",
    price: "12.50",
  },
  {
    id: "prod_cafe",
    categoryId: "cat_bebidas",
    name: "Cafe americano",
    description: "Cafe filtrado caliente.",
    price: "2.25",
  },
  {
    id: "prod_tres_leches",
    categoryId: "cat_postres",
    name: "Tres leches",
    description: "Postre clasico con mezcla de tres leches.",
    price: "4.00",
  },
];

const DEMO_INGREDIENTS = [
  { id: "ing_res", name: "Carne de res", unitOfMeasure: "lb", stock: "50.00" },
  { id: "ing_papa", name: "Papa", unitOfMeasure: "lb", stock: "35.00" },
  { id: "ing_cafe", name: "Cafe molido", unitOfMeasure: "lb", stock: "12.00" },
  { id: "ing_leche", name: "Leche", unitOfMeasure: "lt", stock: "24.00" },
  { id: "ing_bizcocho", name: "Bizcocho", unitOfMeasure: "unidad", stock: "18.00" },
  { id: "ing_azucar", name: "Azucar", unitOfMeasure: "lb", stock: "20.00" },
];

const DEMO_RECIPES = [
  { productId: "prod_puyazo", ingredientId: "ing_res", quantity: "0.75" },
  { productId: "prod_puyazo", ingredientId: "ing_papa", quantity: "0.50" },
  { productId: "prod_cafe", ingredientId: "ing_cafe", quantity: "0.05" },
  { productId: "prod_cafe", ingredientId: "ing_azucar", quantity: "0.02" },
  { productId: "prod_tres_leches", ingredientId: "ing_leche", quantity: "0.25" },
  { productId: "prod_tres_leches", ingredientId: "ing_bizcocho", quantity: "1.00" },
];

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
        true,
        "Tenant demo creado desde seed inicial.",
      ],
    );
  }

  await tenantConnection.query(`
    UPDATE restaurant_settings
    SET allow_inventory = true
  `);

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
    CREATE TABLE IF NOT EXISTS ingredients (
      id varchar(36) NOT NULL,
      name varchar(150) NOT NULL,
      unit_measure varchar(50) NOT NULL,
      PRIMARY KEY (id)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id varchar(36) NOT NULL,
      ingredient_id varchar(36) NOT NULL,
      current_stock decimal(10,2) NOT NULL DEFAULT 0.00,
      PRIMARY KEY (id),
      UNIQUE KEY inventory_ingredient_id_unique (ingredient_id),
      CONSTRAINT inventory_ingredient_id_fk
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS product_ingredients (
      id varchar(36) NOT NULL,
      product_id varchar(36) NOT NULL,
      ingredient_id varchar(36) NOT NULL,
      quantity decimal(10,2) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT product_ingredients_product_id_fk
        FOREIGN KEY (product_id) REFERENCES menu_products(id) ON DELETE CASCADE,
      CONSTRAINT product_ingredients_ingredient_id_fk
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id varchar(36) NOT NULL,
      type varchar(20) NOT NULL,
      quantity decimal(10,2) NOT NULL,
      date timestamp DEFAULT CURRENT_TIMESTAMP,
      reason varchar(255),
      ingredient_id varchar(36) NOT NULL,
      order_id varchar(36),
      PRIMARY KEY (id),
      CONSTRAINT inventory_movements_ingredient_id_fk
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id varchar(36) NOT NULL,
      name varchar(150) NOT NULL,
      contact varchar(150),
      PRIMARY KEY (id)
    )
  `);

  await tenantConnection.query(`
    CREATE TABLE IF NOT EXISTS supplier_incidences (
      id varchar(36) NOT NULL,
      supplier_id varchar(36) NOT NULL,
      description text NOT NULL,
      date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status varchar(20) NOT NULL DEFAULT 'ABIERTA',
      resolution_date timestamp NULL,
      PRIMARY KEY (id),
      CONSTRAINT supplier_incidences_supplier_id_fk
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
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

  for (const category of DEMO_CATEGORIES) {
    await tenantConnection.query(
      `INSERT IGNORE INTO menu_categories (id, name, description, is_active) VALUES (?, ?, ?, true)`,
      [category.id, category.name, category.description],
    );
  }

  for (const product of DEMO_PRODUCTS) {
    await tenantConnection.query(
      `INSERT IGNORE INTO menu_products (id, category_id, name, description, price, is_active) VALUES (?, ?, ?, ?, ?, true)`,
      [product.id, product.categoryId, product.name, product.description, product.price],
    );
  }

  for (const ingredient of DEMO_INGREDIENTS) {
    await tenantConnection.query(
      `INSERT IGNORE INTO ingredients (id, name, unit_measure) VALUES (?, ?, ?)`,
      [ingredient.id, ingredient.name, ingredient.unitOfMeasure],
    );
    await tenantConnection.query(
      `INSERT IGNORE INTO inventory (id, ingredient_id, current_stock) VALUES (?, ?, ?)`,
      [`inv_${ingredient.id}`, ingredient.id, ingredient.stock],
    );
  }

  for (const recipe of DEMO_RECIPES) {
    await tenantConnection.query(
      `INSERT IGNORE INTO product_ingredients (id, product_id, ingredient_id, quantity) VALUES (?, ?, ?, ?)`,
      [`recipe_${recipe.productId}_${recipe.ingredientId}`, recipe.productId, recipe.ingredientId, recipe.quantity],
    );
  }

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
