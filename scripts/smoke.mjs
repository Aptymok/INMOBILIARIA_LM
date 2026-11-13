import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const name = "Prueba automatizada - no cliente real";
  const created = await client.query(
    "INSERT INTO contacts(kind,name,email,phone,interest,status) VALUES ('prospect',$1,$2,$3,$4,'new') RETURNING id,kind",
    [name,"prueba-automatica@example.invalid","0000000000","Simulación"]
  );
  const id = created.rows[0].id;
  assert.equal(created.rows[0].kind,"prospect");
  await client.query("INSERT INTO activity_log(contact_id,actor,action) VALUES ($1,'ci','contact.created')",[id]);
  const converted = await client.query(
    "UPDATE contacts SET kind='client',status='integration',converted_at=now() WHERE id=$1 RETURNING id,kind",
    [id]
  );
  assert.equal(converted.rows[0].id,id);
  assert.equal(converted.rows[0].kind,"client");
  await client.query("INSERT INTO activity_log(contact_id,actor,action) VALUES ($1,'ci','prospect.converted')",[id]);
  const bytes = Buffer.from("%PDF-1.4\n% archivo ficticio para prueba automatizada\n");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const stored = await client.query(
    "INSERT INTO documents(contact_id,filename,mime_type,size_bytes,sha256,file_bytes) VALUES($1,'ficticio.pdf','application/pdf',$2,$3,$4) RETURNING id,sha256",
    [id,bytes.length,hash,bytes]
  );
  assert.equal(stored.rows[0].sha256,hash);
  const read = await client.query("SELECT file_bytes FROM documents WHERE id=$1",[stored.rows[0].id]);
  assert.ok(read.rows[0].file_bytes.equals(bytes));
  const counts = await client.query("SELECT count(*)::int AS total FROM activity_log WHERE contact_id=$1",[id]);
  assert.equal(counts.rows[0].total,2);
  await client.query("ROLLBACK"); // Prueba aislada: no quedan datos ficticios.
  console.log("OK: prospecto, conversión, documento, integridad y bitácora; cambios revertidos.");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
