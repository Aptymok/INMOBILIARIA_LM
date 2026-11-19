import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";import {validUuid,limited} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
const statuses=new Set(["available","reserved","closed","inactive"]);
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validUuid(id))return NextResponse.json({error:"Identificador inválido"},{status:400});
 try{
  const d=await req.json();const status=limited(d?.status,20);
  if(!statuses.has(status))return NextResponse.json({error:"Estado inválido"},{status:400});
  const c=await db().connect();try{
   await c.query("BEGIN");
   const old=await c.query("SELECT status,code FROM properties WHERE id=$1 FOR UPDATE",[id]);
   if(!old.rowCount){await c.query("ROLLBACK");return NextResponse.json({error:"Propiedad no encontrada"},{status:404});}
   if(old.rows[0].status===status){await c.query("COMMIT");return NextResponse.json({ok:true,status});}
   await c.query("UPDATE properties SET status=$2,updated_at=now() WHERE id=$1",[id,status]);
   await c.query("INSERT INTO activity_log(actor,action,details) VALUES($1,'property.status_changed',$2::jsonb)",[process.env.ADMIN_USER||"admin",JSON.stringify({propertyId:id,code:old.rows[0].code,from:old.rows[0].status,to:status})]);
   await c.query("COMMIT");return NextResponse.json({ok:true,status});
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible actualizar estado"},{status:500});}
}
