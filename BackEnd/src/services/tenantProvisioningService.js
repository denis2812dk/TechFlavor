import { sql } from "drizzle-orm";

export const ensureTenantIncidencesCompatibility = async (tenantDb) => {
    await tenantDb.execute(sql`
        ALTER TABLE supplier_incidences
            ADD COLUMN IF NOT EXISTS purchase_order_id varchar(36) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS resolution_date timestamp NULL DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
};

export const initializeTenantDatabase = async (tenantDb) => {
    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS restaurant_settings (
            id varchar(36) PRIMARY KEY,
            restaurant_name varchar(120) NOT NULL,
            currency varchar(10) NOT NULL DEFAULT 'USD',
            timezone varchar(80) NOT NULL DEFAULT 'America/El_Salvador',
            tax_rate decimal(5,2) NOT NULL DEFAULT 0.00,
            primary_color varchar(30) NOT NULL DEFAULT '#ea580c',
            allow_delivery boolean NOT NULL DEFAULT true,
            allow_inventory boolean NOT NULL DEFAULT false,
            notes text,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS menu_categories (
            id varchar(36) PRIMARY KEY,
            name varchar(80) NOT NULL,
            description text,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS menu_products (
            id varchar(36) PRIMARY KEY,
            category_id varchar(36) NOT NULL,
            name varchar(120) NOT NULL,
            description text NOT NULL,
            price decimal(10,2) NOT NULL,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE RESTRICT
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS menu_combos (
            id varchar(36) PRIMARY KEY,
            name varchar(120) NOT NULL,
            description text NOT NULL,
            price decimal(10,2) NOT NULL,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS menu_combo_items (
            id varchar(36) PRIMARY KEY,
            combo_id varchar(36) NOT NULL,
            product_id varchar(36) NOT NULL,
            quantity int NOT NULL DEFAULT 1,
            FOREIGN KEY (combo_id) REFERENCES menu_combos(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES menu_products(id) ON DELETE RESTRICT
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS restaurant_zones (
            id varchar(36) PRIMARY KEY,
            name varchar(80) NOT NULL, 
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS tables (
            id varchar(36) PRIMARY KEY,
            zone_id varchar(36) NOT NULL,
            identifier varchar(30) NOT NULL, 
            capacity int NOT NULL DEFAULT 4,
            status varchar(20) NOT NULL DEFAULT 'available', 
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (zone_id) REFERENCES restaurant_zones(id) ON DELETE RESTRICT
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS reservations (
            id varchar(36) PRIMARY KEY,
            table_id varchar(36),
            customer_name varchar(120) NOT NULL,
            customer_phone varchar(20),
            reservation_time timestamp NOT NULL,
            guest_count int NOT NULL DEFAULT 1,
            status varchar(20) NOT NULL DEFAULT 'pending', 
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
        )
    `);

    // --- SECCIÓN ACTUALIZADA DE ÓRDENES ---
    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS orders (
            id varchar(36) PRIMARY KEY,
            ticket_code varchar(30) NOT NULL UNIQUE,
            customer_name varchar(120) NOT NULL,
            is_edited boolean NOT NULL DEFAULT false,
            status varchar(30) NOT NULL DEFAULT 'open',
            fulfillment_type varchar(30) NOT NULL DEFAULT 'takeaway',
            table_id varchar(36),
            payment_method varchar(20) NOT NULL DEFAULT 'cash',
            payment_reference varchar(100),
            subtotal decimal(10,2) NOT NULL,
            total decimal(10,2) NOT NULL,
            cashier_user_id varchar(36) NOT NULL,
            cashier_name varchar(120) NOT NULL,
            discount_total decimal(10,2) NOT NULL DEFAULT 0.00,
            promotion_id varchar(36),
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
        )
    `);
    // --------------------------------------

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS order_items (
            id varchar(36) PRIMARY KEY,
            order_id varchar(36) NOT NULL,
            item_type varchar(20) NOT NULL,
            item_id varchar(36) NOT NULL,
            name varchar(120) NOT NULL,
            unit_price decimal(10,2) NOT NULL,
            quantity int NOT NULL,
            line_total decimal(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS ingredients (
            id varchar(36) PRIMARY KEY,
            name varchar(150) NOT NULL,
            unit_measure varchar(50) NOT NULL
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS inventory (
            id varchar(36) PRIMARY KEY,
            ingredient_id varchar(36) NOT NULL UNIQUE,
            current_stock decimal(10,2) NOT NULL DEFAULT 0.00,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS product_ingredients (
            id varchar(36) PRIMARY KEY,
            product_id varchar(36) NOT NULL,
            ingredient_id varchar(36) NOT NULL,
            quantity decimal(10,2) NOT NULL,
            FOREIGN KEY (product_id) REFERENCES menu_products(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS suppliers (
            id varchar(36) PRIMARY KEY,
            name varchar(150) NOT NULL,
            contact_name varchar(150),
            dui varchar(10) NOT NULL,
            nit varchar(17),
            phone varchar(20),
            email varchar(100),
            address text,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS supplier_ingredients (
            id varchar(36) PRIMARY KEY,
            supplier_id varchar(36) NOT NULL,
            ingredient_id varchar(36) NOT NULL,
            price_reference decimal(10,2),
            is_preferred boolean NOT NULL DEFAULT false,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id varchar(36) PRIMARY KEY,
            supplier_id varchar(36) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'pending',
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
            id varchar(36) PRIMARY KEY,
            purchase_order_id varchar(36) NOT NULL,
            ingredient_id varchar(36) NOT NULL,
            quantity decimal(10,2) NOT NULL,
            unit_price decimal(10,2) NOT NULL,
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS supplier_incidences (
            id varchar(36) PRIMARY KEY,
            supplier_id varchar(36) NOT NULL,
            purchase_order_id varchar(36) DEFAULT NULL,
            description text NOT NULL,
            date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            status varchar(20) NOT NULL DEFAULT 'ABIERTA',
            resolution_date timestamp NULL DEFAULT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT supplier_incidences_supplier_id_fk FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
            CONSTRAINT supplier_incidences_purchase_order_id_fk FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS inventory_movements (
            id varchar(36) PRIMARY KEY,
            type varchar(20) NOT NULL,
            quantity decimal(10,2) NOT NULL,
            date timestamp DEFAULT CURRENT_TIMESTAMP,
            reason varchar(255),
            ingredient_id varchar(36) NOT NULL,
            order_id varchar(36),
            purchase_order_id varchar(36),
            FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS promotions (
            id varchar(36) PRIMARY KEY,
            codes varchar(30) NOT NULL UNIQUE,
            name varchar(120) NOT NULL,
            description text,
            discount_type varchar(20) NOT NULL,
            discount_value decimal(10,2) NOT NULL,
            start_date timestamp NOT NULL,
            end_date timestamp NOT NULL,
            is_active boolean NOT NULL DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS promotion_targets (
            id varchar(36) PRIMARY KEY,
            promotion_id varchar(36) NOT NULL,
            target_type varchar(20) NOT NULL,
            target_id varchar(36),
            FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
        )
    `);
    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS cash_shifts (
            id varchar(36) PRIMARY KEY,
            cashier_user_id varchar(36) NOT NULL,
            cashier_name varchar(120) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'open',
            opened_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            closed_at timestamp,
            initial_balance decimal(10,2) NOT NULL DEFAULT 0.00,
            expected_cash decimal(10,2),
            expected_card decimal(10,2),
            expected_transfer decimal(10,2),
            declared_cash decimal(10,2),
            declared_card decimal(10,2),
            declared_transfer decimal(10,2),
            cash_difference decimal(10,2),
            notes text
        )
    `);

    await tenantDb.execute(sql`
        CREATE TABLE IF NOT EXISTS cash_movements (
            id varchar(36) PRIMARY KEY,
            shift_id varchar(36) NOT NULL,
            type varchar(20) NOT NULL,
            amount decimal(10,2) NOT NULL,
            reason varchar(255) NOT NULL,
            user_id varchar(36) NOT NULL,
            user_name varchar(120) NOT NULL,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shift_id) REFERENCES cash_shifts(id) ON DELETE CASCADE
        )
    `);

    console.log("¡Base de datos del inquilino inicializada correctamente!");
};