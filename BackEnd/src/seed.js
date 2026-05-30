import "dotenv/config";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "./config/auth.js";
import { connectDB, db } from "./config/db.js";
import { getTenantDb } from "./config/tenantDb.js";
import { ROLES } from "./constants/roles.js";
import {
  accounts,
  restaurantUsers,
  restaurants,
  saasPlans,
  tenantRequests,
  users,
} from "./models/schema.js";
import {
  cashMovements,
  cashShifts,
  ingredients,
  inventory,
  orderItems,
  orders,
  menuCategories,
  menuComboItems,
  menuCombos,
  menuProducts,
  promotionTargets,
  promotions,
  productIngredients,
  restaurantSettings,
  restaurantZones,
  supplierIngredients,
  suppliers,
  tables as restaurantTables,
} from "./models/tenantSchema.js";
import { initializeTenantDatabase } from "./services/tenantProvisioningService.js";
import { deductInventoryForOrder } from "./services/tenantInventoryService.js";

const SUPER_ADMIN = {
  email: "admin@techflavor.com",
  password: "AdminPassword123!",
  name: "Super Administrador",
  role: ROLES.ADMIN,
};

const DEMO_REQUEST = {
  restaurantName: "Antojitos del Barrio",
  ownerName: "Carla Dueñas",
  email: "carla@antojitos.com",
  phone: "7777-8888",
  planRequested: "starter",
  notes: "Solicitud de prueba para el panel SaaS.",
};

const DEMO_RESTAURANT = {
  name: "TechFlavor Demo Bistro",
  slug: "techflavor-demo-bistro",
  databaseName: "techflavor_tenant_demo_bistro",
  plan: "pro",
  status: "active",
};

const DEFAULT_PLANS = [
  {
    name: "Starter",
    code: "starter",
    price: "29.99",
    maxTables: 10,
    maxUsers: 3,
    hasInventory: false,
    hasKitchenDisplay: false,
  },
  {
    name: "Pro",
    code: "pro",
    price: "59.99",
    maxTables: 25,
    maxUsers: 10,
    hasInventory: true,
    hasKitchenDisplay: true,
  },
  {
    name: "Enterprise",
    code: "enterprise",
    price: "99.99",
    maxTables: 60,
    maxUsers: 25,
    hasInventory: true,
    hasKitchenDisplay: true,
  },
];

const DEMO_STAFF = [
  {
    email: "gerente.demo@techflavor.com",
    name: "María Gerente",
    password: "DemoManager123!",
    role: ROLES.GERENTE,
  },
  {
    email: "caja.demo@techflavor.com",
    name: "Carlos Caja",
    password: "DemoCash123!",
    role: ROLES.CAJERO,
  },
  {
    email: "cocina.demo@techflavor.com",
    name: "Ana Cocina",
    password: "DemoKitchen123!",
    role: ROLES.COCINA,
  },
  {
    email: "despacho.demo@techflavor.com",
    name: "Luis Despacho",
    password: "DemoDispatch123!",
    role: ROLES.DESPACHO,
  },
  {
    email: "operador.demo@techflavor.com",
    name: "Sofía Operadora",
    password: "DemoOperator123!",
    role: ROLES.OPERADOR,
  },
];

const DEMO_CATEGORIES = [
  { key: "entradas", name: "Entradas", description: "Entradas y bocadillos para abrir el apetito." },
  { key: "pizzas", name: "Pizzas", description: "Pizzas artesanales de la casa." },
  { key: "hamburguesas", name: "Hamburguesas", description: "Hamburguesas y sandwiches principales." },
  { key: "bebidas", name: "Bebidas", description: "Bebidas frías y calientes." },
  { key: "postres", name: "Postres", description: "Dulces para cerrar la experiencia." },
];

const DEMO_INGREDIENTS = [
  { key: "masa_pizza", name: "Masa para pizza", unitOfMeasure: "kg", stock: "12.00" },
  { key: "queso_mozzarella", name: "Queso mozzarella", unitOfMeasure: "kg", stock: "8.50" },
  { key: "salsa_tomate", name: "Salsa de tomate", unitOfMeasure: "kg", stock: "9.25" },
  { key: "pepperoni", name: "Pepperoni", unitOfMeasure: "kg", stock: "4.00" },
  { key: "pan_brioche", name: "Pan brioche", unitOfMeasure: "unidad", stock: "40.00" },
  { key: "carne_molida", name: "Carne molida", unitOfMeasure: "kg", stock: "14.00" },
  { key: "lechuga", name: "Lechuga", unitOfMeasure: "kg", stock: "6.00" },
  { key: "tomate", name: "Tomate", unitOfMeasure: "kg", stock: "7.50" },
  { key: "limon", name: "Limón", unitOfMeasure: "kg", stock: "11.00" },
  { key: "cafe", name: "Café molido", unitOfMeasure: "kg", stock: "3.20" },
  { key: "helado_vainilla", name: "Helado vainilla", unitOfMeasure: "unidad", stock: "18.00" },
  { key: "chocolate", name: "Chocolate", unitOfMeasure: "kg", stock: "5.00" },
  { key: "gaseosa", name: "Gaseosa", unitOfMeasure: "unidad", stock: "60.00" },
  { key: "aceite", name: "Aceite vegetal", unitOfMeasure: "l", stock: "20.00" },
];

const DEMO_PRODUCTS = [
  {
    key: "bruschetta",
    categoryKey: "entradas",
    name: "Bruschetta Clásica",
    description: "Pan brioche tostado con salsa de tomate y aceite de oliva.",
    price: "4.50",
  },
  {
    key: "pizza_margarita",
    categoryKey: "pizzas",
    name: "Pizza Margarita",
    description: "Pizza artesanal con salsa de tomate, mozzarella y albahaca.",
    price: "12.00",
  },
  {
    key: "pizza_pepperoni",
    categoryKey: "pizzas",
    name: "Pizza Pepperoni",
    description: "Pizza clásica con mozzarella y pepperoni.",
    price: "13.50",
  },
  {
    key: "hamburguesa",
    categoryKey: "hamburguesas",
    name: "Hamburguesa Clásica",
    description: "Pan brioche, carne molida y vegetales frescos.",
    price: "8.75",
  },
  {
    key: "limonada",
    categoryKey: "bebidas",
    name: "Limonada Natural",
    description: "Bebida fresca preparada al momento.",
    price: "2.50",
  },
  {
    key: "cafe_americano",
    categoryKey: "bebidas",
    name: "Café Americano",
    description: "Café negro caliente para acompañar cualquier momento.",
    price: "1.80",
  },
  {
    key: "brownie",
    categoryKey: "postres",
    name: "Brownie con Helado",
    description: "Brownie de chocolate con bola de helado de vainilla.",
    price: "3.75",
  },
];

const DEMO_COMBOS = [
  {
    key: "combo_pizza_bebida",
    name: "Combo Pizza + Bebida",
    description: "Pizza Margarita con Limonada Natural.",
    price: "13.90",
    items: [
      { productKey: "pizza_margarita", quantity: 1 },
      { productKey: "limonada", quantity: 1 },
    ],
  },
];

const DEMO_SUPPLIERS = [
  {
    key: "suministros_centro",
    name: "Suministros del Centro",
    contactName: "Hugo Rivera",
    dui: "12345678-9",
    nit: "0614-123456-102-3",
    phone: "2222-3333",
    email: "ventas@suministroscentro.com",
    address: "San Salvador, El Salvador",
    ingredients: [
      { ingredientKey: "masa_pizza", priceReference: "1.50", isPreferred: true },
      { ingredientKey: "queso_mozzarella", priceReference: "2.25", isPreferred: true },
      { ingredientKey: "salsa_tomate", priceReference: "1.10", isPreferred: false },
      { ingredientKey: "aceite", priceReference: "3.20", isPreferred: false },
    ],
  },
  {
    key: "distribuidora_norte",
    name: "Distribuidora del Norte",
    contactName: "Elena Cruz",
    dui: "98765432-1",
    nit: "0614-654321-103-4",
    phone: "2333-4444",
    email: "contacto@distribuidoranorte.com",
    address: "Soyapango, El Salvador",
    ingredients: [
      { ingredientKey: "carne_molida", priceReference: "4.90", isPreferred: true },
      { ingredientKey: "pan_brioche", priceReference: "0.40", isPreferred: true },
      { ingredientKey: "lechuga", priceReference: "0.85", isPreferred: false },
      { ingredientKey: "tomate", priceReference: "0.95", isPreferred: false },
      { ingredientKey: "gaseosa", priceReference: "0.65", isPreferred: false },
    ],
  },
];

const DEMO_ZONES = [
  { key: "salon_principal", name: "Salón principal" },
  { key: "terraza", name: "Terraza" },
  { key: "barra", name: "Barra" },
];

const DEMO_TABLES = [
  { zoneKey: "salon_principal", identifier: "Mesa 1", capacity: 4 },
  { zoneKey: "salon_principal", identifier: "Mesa 2", capacity: 4 },
  { zoneKey: "salon_principal", identifier: "Mesa 3", capacity: 6 },
  { zoneKey: "terraza", identifier: "Mesa T1", capacity: 4 },
  { zoneKey: "terraza", identifier: "Mesa T2", capacity: 2 },
  { zoneKey: "barra", identifier: "Barra 1", capacity: 2 },
];

const DEMO_PROMOTIONS = [
  {
    key: "welcome10",
    code: "WELCOME10",
    name: "Bienvenida TechFlavor",
    description: "10% de descuento en toda la carta para probar la plataforma.",
    discountType: "percentage",
    discountValue: "10.00",
    targetType: "all",
  },
  {
    key: "pizzas5",
    code: "PIZZAS5",
    name: "Descuento Pizzas",
    description: "Descuento fijo para la categoría de pizzas.",
    discountType: "fixed_amount",
    discountValue: "5.00",
    targetType: "category",
    targetKey: "pizzas",
  },
];

const money = (value) => Number(value).toFixed(2);
const passwordHashCache = new Map();

const hashPassword = async (password) => {
  if (passwordHashCache.has(password)) {
    return passwordHashCache.get(password);
  }

  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(password);
  passwordHashCache.set(password, hashedPassword);
  return hashedPassword;
};

const ensureDatabaseExists = async (databaseName) => {
  const serverConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 3306,
  });

  await serverConnection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await serverConnection.end();
};

const ensureAuthUser = async ({ email, name, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();
  const hashedPassword = await hashPassword(password);

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!existingUser) {
    const userId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        name,
        email: normalizedEmail,
        emailVerified: true,
        image: null,
        role,
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(accounts).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
    });

    return { id: userId, email: normalizedEmail, name, role };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        name,
        role,
        emailVerified: true,
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: now,
      })
      .where(eq(users.id, existingUser.id));

    const [existingAccount] = await tx
      .select()
      .from(accounts)
      .where(eq(accounts.userId, existingUser.id))
      .limit(1);

    if (existingAccount) {
      await tx
        .update(accounts)
        .set({
          password: hashedPassword,
          updatedAt: now,
        })
        .where(eq(accounts.userId, existingUser.id));
    } else {
      await tx.insert(accounts).values({
        id: randomUUID(),
        accountId: existingUser.id,
        providerId: "credential",
        userId: existingUser.id,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  return { ...existingUser, email: normalizedEmail, name, role };
};

const ensureRestaurantUser = async (restaurantId, userId, role) => {
  const [relation] = await db
    .select()
    .from(restaurantUsers)
    .where(and(eq(restaurantUsers.restaurantId, restaurantId), eq(restaurantUsers.userId, userId)))
    .limit(1);

  if (relation) {
    return relation;
  }

  const relationId = randomUUID();
  await db.insert(restaurantUsers).values({
    id: relationId,
    restaurantId,
    userId,
    role,
    status: "active",
  });

  return { id: relationId, restaurantId, userId, role, status: "active" };
};

const ensureFirstRow = async (client, table, values) => {
  const [existing] = await client.select().from(table).limit(1);
  if (existing) {
    return existing;
  }

  const row = { id: randomUUID(), ...values };
  await client.insert(table).values(row);
  return row;
};

const ensureNamedRow = async (client, table, column, value, values) => {
  const [existing] = await client
    .select()
    .from(table)
    .where(eq(column, value))
    .limit(1);

  if (existing) {
    return existing;
  }

  const row = { id: randomUUID(), ...values };
  await client.insert(table).values(row);
  return row;
};

const ensureManyByKey = async (client, rows, seedFn) => {
  const results = {};
  for (const row of rows) {
    results[row.key] = await seedFn(row);
  }
  return results;
};

const seedPlans = async () => {
  for (const plan of DEFAULT_PLANS) {
    const [existing] = await db
      .select()
      .from(saasPlans)
      .where(eq(saasPlans.code, plan.code))
      .limit(1);

    if (existing) {
      continue;
    }

    await db.insert(saasPlans).values({
      id: randomUUID(),
      name: plan.name,
      code: plan.code,
      price: plan.price,
      maxTables: plan.maxTables,
      maxUsers: plan.maxUsers,
      hasInventory: plan.hasInventory,
      hasKitchenDisplay: plan.hasKitchenDisplay,
      isActive: true,
    });
  }
};

const seedPendingRequest = async () => {
  const normalizedEmail = DEMO_REQUEST.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(tenantRequests)
    .where(eq(tenantRequests.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return existing;
  }

  const request = {
    id: randomUUID(),
    restaurantName: DEMO_REQUEST.restaurantName,
    ownerName: DEMO_REQUEST.ownerName,
    email: normalizedEmail,
    phone: DEMO_REQUEST.phone,
    planRequested: DEMO_REQUEST.planRequested,
    notes: DEMO_REQUEST.notes,
    status: "pending",
  };

  await db.insert(tenantRequests).values(request);
  return request;
};

const seedRestaurantRecord = async () => {
  const [existing] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, DEMO_RESTAURANT.slug))
    .limit(1);

  if (existing) {
    await db
      .update(restaurants)
      .set({
        name: DEMO_RESTAURANT.name,
        plan: DEMO_RESTAURANT.plan,
        status: DEMO_RESTAURANT.status,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, existing.id));

    return { ...existing, ...DEMO_RESTAURANT };
  }

  const restaurant = {
    id: randomUUID(),
    name: DEMO_RESTAURANT.name,
    slug: DEMO_RESTAURANT.slug,
    databaseName: DEMO_RESTAURANT.databaseName,
    plan: DEMO_RESTAURANT.plan,
    status: DEMO_RESTAURANT.status,
  };

  await db.insert(restaurants).values(restaurant);
  return restaurant;
};

const seedTenantData = async (tenantDb, restaurantName) => {
  const categoryMap = {};
  for (const category of DEMO_CATEGORIES) {
    categoryMap[category.key] = await ensureNamedRow(
      tenantDb,
      menuCategories,
      menuCategories.name,
      category.name,
      {
        name: category.name,
        description: category.description,
        isActive: true,
      }
    );
  }

  const ingredientMap = {};
  for (const ingredient of DEMO_INGREDIENTS) {
    ingredientMap[ingredient.key] = await ensureNamedRow(
      tenantDb,
      ingredients,
      ingredients.name,
      ingredient.name,
      {
        name: ingredient.name,
        unitOfMeasure: ingredient.unitOfMeasure,
      }
    );

    const [existingInventory] = await tenantDb
      .select()
      .from(inventory)
      .where(eq(inventory.ingredientId, ingredientMap[ingredient.key].id))
      .limit(1);

    if (!existingInventory) {
      await tenantDb.insert(inventory).values({
        id: randomUUID(),
        ingredientId: ingredientMap[ingredient.key].id,
        currentStock: ingredient.stock,
      });
    }
  }

  const productMap = {};
  for (const product of DEMO_PRODUCTS) {
    productMap[product.key] = await ensureNamedRow(
      tenantDb,
      menuProducts,
      menuProducts.name,
      product.name,
      {
        categoryId: categoryMap[product.categoryKey].id,
        name: product.name,
        description: product.description,
        price: product.price,
        isActive: true,
      }
    );
  }

  for (const product of DEMO_PRODUCTS) {
    const ingredientRecipe = {
      bruschetta: [
        { ingredientKey: "pan_brioche", quantity: "0.50" },
        { ingredientKey: "salsa_tomate", quantity: "0.10" },
        { ingredientKey: "aceite", quantity: "0.02" },
      ],
      pizza_margarita: [
        { ingredientKey: "masa_pizza", quantity: "0.30" },
        { ingredientKey: "queso_mozzarella", quantity: "0.20" },
        { ingredientKey: "salsa_tomate", quantity: "0.10" },
      ],
      pizza_pepperoni: [
        { ingredientKey: "masa_pizza", quantity: "0.30" },
        { ingredientKey: "queso_mozzarella", quantity: "0.20" },
        { ingredientKey: "salsa_tomate", quantity: "0.10" },
        { ingredientKey: "pepperoni", quantity: "0.08" },
      ],
      hamburguesa: [
        { ingredientKey: "pan_brioche", quantity: "1.00" },
        { ingredientKey: "carne_molida", quantity: "0.15" },
        { ingredientKey: "lechuga", quantity: "0.03" },
        { ingredientKey: "tomate", quantity: "0.04" },
      ],
      limonada: [
        { ingredientKey: "limon", quantity: "0.20" },
      ],
      cafe_americano: [
        { ingredientKey: "cafe", quantity: "0.02" },
      ],
      brownie: [
        { ingredientKey: "chocolate", quantity: "0.08" },
        { ingredientKey: "helado_vainilla", quantity: "1.00" },
      ],
    }[product.key] || [];

    for (const recipeItem of ingredientRecipe) {
      const targetIngredient = ingredientMap[recipeItem.ingredientKey];
      if (!targetIngredient) {
        continue;
      }

      const [recipeExists] = await tenantDb
        .select()
        .from(productIngredients)
        .where(
          and(
            eq(productIngredients.productId, productMap[product.key].id),
            eq(productIngredients.ingredientId, targetIngredient.id)
          )
        )
        .limit(1);

      if (!recipeExists) {
        await tenantDb.insert(productIngredients).values({
          id: randomUUID(),
          productId: productMap[product.key].id,
          ingredientId: targetIngredient.id,
          quantity: recipeItem.quantity,
        });
      }
    }
  }

  const comboMap = {};
  for (const combo of DEMO_COMBOS) {
    comboMap[combo.key] = await ensureNamedRow(
      tenantDb,
      menuCombos,
      menuCombos.name,
      combo.name,
      {
        name: combo.name,
        description: combo.description,
        price: combo.price,
        isActive: true,
      }
    );

    for (const item of combo.items) {
      const product = productMap[item.productKey];
      if (!product) {
        continue;
      }

      const [comboItemExists] = await tenantDb
        .select()
        .from(menuComboItems)
        .where(
          and(
            eq(menuComboItems.comboId, comboMap[combo.key].id),
            eq(menuComboItems.productId, product.id)
          )
        )
        .limit(1);

      if (!comboItemExists) {
        await tenantDb.insert(menuComboItems).values({
          id: randomUUID(),
          comboId: comboMap[combo.key].id,
          productId: product.id,
          quantity: item.quantity,
        });
      }
    }
  }

  const zoneMap = {};
  for (const zone of DEMO_ZONES) {
    zoneMap[zone.key] = await ensureNamedRow(
      tenantDb,
      restaurantZones,
      restaurantZones.name,
      zone.name,
      {
        name: zone.name,
        isActive: true,
      }
    );
  }

  for (const table of DEMO_TABLES) {
    const zone = zoneMap[table.zoneKey];
    if (!zone) {
      continue;
    }

    const [existingTable] = await tenantDb
      .select()
      .from(restaurantTables)
      .where(eq(restaurantTables.identifier, table.identifier))
      .limit(1);

    if (!existingTable) {
      await tenantDb.insert(restaurantTables).values({
        id: randomUUID(),
        zoneId: zone.id,
        identifier: table.identifier,
        capacity: table.capacity,
        status: "available",
      });
    }
  }

  await ensureFirstRow(tenantDb, restaurantSettings, {
    restaurantName,
    logoBase64: null,
    currency: "USD",
    timezone: "America/El_Salvador",
    taxRate: "10.00",
    primaryColor: "#ea580c",
    allowDelivery: true,
    allowInventory: true,
    notes: "Datos iniciales de demostracion para TechFlavor.",
  });

  const promotionMap = {};
  for (const promotion of DEMO_PROMOTIONS) {
    const [existingPromotion] = await tenantDb
      .select()
      .from(promotions)
      .where(eq(promotions.code, promotion.code))
      .limit(1);

    if (existingPromotion) {
      promotionMap[promotion.key] = existingPromotion;
      continue;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const row = {
      id: randomUUID(),
      code: promotion.code,
      name: promotion.name,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate,
      endDate,
      isActive: true,
    };

    await tenantDb.insert(promotions).values(row);
    promotionMap[promotion.key] = row;
  }

  for (const promotion of DEMO_PROMOTIONS) {
    const promoRow = promotionMap[promotion.key];
    if (!promoRow) {
      continue;
    }

    const targetType = promotion.targetType;
    const targetId = promotion.targetKey ? categoryMap[promotion.targetKey]?.id || null : null;

    const [existingTarget] = await tenantDb
      .select()
      .from(promotionTargets)
      .where(eq(promotionTargets.promotionId, promoRow.id))
      .limit(1);

    if (!existingTarget) {
      await tenantDb.insert(promotionTargets).values({
        id: randomUUID(),
        promotionId: promoRow.id,
        targetType,
        targetId,
      });
    }
  }

  const supplierMap = {};
  for (const supplier of DEMO_SUPPLIERS) {
    const [existingSupplier] = await tenantDb
      .select()
      .from(suppliers)
      .where(eq(suppliers.dui, supplier.dui))
      .limit(1);

    if (existingSupplier) {
      supplierMap[supplier.key] = existingSupplier;
      continue;
    }

    const row = {
      id: randomUUID(),
      name: supplier.name,
      contactName: supplier.contactName,
      dui: supplier.dui,
      nit: supplier.nit,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      isActive: true,
    };

    await tenantDb.insert(suppliers).values(row);
    supplierMap[supplier.key] = row;
  }

  for (const supplier of DEMO_SUPPLIERS) {
    const supplierRow = supplierMap[supplier.key];
    if (!supplierRow) {
      continue;
    }

    for (const relation of supplier.ingredients) {
      const ingredient = ingredientMap[relation.ingredientKey];
      if (!ingredient) {
        continue;
      }

      const [existingRelation] = await tenantDb
        .select()
        .from(supplierIngredients)
        .where(
          and(
            eq(supplierIngredients.supplierId, supplierRow.id),
            eq(supplierIngredients.ingredientId, ingredient.id)
          )
        )
        .limit(1);

      if (!existingRelation) {
        await tenantDb.insert(supplierIngredients).values({
          id: randomUUID(),
          supplierId: supplierRow.id,
          ingredientId: ingredient.id,
          priceReference: relation.priceReference,
          isPreferred: relation.isPreferred,
        });
      }
    }
  }

  const seedOrder = async ({
    ticketCode,
    status,
    fulfillmentType,
    tableIdentifier = null,
    customerName,
    paymentMethod,
    saleItems,
  }) => {
    const [existingOrder] = await tenantDb
      .select()
      .from(orders)
      .where(eq(orders.ticketCode, ticketCode))
      .limit(1);

    if (existingOrder) {
      return existingOrder;
    }

    const [tableRow] = tableIdentifier
      ? await tenantDb
          .select()
          .from(restaurantTables)
          .where(eq(restaurantTables.identifier, tableIdentifier))
          .limit(1)
      : [null];

    let subtotal = 0;
    const orderId = randomUUID();
    const preparedItems = saleItems.map((item) => {
      const unitPrice = Number(item.unitPrice);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        id: randomUUID(),
        orderId,
        itemType: item.itemType,
        itemId: item.itemId,
        name: item.name,
        unitPrice: money(unitPrice),
        quantity: item.quantity,
        lineTotal: money(lineTotal),
      };
    });

    const total = subtotal;

    await tenantDb.insert(orders).values({
      id: orderId,
      ticketCode,
      customerName,
      isEdited: false,
      status,
      fulfillmentType,
      tableId: fulfillmentType === "dine_in" ? tableRow?.id || null : null,
      paymentMethod,
      paymentReference: null,
      subtotal: money(subtotal),
      total: money(total),
      cashierUserId: cashierUser.id,
      cashierName: cashierUser.name,
      discountTotal: "0.00",
      promotionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tenantDb.insert(orderItems).values(preparedItems);
    await deductInventoryForOrder(tenantDb, orderId, saleItems);

    return { id: orderId, ticketCode, status };
  };

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, DEMO_RESTAURANT.slug))
    .limit(1);

  const cashierUser = await ensureAuthUser(DEMO_STAFF[1]);
  const kitchenUser = await ensureAuthUser(DEMO_STAFF[2]);
  const dispatchUser = await ensureAuthUser(DEMO_STAFF[3]);
  const operatorUser = await ensureAuthUser(DEMO_STAFF[4]);
  const demoManager = await ensureAuthUser(DEMO_STAFF[0]);

  await ensureRestaurantUser(restaurant.id, demoManager.id, ROLES.GERENTE);
  await ensureRestaurantUser(restaurant.id, cashierUser.id, ROLES.CAJERO);
  await ensureRestaurantUser(restaurant.id, kitchenUser.id, ROLES.COCINA);
  await ensureRestaurantUser(restaurant.id, dispatchUser.id, ROLES.DESPACHO);
  await ensureRestaurantUser(restaurant.id, operatorUser.id, ROLES.OPERADOR);

  await seedOrder({
    ticketCode: "TF-SEED-001",
    status: "in_preparation",
    fulfillmentType: "dine_in",
    tableIdentifier: "Mesa 1",
    customerName: "Mesa 1",
    paymentMethod: "cash",
    saleItems: [
      {
        itemType: "product",
        itemId: productMap.pizza_pepperoni.id,
        name: productMap.pizza_pepperoni.name,
        unitPrice: productMap.pizza_pepperoni.price,
        quantity: 1,
      },
      {
        itemType: "product",
        itemId: productMap.limonada.id,
        name: productMap.limonada.name,
        unitPrice: productMap.limonada.price,
        quantity: 2,
      },
    ],
  });

  await seedOrder({
    ticketCode: "TF-SEED-002",
    status: "finished",
    fulfillmentType: "delivery",
    customerName: "Cliente Delivery Demo",
    paymentMethod: "card",
    saleItems: [
      {
        itemType: "combo",
        itemId: comboMap.combo_pizza_bebida.id,
        name: comboMap.combo_pizza_bebida.name,
        unitPrice: comboMap.combo_pizza_bebida.price,
        quantity: 1,
      },
      {
        itemType: "product",
        itemId: productMap.brownie.id,
        name: productMap.brownie.name,
        unitPrice: productMap.brownie.price,
        quantity: 2,
      },
    ],
  });

  const [existingShift] = await tenantDb
    .select()
    .from(cashShifts)
    .where(eq(cashShifts.cashierUserId, cashierUser.id))
    .limit(1);

  if (!existingShift) {
    const shift = {
      id: randomUUID(),
      cashierUserId: cashierUser.id,
      cashierName: cashierUser.name,
      status: "open",
      openedAt: new Date(),
      closedAt: null,
      initialBalance: "100.00",
      expectedCash: null,
      expectedCard: null,
      expectedTransfer: null,
      declaredCash: null,
      declaredCard: null,
      declaredTransfer: null,
      cashDifference: null,
      notes: "Turno de demostracion creado por el seed.",
    };

    await tenantDb.insert(cashShifts).values(shift);

    await tenantDb.insert(cashMovements).values({
      id: randomUUID(),
      shiftId: shift.id,
      type: "IN",
      amount: "100.00",
      reason: "Fondo inicial de caja de demostracion",
      userId: demoManager.id,
      userName: demoManager.name,
      createdAt: new Date(),
    });
  }

  return {
    restaurant,
    cashierUser,
    kitchenUser,
    dispatchUser,
    operatorUser,
  };
};

const seed = async () => {
  try {
    console.log("====================================");
    console.log("Inicializando TechFlavor SaaS Core");
    console.log("====================================");

    await connectDB();

    await seedPlans();
    await seedPendingRequest();
    const adminUser = await ensureAuthUser(SUPER_ADMIN);
    const restaurantRecord = await seedRestaurantRecord();

    await ensureDatabaseExists(restaurantRecord.databaseName);
    const tenantDb = getTenantDb(restaurantRecord.databaseName);
    await initializeTenantDatabase(tenantDb);
    await seedTenantData(tenantDb, restaurantRecord.name);

    console.log("====================================");
    console.log(`Base de datos central: ${process.env.DB_NAME}`);
    console.log(`Administrador: ${adminUser.email}`);
    console.log(`Restaurante demo: ${restaurantRecord.name} -> ${restaurantRecord.databaseName}`);
    console.log("Seed completado. Plataforma lista.");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la inicialización (Seeding):", error);
    process.exit(1);
  }
};

seed();