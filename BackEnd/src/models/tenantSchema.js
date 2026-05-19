import { boolean, decimal, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const restaurantSettings = mysqlTable("restaurant_settings", {
    id: varchar("id", { length: 36 }).primaryKey(),
    restaurantName: varchar("restaurant_name", { length: 120 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    timezone: varchar("timezone", { length: 80 }).notNull().default("America/El_Salvador"),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
    primaryColor: varchar("primary_color", { length: 30 }).notNull().default("#ea580c"),
    allowDelivery: boolean("allow_delivery").notNull().default(true),
    allowInventory: boolean("allow_inventory").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const menuCategories = mysqlTable("menu_categories", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const menuProducts = mysqlTable("menu_products", {
    id: varchar("id", { length: 36 }).primaryKey(),
    categoryId: varchar("category_id", { length: 36 })
        .notNull()
        .references(() => menuCategories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const menuCombos = mysqlTable("menu_combos", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const menuComboItems = mysqlTable("menu_combo_items", {
    id: varchar("id", { length: 36 }).primaryKey(),
    comboId: varchar("combo_id", { length: 36 })
        .notNull()
        .references(() => menuCombos.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 36 })
        .notNull()
        .references(() => menuProducts.id, { onDelete: "restrict" }),
    quantity: int("quantity").notNull().default(1),
});

export const orders = mysqlTable("orders", {
    id: varchar("id", { length: 36 }).primaryKey(),
    ticketCode: varchar("ticket_code", { length: 30 }).notNull().unique(),
    status: varchar("status", { length: 30 }).notNull().default("open"),
    fulfillmentType: varchar("fulfillment_type", { length: 30 }).notNull().default("takeaway"),
    tableIdentifier: varchar("table_identifier", { length: 60 }),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    cashierUserId: varchar("cashier_user_id", { length: 36 }).notNull(),
    cashierName: varchar("cashier_name", { length: 120 }).notNull(),
    discountTotal: decimal("discount_total", { precision: 10, scale: 2 }).notNull().default("0.00"),
    promotionId: varchar("promotion_id", { length: 36 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable("order_items", {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderId: varchar("order_id", { length: 36 })
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    itemType: varchar("item_type", { length: 20 }).notNull(),
    itemId: varchar("item_id", { length: 36 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: int("quantity").notNull(),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
});
export const ingredients = mysqlTable("ingredients", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    unitOfMeasure: varchar("unit_measure", { length: 50 }).notNull(),
});

export const inventory = mysqlTable("inventory", {
    id: varchar("id", { length: 36 }).primaryKey(),
    ingredientId: varchar("ingredient_id", { length: 36 })
        .notNull()
        .references(() => ingredients.id, { onDelete: "cascade" })
        .unique(),
    currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull().default("0.00"),
});

export const productIngredients = mysqlTable("product_ingredients", {
    id: varchar("id", { length: 36 }).primaryKey(),
    productId: varchar("product_id", { length: 36 })
        .notNull()
        .references(() => menuProducts.id, { onDelete: "cascade" }),
    ingredientId: varchar("ingredient_id", { length: 36 })
        .notNull()
        .references(() => ingredients.id, { onDelete: "restrict" }),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
});

export const inventoryMovements = mysqlTable("inventory_movements", {
    id: varchar("id", { length: 36 }).primaryKey(),
    type: varchar("type", { length: 20 }).notNull(), 
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    date: timestamp("date").defaultNow(),
    reason: varchar("reason", { length: 255 }),
    ingredientId: varchar("ingredient_id", { length: 36 })
        .notNull()
        .references(() => ingredients.id, { onDelete: "cascade" }),
    orderId: varchar("order_id", { length: 36 }), 
});
export const suppliers = mysqlTable("suppliers", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    contact: varchar("contact", { length: 150 }),
});

export const supplierIncidences = mysqlTable("supplier_incidences", {
    id: varchar("id", { length: 36 }).primaryKey(),
    supplierId: varchar("supplier_id", { length: 36 })
        .notNull()
        .references(() => suppliers.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    status: varchar("status", { length: 20 }).notNull().default("ABIERTA"), 
    resolutionDate: timestamp("resolution_date"),
});
export const promotions = mysqlTable("promotions", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    discountType: varchar("discount_type", { length: 20 }).notNull(), 
    discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const promotionTargets = mysqlTable("promotion_targets", {
    id: varchar("id", { length: 36 }).primaryKey(),
    promotionId: varchar("promotion_id", { length: 36 })
        .notNull()
        .references(() => promotions.id, { onDelete: "cascade" }),
    targetType: varchar("target_type", { length: 20 }).notNull(), 
    targetId: varchar("target_id", { length: 36 }), 
});