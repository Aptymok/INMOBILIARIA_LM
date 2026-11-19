import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";import {validUuid} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{const {rows}=await db().query("SELECT m.contact_id,m.property_id,m.status,m.created_at,c.name AS contact_name,p.code AS property_code,p.title AS property_title FROM contact_property_matches m JOIN contacts c ON c.id=m.contact_id JOIN properties p ON p.id=m.property_id ORDER BY m.created_at DESC LIMIT 300");return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}});}
 catch(e){console.error(e);return NextResponse.json({error:"No se pudieron consultar vínculos"},{status:500});}
}
export async function POST(req:NextRequest){
 try{
  const d=await req.json(),contactId=String(d?.contactId||""),propertyId=String(d?.propertyId||"");
  if(!validUuid(contactId)||!validUuid(propertyId))return NextResponse.json({error:"Contacto y propiedad requeridos"},{status:400});
  const c=await db().connect();try{
   await c.query("BEGIN");
   const r=await c.query("INSERT INTO contact_property_matches(contact_id,property_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING contact_id,property_id,status",[contactId,propertyId]);
   if(!r.rowCount){await c.query("ROLLBACK");return NextResponse.json({error:"Este vínculo ya existe"},{status:409});}
   await c.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES($1,$2,'property.matched',$3::jsonb)",[contactId,process.env.ADMIN_USER||"admin",JSON.stringify({propertyId})]);
   await c.query("COMMIT");return NextResponse.json(r.rows[0],{status:201});
  }catch(e){await c.query("ROLLBACK");if((e as {code?:string}).code==="23503")return NextResponse.json({error:"Contacto o propiedad inexistente"},{status:404});throw e;}finally{c.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible vincular contacto y propiedad"},{status:500});}
}

export async function PATCH(req:NextRequest){
 try{
  const d=await req.json(),contactId=String(d?.contactId||""),propertyId=String(d?.propertyId||""),status=String(d?.status||"");
  if(!validUuid(contactId)||!validUuid(propertyId)||!["interested","visit","negotiating","discarded"].includes(status))
   return NextResponse.json({error:"Identificadores o etapa inválidos"},{status:400});
  const c=await db().connect();try{
   await c.query("BEGIN");
   const old=await c.query("SELECT status FROM contact_property_matches WHERE contact_id=$1 AND property_id=$2 FOR UPDATE",[contactId,propertyId]);
   if(!old.rowCount){await c.query("ROLLBACK");return NextResponse.json({error:"Vínculo no encontrado"},{status:404});}
   if(old.rows[0].status===status){await c.query("COMMIT");return NextResponse.json({ok:true,status});}
   await c.query("UPDATE contact_property_matches SET status=$3,updated_at=now() WHERE contact_id=$1 AND property_id=$2",[contactId,propertyId,status]);
   await c.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES ($1,$2,'property.match_stage_changed',$3::jsonb)",[contactId,process.env.ADMIN_USER||"admin",JSON.stringify({propertyId,from:old.rows[0].status,to:status})]);
   await c.query("COMMIT");return NextResponse.json({ok:true,status});
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible actualizar la etapa comercial"},{status:500});}
}
