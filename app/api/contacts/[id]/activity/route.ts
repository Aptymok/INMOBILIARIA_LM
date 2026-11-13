import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {validUuid} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!validUuid(id))return NextResponse.json({error:"Identificador inválido"},{status:400});
 try{
  const {rows}=await db().query("SELECT id,actor,action,created_at FROM activity_log WHERE contact_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100",[id]);
  return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error(e);return NextResponse.json({error:"No se pudo consultar el historial"},{status:500});}
}
