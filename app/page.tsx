"use client";
import {useEffect,useState} from "react";
type Contact={id:string;kind:"prospect"|"client";name:string;email:string;phone:string;interest:string;notes:string;status:string;created_at:string};
type Doc={id:string;filename:string;sha256:string;size_bytes:number;reviewed_at:string|null};
type Activity={id:number;actor:string;action:string;created_at:string};
export default function Home(){
 const [contacts,setContacts]=useState<Contact[]>([]),[selected,setSelected]=useState<Contact|null>(null),[docs,setDocs]=useState<Doc[]>([]),[activity,setActivity]=useState<Activity[]>([]);
 const [kind,setKind]=useState<"prospect"|"client">("prospect"),[name,setName]=useState(""),[email,setEmail]=useState(""),[phone,setPhone]=useState(""),[interest,setInterest]=useState(""),[notes,setNotes]=useState("");
 const [file,setFile]=useState<File|null>(null),[ocr,setOcr]=useState(""),[reviewed,setReviewed]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [editing,setEditing]=useState(false),[edit,setEdit]=useState({name:"",email:"",phone:"",interest:"",notes:""});
 function selectContact(c:Contact){setSelected(c);setEditing(false);setEdit({name:c.name,email:c.email||"",phone:c.phone||"",interest:c.interest||"",notes:c.notes||""});setFile(null);setOcr("");setReviewed(false);void loadDocs(c.id);void loadActivity(c.id)}
 async function saveEdit(){if(!selected)return;setBusy(true);setMessage("");try{const r=await fetch("/api/contacts/"+selected.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(edit)});const data=await r.json();if(!r.ok)throw Error(data.error);setSelected(data);setEditing(false);await refresh();await loadActivity(selected.id);setMessage("Datos actualizados con registro de auditoría.");}catch(e){setMessage(String(e))}finally{setBusy(false)}}
 async function refresh(){const r=await fetch("/api/contacts",{cache:"no-store"});if(r.ok)setContacts(await r.json());else setMessage("No se pudo cargar contactos");}
 async function loadDocs(id:string){const r=await fetch("/api/documents?contactId="+id);if(r.ok)setDocs(await r.json());}
 async function loadActivity(id:string){const r=await fetch("/api/contacts/"+id+"/activity",{cache:"no-store"});if(r.ok)setActivity(await r.json());}
 useEffect(()=>{void refresh()},[]);
 async function create(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");try{
 const r=await fetch("/api/contacts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,name,email,phone,interest,notes})});const data=await r.json();if(!r.ok)throw Error(data.error);setName("");setEmail("");setPhone("");setInterest("");setNotes("");setMessage("Registro creado.");await refresh();selectContact(data);
 }catch(e){setMessage(String(e))}finally{setBusy(false)}}
 async function convert(){if(!selected||!confirm("¿Convertir este prospecto a cliente? Se preservará su historial."))return;setBusy(true);try{
 const r=await fetch("/api/contacts/"+selected.id+"/convert",{method:"POST"});const d=await r.json();if(!r.ok)throw Error(d.error);setSelected({...selected,kind:"client",status:"integration"});await refresh();await loadActivity(selected.id);setMessage("Cliente convertido; integración documental pendiente.");
 }catch(e){setMessage(String(e))}finally{setBusy(false)}}
 async function extract(){if(!file||!file.type.startsWith("image/")){setMessage("OCR disponible inicialmente para imágenes JPG, PNG o WebP.");return;}
 setBusy(true);setReviewed(false);setMessage("Procesando la imagen en este navegador...");
 try{const T=await import("tesseract.js");const result=await T.recognize(file,"spa+eng");setOcr(result.data.text);setMessage("Texto extraído. Revisa y corrige antes de guardar.");}
 catch(e){setMessage("OCR no disponible: "+String(e));}finally{setBusy(false)}}
 async function upload(){if(!file||!selected)return;setBusy(true);setMessage("");try{
 const data=new FormData();data.set("contactId",selected.id);data.set("file",file);data.set("ocrText",ocr);data.set("reviewed",String(reviewed));
 const r=await fetch("/api/documents",{method:"POST",body:data});const d=await r.json();if(!r.ok)throw Error(d.error);setFile(null);setOcr("");setReviewed(false);await loadDocs(selected.id);await loadActivity(selected.id);setMessage("Original almacenado. Integridad SHA-256 registrada.");
 }catch(e){setMessage(String(e))}finally{setBusy(false)}}
 return <><header><h1>INMOBILIARIA LM</h1><p>Centro de operaciones · Fase 1: clientes y expedientes</p></header><main>
 <section><h2>Registro de contacto</h2><form onSubmit={create}><div className="grid">
 <div><label>Clasificación inicial</label><select value={kind} onChange={e=>setKind(e.target.value as "prospect"|"client")}><option value="prospect">Cliente posible (prospecto)</option><option value="client">Cliente nuevo (en integración)</option></select></div>
 <div><label>Nombre *</label><input required maxLength={180} value={name} onChange={e=>setName(e.target.value)}/></div>
 <div><label>Correo</label><input type="email" maxLength={200} value={email} onChange={e=>setEmail(e.target.value)}/></div>
 <div><label>Teléfono</label><input maxLength={50} value={phone} onChange={e=>setPhone(e.target.value)}/></div>
 <div><label>Interés inmobiliario</label><input maxLength={300} value={interest} onChange={e=>setInterest(e.target.value)}/></div>
 <div><label>Notas</label><textarea maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)}/></div>
 </div><p><button disabled={busy}>Crear registro</button></p></form></section>
 <div className="two"><section><h2>Directorio ({contacts.length})</h2><div className="items">{contacts.map(c=><div className={"item "+(selected?.id===c.id?"selected":"")} key={c.id} onClick={()=>selectContact(c)}><div className="row between"><strong>{c.name}</strong><span className="pill">{c.kind==="prospect"?"Posible":"Cliente"}</span></div><div className="muted">{c.email||c.phone||"Sin contacto"} · {c.status}</div></div>)}</div></section>
 <section>{selected?<><div className="row between"><h2>Expediente: {selected.name}</h2><span className="pill">{selected.kind==="prospect"?"Posible":"Nuevo cliente"}</span></div>
 <p className="muted">{selected.interest||"Sin interés declarado"}</p>
 <div className="row"><button className="secondary" disabled={busy} onClick={()=>{setEditing(!editing);setEdit({name:selected.name,email:selected.email||"",phone:selected.phone||"",interest:selected.interest||"",notes:selected.notes||""})}}>{editing?"Cancelar edición":"Editar datos"}</button></div>
 {editing&&<div className="edit-panel"><h3>Corrección de datos</h3><div className="grid">
 {(["name","email","phone","interest","notes"] as const).map(key=><div key={key}><label>{({name:"Nombre",email:"Correo",phone:"Teléfono",interest:"Interés",notes:"Notas"} as const)[key]}</label>{key==="notes"?<textarea value={edit[key]} onChange={e=>setEdit({...edit,[key]:e.target.value})}/>:<input value={edit[key]} onChange={e=>setEdit({...edit,[key]:e.target.value})}/>}</div>)}
 </div><p><button disabled={busy||!edit.name.trim()||(!edit.phone.trim()&&!edit.email.trim())} onClick={saveEdit}>Guardar cambios</button></p></div>}
 <div className="row">
 {selected.kind==="prospect"&&<button className="secondary" disabled={busy} onClick={convert}>Convertir a cliente</button>}
 <a href={"/api/contacts/"+selected.id+"/summary"} className="secondary">Descargar índice PDF</a><a href={"/api/contacts/"+selected.id+"/bundle"} className="secondary">Descargar borrador de expediente</a></div>
 <hr/><h3>Documentos y evidencia</h3><p className="muted">Carga JPG, PNG, WebP o PDF (máximo 8 MB). OCR local para imágenes; la captura extraída requiere revisión.</p>
 <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>{setFile(e.target.files?.[0]||null);setOcr("");setReviewed(false)}}/>
 {file&&<div><p><button className="secondary" disabled={busy||!file.type.startsWith("image/")} onClick={extract}>Extraer texto de imagen (OCR)</button></p>
 <label>Texto OCR editable (opcional)</label><textarea value={ocr} onChange={e=>{setOcr(e.target.value);setReviewed(false)}} rows={5}/>
 {ocr&&<p><label><input style={{width:"auto"}} type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> Confirmo haber revisado el texto contra el original</label></p>}
 <button disabled={busy||Boolean(ocr&&!reviewed)} onClick={upload}>Guardar documento original y extracción revisada</button></div>}
 <h3>Archivos vinculados ({docs.length})</h3><div className="items">{docs.map(d=><div className="item" key={d.id}><a href={"/api/documents/"+d.id}>{d.filename}</a><div className="muted">{d.size_bytes} bytes · OCR revisado: {d.reviewed_at?"sí":"no"}</div><div className="small muted">SHA-256: {d.sha256}</div></div>)}</div>
 <p className="notice">El índice y el borrador consolidado son documentos de consulta, NO certificados. Algunos archivos pueden no incorporarse al PDF; conserva siempre los originales.</p><h3>Historial de acciones</h3><div className="items">{activity.map(a=><div key={a.id} className="item"><strong>{({"contact.created":"Registro creado","contact.updated":"Datos modificados","prospect.converted":"Conversión a cliente","document.uploaded":"Documento incorporado"} as Record<string,string>)[a.action]||a.action}</strong><div className="muted">{new Date(a.created_at).toLocaleString("es-MX")} · {a.actor}</div></div>)}{!activity.length&&<p className="muted">Sin acciones registradas.</p>}</div>
 </>:<p className="muted">Selecciona un contacto para administrar su expediente.</p>}</section></div>
 {message&&<section><p role="status" className={message.includes("Error")?"error":"muted"}>{message}</p></section>}
 <section><h2>Estado de la primera entrega</h2><p>Registro manual, clasificación de prospectos y clientes, conversión trazable, carga de documentos originales, OCR asistido en navegador para imágenes e índice PDF. Pendientes: extracción de campos específicos, OCR de PDF escaneados, expediente consolidado, perfiles de acceso, CRM y trámites.</p></section>
 </main></>;
}
