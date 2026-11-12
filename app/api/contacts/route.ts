import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { limited } from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{const {rows}=await db().query("SELECT id,kind,name,email,phone,interest,notes,status,created_at,converted_at FROM contacts ORDER BY created_at DESC LIMIT 250");return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}});}
 catch(e){console.error(e);return NextResponse.json({error:"No fue posible consultar los contactos"},{status:500});}
}
export async function POST(req:NextRequest){
 try{
 const data=await req.json();const name=limited(data.name,180);
 if(!name)return NextResponse.json({error:"Nombre requerido"},{status:400});
 const kind=data.kind==="client"?"client":"prospect";
 const email=limited(data.email,200).toLowerCase(),phone=limited(data.phone,50);
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Correo electrónico inválido"},{status:400});
 if(!email&&!phone)return NextResponse.json({error:"Agrega un medio de contacto: teléfono o correo"},{status:400});
 const pool=db();const client=await pool.connect();
 try{
 await client.query("BEGIN");
 // Use one transaction so no contact is created without its initial audit event.
 const duplicate=await client.query("SELECT id,name,kind FROM contacts WHERE (NULLIF($1::text,'') IS NOT NULL AND lower(email)=lower($1)) OR (NULLIF($2::text,'') IS NOT NULL AND phone=$2) LIMIT 1",[email,phone]);
 if(duplicate.rows.length){await client.query("ROLLBACK");return NextResponse.json({error:"Ya existe un contacto con ese correo o teléfono.",existing:duplicate.rows[0]},{status:409});}
 const {rows}=await client.query("INSERT INTO contacts(kind,name,email,phone,interest,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",[kind,name,email,phone,limited(data.interest,300),limited(data.notes,2000),kind==="client"?"integration":"new"]);
 await client.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES($1,$2,'contact.created',$3::jsonb)",[rows[0].id,process.env.ADMIN_USER||"admin",JSON.stringify({kind})]);
 await client.query("COMMIT");return NextResponse.json(rows[0],{status:201});
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible registrar el contacto"},{status:500});}
}
