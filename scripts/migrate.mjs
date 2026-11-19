import { readFileSync,readdirSync } from "node:fs";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
 const files=readdirSync("sql").filter(f=>/^\d+_.*\.sql$/.test(f)).sort();
 for(const file of files){
  await pool.query(readFileSync("sql/"+file,"utf8"));
  console.log("Applied "+file);
 }
} finally { await pool.end(); }
