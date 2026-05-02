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
});

export const db = drizzle(poolConnection, { schema, mode: "default" });

export const connectDB = async () => {
  try {
    const connection = await poolConnection.getConnection();
    console.log('Database connection successful');
    connection.release();

  } catch (error) {
    console.error('Error connecting to MariaDB database:', error.message);
    process.exit(1);
  }
};
