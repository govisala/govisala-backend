// Get the client
import mysql from "mysql2/promise";
import "dotenv/config";

// Create the connection to database
const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

export default db;
