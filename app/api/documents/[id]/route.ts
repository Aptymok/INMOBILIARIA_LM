import {NextResponse} from "next/server";
import {db} from "@/lib/db";import {validUuid} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validUuid(id))return new NextResponse("Inválido",{status:400});
 const {rows}=await db().query("SELECT filename,mime_type,file_bytes FROM documents WHERE id=$1",[id]);
 if(!rows.length)return new NextResponse("No encontrado",{status:404});
 const doc=rows[0];return new NextResponse(new Uint8Array(doc.file_bytes),{headers:{"Content-Type":doc.mime_type,"Content-Disposition":'attachment; filename="documento"',"X-Content-Type-Options":"nosniff","Cache-Control":"no-store"}});
}
