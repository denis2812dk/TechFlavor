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
