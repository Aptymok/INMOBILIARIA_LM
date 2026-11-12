import {NextResponse} from "next/server";
import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
import {db} from "@/lib/db";
import {validUuid} from "@/lib/validation";
export const runtime="nodejs";export const dynamic="force-dynamic";
const readable=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g,"?");
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!validUuid(id))return new NextResponse("Identificador inválido",{status:400});
 try{
 const c=await db().query("SELECT name,kind,status,created_at FROM contacts WHERE id=$1",[id]);
 if(!c.rows.length)return new NextResponse("Contacto no encontrado",{status:404});
 const q=await db().query("SELECT filename,mime_type,size_bytes,sha256,file_bytes,reviewed_at FROM documents WHERE contact_id=$1 ORDER BY created_at,id",[id]);
 if(q.rows.length>30||q.rows.reduce((a:number,d:{size_bytes:number})=>a+d.size_bytes,0)>25*1024*1024)
 return new NextResponse("Expediente demasiado grande para consolidación inicial",{status:413});
 const output=await PDFDocument.create();const font=await output.embedFont(StandardFonts.Helvetica);
 let page=output.addPage([595,842]);let y=794;
 const line=(v:string,size=10)=>{if(y<50){page=output.addPage([595,842]);y=794;}page.drawText(readable(v).slice(0,95),{x:42,y,size,font,color:rgb(.12,.18,.29)});y-=size+12;};
 line("INMOBILIARIA LM - BORRADOR DE EXPEDIENTE",16);
 line("Compilacion documental automatica. No certificado ni firmado.",10);
 line("Cliente: "+c.rows[0].name);
 line("Clasificacion: "+(c.rows[0].kind==="prospect"?"Prospecto":"Cliente nuevo"));
 line("Estado: "+c.rows[0].status);line("Registro: "+id,9);
 line("Archivos vinculados: "+q.rows.length);
 let included=0,omitted=0;
 for(const [index,d] of q.rows.entries()){
  line((index+1)+". "+d.filename,10);
  line("SHA-256: "+d.sha256,8);
  line("Revision OCR: "+(d.reviewed_at?"confirmada":"no registrada"),9);
 }
 for(const d of q.rows){
  const bytes=new Uint8Array(d.file_bytes);
  try{
   if(d.mime_type==="application/pdf"){
    const source=await PDFDocument.load(bytes,{ignoreEncryption:false});
    const copied=await output.copyPages(source,source.getPageIndices());
    copied.forEach(p=>output.addPage(p));included++;
   }else if(d.mime_type==="image/jpeg"||d.mime_type==="image/png"){
    const im=d.mime_type==="image/jpeg"?await output.embedJpg(bytes):await output.embedPng(bytes);
    const p=output.addPage([595,842]);const maxW=515,maxH=750;const ratio=Math.min(maxW/im.width,maxH/im.height);
    p.drawImage(im,{x:(595-im.width*ratio)/2,y:(842-im.height*ratio)/2,width:im.width*ratio,height:im.height*ratio});included++;
   }else{omitted++;}
  }catch(e){console.error("No se pudo incorporar un archivo",d.filename,e);omitted++;}
 }
 const notice=output.addPage([595,842]);
 const lines=["CONSTANCIA DE ALCANCE","Este PDF es una compilacion de consulta, no acredita autenticidad legal.","Los originales permanecen almacenados por separado.","Archivos incorporados: "+included+". Archivos no incorporados: "+omitted+".","Los archivos WebP y PDF no compatibles requieren tratamiento manual.","Verificar firmas, identidad, validez y completitud antes de usarlo."];
 lines.forEach((l,i)=>notice.drawText(readable(l),{x:42,y:782-i*28,size:i?11:16,font,color:rgb(.12,.18,.29)}));
 const pdf=await output.save();
 return new NextResponse(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="expediente-borrador.pdf"',"Cache-Control":"no-store"}});
 }catch(e){console.error(e);return new NextResponse("No se pudo crear el borrador documental",{status:500});}
}
