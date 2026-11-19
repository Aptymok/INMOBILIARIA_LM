import {NextRequest,NextResponse} from "next/server";
import {db} from "@/lib/db";
import {limited} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
const categories=new Set(["house","apartment","land","commercial","other"]);
const operations=new Set(["sale","rent"]);
export async function GET(){
 try{const {rows}=await db().query("SELECT id,code,title,municipality,neighborhood,category,operation,price_mxn::float8 AS price_mxn,status,notes,created_at FROM properties ORDER BY created_at DESC LIMIT 300");return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}});}
 catch(e){console.error(e);return NextResponse.json({error:"No se pudo consultar inventario"},{status:500});}
}
export async function POST(req:NextRequest){
 try{
  const d=await req.json();if(!d||typeof d!=="object"||Array.isArray(d))return NextResponse.json({error:"Datos inválidos"},{status:400});
  const code=limited(d.code,40).toUpperCase(),title=limited(d.title,180),municipality=limited(d.municipality,100);
  const category=limited(d.category,20),operation=limited(d.operation,20),price=d.price_mxn;
  if(!code||!title||!municipality||!categories.has(category)||!operations.has(operation)||typeof price!=="number"||!Number.isFinite(price)||price<0||price>999999999999.99)
   return NextResponse.json({error:"Código, título, municipio, tipo, operación y precio válidos son obligatorios"},{status:400});
  const c=await db().connect();try{
   await c.query("BEGIN");
   const {rows}=await c.query("INSERT INTO properties(code,title,municipality,neighborhood,category,operation,price_mxn,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,code,title",[code,title,municipality,limited(d.neighborhood,120),category,operation,price,limited(d.notes,2000)]);
   await c.query("INSERT INTO activity_log(actor,action,details) VALUES($1,'property.created',$2::jsonb)",[process.env.ADMIN_USER||"admin",JSON.stringify({propertyId:rows[0].id,code})]);
   await c.query("COMMIT");return NextResponse.json(rows[0],{status:201});
  }catch(e){await c.query("ROLLBACK");if((e as {code?:string}).code==="23505")return NextResponse.json({error:"Ya existe ese código de propiedad"},{status:409});throw e;}finally{c.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible crear la propiedad"},{status:500});}
}
