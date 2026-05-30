import { mysqlTable, varchar, text, datetime, boolean, int, bigint, timestamp, decimal } from "drizzle-orm/mysql-core";

export const restaurants = mysqlTable("restaurants", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    databaseName: varchar("database_name", { length: 120 }).notNull().unique(),
    plan: varchar("plan", { length: 30 }).notNull().default("starter"),
    status: varchar("status", { length: 30 }).notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const users = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: varchar("image", { length: 255 }),
    role: varchar("role", { length: 20 }).notNull().default("operador"),
    banned: boolean("banned").notNull().default(false),
    banReason: varchar("ban_reason", { length: 255 }),
    banExpires: datetime("ban_expires"),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const restaurantUsers = mysqlTable("restaurant_users", {
    id: varchar("id", { length: 36 }).primaryKey(),
    restaurantId: varchar("restaurant_id", { length: 36 })
        .notNull()
        .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const accounts = mysqlTable("accounts", {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: varchar("account_id", { length: 100 }).notNull(),
    providerId: varchar("provider_id", { length: 20 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    password: text("password"),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const sessions = mysqlTable("sessions", {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull().unique(),
    expiresAt: datetime("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 255 }),
    impersonatedBy: varchar("impersonated_by", { length: 36 }),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const verifications = mysqlTable("verifications", {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: datetime("expires_at").notNull(),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
});

export const rateLimit = mysqlTable("rate_limit", {
    id: varchar("id", { length: 36 }).primaryKey(),
    key: text("key").notNull(),
    count: int("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const tenantRequests = mysqlTable("tenant_requests", {
    id: varchar("id", { length: 36 }).primaryKey(),
    restaurantName: varchar("restaurant_name", { length: 120 }).notNull(),
    ownerName: varchar("owner_name", { length: 80 }).notNull(),
    email: varchar("email", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, approved, rejected
    planRequested: varchar("plan_requested", { length: 30 }).notNull().default("starter"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export const saasPlans = mysqlTable("saas_plans", {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 80 }).notNull(), 
    code: varchar("code", { length: 30 }).notNull().unique(), 
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    
    
    maxTables: int("max_tables").notNull().default(10),
    maxUsers: int("max_users").notNull().default(3),
    hasInventory: boolean("has_inventory").notNull().default(false), 
    hasKitchenDisplay: boolean("has_kitchen_display").notNull().default(false), 
    
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});