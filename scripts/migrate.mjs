import { readFileSync } from "node:fs";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
 await pool.query(readFileSync("sql/001_initial.sql","utf8"));
 console.log("Migration 001 complete");
} finally { await pool.end(); }
