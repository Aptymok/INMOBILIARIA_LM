import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";import {validUuid,limited} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{const {rows}=await db().query("SELECT f.id,f.contact_id,f.property_id,f.subject,f.due_at,f.status,f.completed_at,c.name AS contact_name,p.code AS property_code FROM followups f JOIN contacts c ON c.id=f.contact_id LEFT JOIN properties p ON p.id=f.property_id ORDER BY CASE WHEN f.status='pending' THEN 0 ELSE 1 END,f.due_at ASC LIMIT 300");return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}});}
 catch(e){console.error(e);return NextResponse.json({error:"No se pudieron consultar seguimientos"},{status:500});}
}
export async function POST(req:NextRequest){
 try{
  const d=await req.json();const contactId=String(d?.contactId||""),propertyId=d?.propertyId?String(d.propertyId):null,subject=limited(d?.subject,250);
  const date=typeof d?.dueAt==="string"?new Date(d.dueAt):new Date(NaN);
  if(!validUuid(contactId)||(propertyId&&!validUuid(propertyId))||!subject||!Number.isFinite(date.getTime()))
   return NextResponse.json({error:"Contacto, asunto y fecha válidos son obligatorios"},{status:400});
  const c=await db().connect();try{
   await c.query("BEGIN");
   const {rows}=await c.query("INSERT INTO followups(contact_id,property_id,subject,due_at) VALUES($1,$2,$3,$4) RETURNING id,contact_id,property_id,subject,due_at,status",[contactId,propertyId,subject,date.toISOString()]);
   await c.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES($1,$2,'followup.created',$3::jsonb)",[contactId,process.env.ADMIN_USER||"admin",JSON.stringify({followupId:rows[0].id,propertyId,dueAt:date.toISOString()})]);
   await c.query("COMMIT");return NextResponse.json(rows[0],{status:201});
  }catch(e){await c.query("ROLLBACK");if((e as {code?:string}).code==="23503")return NextResponse.json({error:"Contacto o propiedad inexistente"},{status:404});throw e;}finally{c.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible registrar seguimiento"},{status:500});}
}
