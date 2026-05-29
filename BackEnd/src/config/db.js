import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../models/schema.js";
import dotenv from "dotenv";

dotenv.config();

console.log('Intentando conectar a:', process.env.DB_HOST);

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

const ensureEmailConstraintCompatibility = async () => {
  try {
    await poolConnection.query("ALTER TABLE tenant_requests DROP INDEX tenant_requests_email_unique");
    console.log("Removed unique index tenant_requests_email_unique");
  } catch (error) {
    // Ignore when the index does not exist on this environment.
    if (error?.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
      throw error;
    }
  }

  try {
    await poolConnection.query("ALTER TABLE users DROP INDEX users_email_unique");
    console.log("Removed unique index users_email_unique");
  } catch (error) {
    // Ignore when the index does not exist on this environment.
    if (error?.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
      throw error;
    }
  }
};

export const connectDB = async () => {
  try {
    const connection = await poolConnection.getConnection();
    console.log('Database connection successful');
    connection.release();
    await ensureEmailConstraintCompatibility();

  } catch (error) {
    console.error('Error connecting to MariaDB database:', error.message);
    process.exit(1);
  }
};
