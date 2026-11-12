import {NextResponse} from "next/server";import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
import {db} from "@/lib/db";import {validUuid} from "@/lib/validation";
export const runtime="nodejs";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validUuid(id))return new NextResponse("Inválido",{status:400});
 const {rows}=await db().query("SELECT name,kind,status,created_at FROM contacts WHERE id=$1",[id]);
 if(!rows.length)return new NextResponse("No encontrado",{status:404});
 const docs=await db().query("SELECT filename,sha256,created_at,reviewed_at FROM documents WHERE contact_id=$1 ORDER BY created_at",[id]);
 const pdf=await PDFDocument.create();const page=pdf.addPage([595,842]);const font=await pdf.embedFont(StandardFonts.Helvetica);
 const clean=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g,"?");
 let y=795;const line=(s:string,size=11)=>{if(y<45)return;page.drawText(clean(s).slice(0,90),{x:45,y,size,font,color:rgb(.1,.17,.28)});y-=size+13;};
 line("INMOBILIARIA LM - INDICE DOCUMENTAL",17);line("Documento de consulta; NO es expediente certificado.",10);line("Contacto: "+rows[0].name);line("Clase: "+(rows[0].kind==="client"?"Cliente formal":"Prospecto"));line("Estado: "+rows[0].status);line("ID: "+id,9);line("DOCUMENTOS REGISTRADOS",14);
 for(const [i,d] of docs.rows.entries()){line((i+1)+". "+d.filename,10);line("   SHA-256: "+d.sha256,8);line("   Revisado: "+(d.reviewed_at?"Si":"No"),9);}
 line("Los originales se conservan por separado; este indice no los incorpora.",9);
 const output=await pdf.save();return new NextResponse(new Uint8Array(output),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="indice-expediente.pdf"',"Cache-Control":"no-store"}});
}
