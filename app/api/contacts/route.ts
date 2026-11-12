import { NextRequest,NextResponse } from "next/server";
import { db,logActivity } from "@/lib/db";
import { limited } from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{const {rows}=await db().query("SELECT id,kind,name,email,phone,interest,notes,status,created_at,converted_at FROM contacts ORDER BY created_at DESC LIMIT 250");return NextResponse.json(rows);}
 catch(e){console.error(e);return NextResponse.json({error:"No fue posible consultar los contactos"},{status:500});}
}
export async function POST(req:NextRequest){
 try{
 const data=await req.json();const name=limited(data.name,180);
 if(!name)return NextResponse.json({error:"Nombre requerido"},{status:400});
 const kind=data.kind==="client"?"client":"prospect";
 const {rows}=await db().query("INSERT INTO contacts(kind,name,email,phone,interest,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",[kind,name,limited(data.email,200),limited(data.phone,50),limited(data.interest,300),limited(data.notes,2000),kind==="client"?"integration":"new"]);
 await logActivity(rows[0].id,"contact.created",{kind});
 return NextResponse.json(rows[0],{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible registrar el contacto"},{status:500});}
}
