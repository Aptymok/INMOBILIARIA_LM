import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import {validUuid,limited} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
const allowed=new Set(["image/jpeg","image/png","image/webp","application/pdf"]);
function matchesSignature(mime:string,b:Buffer) {
 if(mime==="application/pdf")return b.subarray(0,5).toString("ascii")==="%PDF-";
 if(mime==="image/png")return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(mime==="image/jpeg")return b[0]===255&&b[1]===216&&b[2]===255;
 if(mime==="image/webp")return b.subarray(0,4).toString()==="RIFF"&&b.subarray(8,12).toString()==="WEBP";
 return false;
}
export async function GET(req:NextRequest){
 try{
 const id=req.nextUrl.searchParams.get("contactId")||"";
 if(!validUuid(id))return NextResponse.json({error:"Identificador inválido"},{status:400});
 const {rows}=await db().query("SELECT id,filename,mime_type,size_bytes,sha256,created_at,reviewed_at FROM documents WHERE contact_id=$1 ORDER BY created_at DESC",[id]);return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error(e);return NextResponse.json({error:"No se pudo recuperar documentos"},{status:500});}
}
export async function POST(req:NextRequest){
 try{
 const declaredSize=Number(req.headers.get("content-length")||0);
 if(declaredSize>9*1024*1024)return NextResponse.json({error:"Solicitud demasiado grande"},{status:413});
 const form=await req.formData();const id=String(form.get("contactId")||"");
 const f=form.get("file");if(!validUuid(id)||!(f instanceof File))return NextResponse.json({error:"Contacto y archivo requeridos"},{status:400});
 if(!allowed.has(f.type)||!f.size||f.size>8388608)return NextResponse.json({error:"Formato no permitido o archivo mayor a 8 MB"},{status:400});
 const content=Buffer.from(await f.arrayBuffer());
 if(!matchesSignature(f.type,content))return NextResponse.json({error:"El contenido del archivo no corresponde al formato declarado"},{status:400});
 const sha=createHash("sha256").update(content).digest("hex");
 const ocr=limited(form.get("ocrText"),10000);const reviewed=form.get("reviewed")==="true";
 if(ocr&&!reviewed)return NextResponse.json({error:"El texto OCR requiere revisión humana"},{status:400});
 const client=await db().connect();
 try{
 await client.query("BEGIN");
 const existing=await client.query("SELECT id FROM contacts WHERE id=$1",[id]);if(!existing.rowCount){await client.query("ROLLBACK");return NextResponse.json({error:"Contacto no encontrado"},{status:404});}
 const same=await client.query("SELECT id FROM documents WHERE contact_id=$1 AND sha256=$2 LIMIT 1",[id,sha]);
 if(same.rows.length){await client.query("ROLLBACK");return NextResponse.json({error:"Este archivo ya fue incorporado al expediente.",documentId:same.rows[0].id},{status:409});}
 const {rows}=await client.query("INSERT INTO documents(contact_id,filename,mime_type,size_bytes,sha256,file_bytes,ocr_text,reviewed_by,reviewed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,filename,sha256",[id,limited(f.name,200)||"archivo",f.type,f.size,sha,content,ocr||null,reviewed?process.env.ADMIN_USER||"admin":null,reviewed?new Date():null]);
 await client.query("INSERT INTO activity_log(contact_id,actor,action,details) VALUES ($1,$2,'document.uploaded',$3::jsonb)",[id,process.env.ADMIN_USER||"admin",JSON.stringify({documentId:rows[0].id,sha256:sha,ocrReviewed:reviewed})]);
 await client.query("COMMIT");return NextResponse.json(rows[0],{status:201});
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
 }catch(e){console.error(e);return NextResponse.json({error:"No fue posible almacenar el documento"},{status:500});}
}
