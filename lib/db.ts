import { Pool } from "pg";
const globalForPool = globalThis as unknown as { lmPool?: Pool };
export function db() {
 if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
 if (!globalForPool.lmPool) globalForPool.lmPool = new Pool({connectionString:process.env.DATABASE_URL,max:5});
 return globalForPool.lmPool;
}
export async function logActivity(contactId:string|null,action:string,details:Record<string,unknown>={}) {
 await db().query("INSERT INTO activity_log(contact_id, actor, action, details) VALUES ($1,$2,$3,$4::jsonb)",[contactId,process.env.ADMIN_USER||"admin",action,JSON.stringify(details)]);
}
