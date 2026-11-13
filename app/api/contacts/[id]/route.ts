import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {limited,validUuid} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!validUuid(id))return NextResponse.json({error:"Identificador inválido"},{status:400});
 try{
  const raw=await req.json();
  if(!raw || typeof raw!=="object" || Array.isArray(raw))return NextResponse.json({error:"Datos inválidos"},{status:400});
  const name=limited(raw.name,180),email=limited(raw.email,200).toLowerCase(),phone=limited(raw.phone,50);
  if(!name)return NextResponse.json({error:"El nombre es obligatorio"},{status:400});
  if(!email&&!phone)return NextResponse.json({error:"Se requiere teléfono o correo"},{status:400});
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Correo inválido"},{status:400});
  const c=await db().connect();
  try{
   await c.query("BEGIN");
   const old=await c.query("SELECT id,kind,name,email,phone,interest,notes,status FROM contacts WHERE id=$1 FOR UPDATE",[id]);
   if(!old.rows.length){await c.query("ROLLBACK");return NextResponse.json({error:"Contacto no encontrado"},{status:404});}
   const duplicate=await c.query("SELECT id,name FROM contacts WHERE id<>$1 AND ((NULLIF($2::text,'') IS NOT NULL AND lower(email)=lower($2)) OR (NULLIF($3::text,'') IS NOT NULL AND phone=$3)) LIMIT 1",[id,email,phone]);
   if(duplicate.rows.length){await c.query("ROLLBACK");return NextResponse.json({error:"El correo o teléfono ya pertenece a otro contacto",existing:duplicate.rows[0]},{status:409});}
   const next={name,email,phone,interest:limited(raw.interest,300),notes:limited(raw.notes,2000)};
   const changes:Record<string,{before:string;after:string}>={};
   for(const key of Object.keys(next) as (keyof typeof next)[]){
     const previous=String(old.rows[0][key]??"");
     if(previous!==next[key])changes[key]={before:previous,after:next[key]};
   }
   if(!Object.keys(changes).length){await c.query("COMMIT");return NextResponse.json(old.rows[0]);}
   const r=await c.query("UPDATE contacts SET name=$2,email=$3,phone=$4,interest=$5,notes=$6,updated_at=now() WHERE id=$1 RETURNING id,kind,name,email,phone,interest,notes,status,created_at,converted_at",[id,next.name,next.email,next.phone,next.interest,next.notes]);
   await c.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES($1,$2,'contact.updated',$3::jsonb)",[id,process.env.ADMIN_USER||"admin",JSON.stringify({changedFields:Object.keys(changes),changes})]);
   await c.query("COMMIT");return NextResponse.json(r.rows[0]);
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible actualizar los datos"},{status:500});}
}
