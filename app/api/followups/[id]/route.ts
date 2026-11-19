import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";import {validUuid,limited} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validUuid(id))return NextResponse.json({error:"Identificador inválido"},{status:400});
 try{
  const d=await req.json(),status=limited(d?.status,20);
  if(!["pending","done","cancelled"].includes(status))return NextResponse.json({error:"Estado inválido"},{status:400});
  const c=await db().connect();try{
   await c.query("BEGIN");
   const old=await c.query("SELECT contact_id,status FROM followups WHERE id=$1 FOR UPDATE",[id]);
   if(!old.rowCount){await c.query("ROLLBACK");return NextResponse.json({error:"Seguimiento no encontrado"},{status:404});}
   if(old.rows[0].status===status){await c.query("COMMIT");return NextResponse.json({ok:true,status});}
   await c.query("UPDATE followups SET status=$2,completed_at=CASE WHEN $2='done' THEN now() ELSE NULL END,updated_at=now() WHERE id=$1",[id,status]);
   await c.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES($1,$2,'followup.status_changed',$3::jsonb)",[old.rows[0].contact_id,process.env.ADMIN_USER||"admin",JSON.stringify({followupId:id,from:old.rows[0].status,to:status})]);
   await c.query("COMMIT");return NextResponse.json({ok:true,status});
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible actualizar seguimiento"},{status:500});}
}
