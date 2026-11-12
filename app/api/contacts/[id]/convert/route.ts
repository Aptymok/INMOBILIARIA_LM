import {NextResponse} from "next/server";
import {db,logActivity} from "@/lib/db";
import {validUuid} from "@/lib/validation";
export const runtime="nodejs";
export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validUuid(id))return NextResponse.json({error:"Identificador inválido"},{status:400});
 const c=await db().connect();
 try {
 await c.query("BEGIN");
 const result=await c.query("UPDATE contacts SET kind='client',status='integration',converted_at=now(),updated_at=now() WHERE id=$1 AND kind='prospect' RETURNING id",[id]);
 if(!result.rowCount){await c.query("ROLLBACK");return NextResponse.json({error:"No existe un prospecto pendiente de conversión"},{status:409});}
 await c.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES ($1,$2,'prospect.converted','{}'::jsonb)",[id,process.env.ADMIN_USER||"admin"]);
 await c.query("COMMIT");return NextResponse.json({ok:true});
 }catch(e){await c.query("ROLLBACK");console.error(e);return NextResponse.json({error:"Error al convertir"},{status:500});}finally{c.release();}
}
