"use client";
import {useEffect,useState} from "react";
type Contact={id:string;name:string;kind:string};
type Property={id:string;code:string;title:string;municipality:string;neighborhood:string;category:string;operation:string;price_mxn:number;status:string};
type Followup={id:string;contact_id:string;contact_name:string;property_code:string|null;subject:string;due_at:string;status:string};
type Match={contact_id:string;property_id:string;contact_name:string;property_code:string;status:string};
const cat:Record<string,string>={house:"Casa",apartment:"Departamento",land:"Terreno",commercial:"Local comercial",other:"Otro"};
const st:Record<string,string>={available:"Disponible",reserved:"Apartada",closed:"Cerrada",inactive:"Inactiva",pending:"Pendiente",done:"Realizado",cancelled:"Cancelado"};
async function request(url:string,method:string,body:unknown){
 const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const data=await r.json();if(!r.ok)throw Error(data.error||"Operación no realizada");return data;
}
export default function Operations(){
 const [contacts,setContacts]=useState<Contact[]>([]),[properties,setProperties]=useState<Property[]>([]),[followups,setFollowups]=useState<Followup[]>([]),[matches,setMatches]=useState<Match[]>([]);
 const [error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const [p,setP]=useState({code:"",title:"",municipality:"",neighborhood:"",category:"house",operation:"sale",price_mxn:"",notes:""});
 const [f,setF]=useState({contactId:"",propertyId:"",subject:"",dueAt:""});
 const [m,setM]=useState({contactId:"",propertyId:""});
 const [search,setSearch]=useState("");
 async function refresh(){
  const endpoints=["/api/contacts","/api/properties","/api/followups","/api/matches"];
  const results=await Promise.all(endpoints.map(x=>fetch(x,{cache:"no-store"})));
  for(const response of results)if(!response.ok)throw Error("No se pudo cargar información operativa.");
  const [a,b,c,d]=await Promise.all(results.map(x=>x.json()));
  setContacts(a);setProperties(b);setFollowups(c);setMatches(d);
 }
 useEffect(()=>{void refresh().catch(e=>setError(String(e)))},[]);
 async function run(task:()=>Promise<unknown>,success:string){
  setBusy(true);setError("");setMessage("");
  try{await task();await refresh();setMessage(success);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 const available=properties.filter(p=>p.status==="available").length;
 const pending=followups.filter(f=>f.status==="pending");
 const overdue=pending.filter(f=>new Date(f.due_at).getTime()<Date.now()).length;
 const visible=properties.filter(q=>(q.code+" "+q.title+" "+q.municipality+" "+q.neighborhood).toLowerCase().includes(search.toLowerCase()));
 return <><header><h1>INMOBILIARIA LM · Operaciones</h1><p>Inventario, interesados y próximos compromisos</p></header><main>
 <nav className="row"><a className="secondary" href="/">Directorio y expedientes</a><a className="secondary" href="/operaciones">Operaciones</a></nav>
 <section><h2>Resumen operativo</h2><div className="grid">
  <div><strong className="metric">{contacts.length}</strong><p>Contactos registrados (máximo 250 en la vista)</p></div>
  <div><strong className="metric">{available}</strong><p>Propiedades disponibles</p></div>
  <div><strong className="metric">{pending.length}</strong><p>Gestiones pendientes</p></div>
  <div><strong className="metric">{overdue}</strong><p>Gestiones vencidas</p></div>
 </div><p className="muted">Datos almacenados en PostgreSQL. No son cifras comerciales verificadas ni resultados de venta.</p></section>
 <section><h2>Inventario inmobiliario</h2><form onSubmit={e=>{e.preventDefault();void run(()=>request("/api/properties","POST",{...p,price_mxn:Number(p.price_mxn)}),"Propiedad registrada.");}}>
 <div className="grid">
  <div><label>Código único *</label><input required maxLength={40} value={p.code} onChange={e=>setP({...p,code:e.target.value})} placeholder="LM-001"/></div>
  <div><label>Descripción *</label><input required maxLength={180} value={p.title} onChange={e=>setP({...p,title:e.target.value})}/></div>
  <div><label>Municipio *</label><input required maxLength={100} value={p.municipality} onChange={e=>setP({...p,municipality:e.target.value})}/></div>
  <div><label>Colonia</label><input maxLength={120} value={p.neighborhood} onChange={e=>setP({...p,neighborhood:e.target.value})}/></div>
  <div><label>Tipo</label><select value={p.category} onChange={e=>setP({...p,category:e.target.value})}>{Object.entries(cat).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></div>
  <div><label>Operación</label><select value={p.operation} onChange={e=>setP({...p,operation:e.target.value})}><option value="sale">Venta</option><option value="rent">Renta</option></select></div>
  <div><label>Precio MXN *</label><input required type="number" min="0" step=".01" value={p.price_mxn} onChange={e=>setP({...p,price_mxn:e.target.value})}/></div>
  <div><label>Notas internas</label><input maxLength={2000} value={p.notes} onChange={e=>setP({...p,notes:e.target.value})}/></div>
 </div><p><button disabled={busy||!p.price_mxn}>Registrar propiedad</button></p></form>
 <label htmlFor="property-search">Buscar en inventario</label><input id="property-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Código, colonia o municipio"/>
 <div className="items" style={{marginTop:12}}>{visible.map(q=><div key={q.id} className="item"><div className="row between"><strong>{q.code} · {q.title}</strong><span className="pill">{st[q.status]||q.status}</span></div>
 <p className="muted">{cat[q.category]} · {q.operation==="sale"?"Venta":"Renta"} · {q.municipality}{q.neighborhood?", "+q.neighborhood:""} · {Number(q.price_mxn).toLocaleString("es-MX",{style:"currency",currency:"MXN"})}</p>
 <div className="row"><label>Estado <select aria-label={"Estado "+q.code} value={q.status} disabled={busy} onChange={e=>void run(()=>request("/api/properties/"+q.id,"PATCH",{status:e.target.value}),"Estado de propiedad actualizado.")}>{Object.entries({available:"Disponible",reserved:"Apartada",closed:"Cerrada",inactive:"Inactiva"}).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label></div></div>)}
 {!visible.length&&<p className="muted">No hay propiedades que coincidan con la búsqueda.</p>}</div></section>
 <section><h2>Próximas gestiones</h2>
 <form onSubmit={e=>{e.preventDefault();void run(()=>request("/api/followups","POST",{...f,propertyId:f.propertyId||null,dueAt:new Date(f.dueAt).toISOString()}),"Gestión programada.");}}>
 <div className="grid">
  <div><label>Contacto *</label><select required value={f.contactId} onChange={e=>setF({...f,contactId:e.target.value})}><option value="">Seleccionar contacto</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
  <div><label>Propiedad (opcional)</label><select value={f.propertyId} onChange={e=>setF({...f,propertyId:e.target.value})}><option value="">Sin propiedad</option>{properties.map(q=><option key={q.id} value={q.id}>{q.code} · {q.title}</option>)}</select></div>
  <div><label>Actividad *</label><input required maxLength={250} value={f.subject} onChange={e=>setF({...f,subject:e.target.value})} placeholder="Llamar, mostrar, solicitar información..."/></div>
  <div><label>Fecha y hora *</label><input required type="datetime-local" value={f.dueAt} onChange={e=>setF({...f,dueAt:e.target.value})}/></div>
 </div><p><button disabled={busy||!contacts.length}>Programar seguimiento</button></p></form>
 <div className="items">{followups.map(t=><div key={t.id} className="item"><div className="row between"><strong>{t.subject}</strong><span className="pill">{st[t.status]||t.status}</span></div><p className="muted">{t.contact_name} · {t.property_code||"Sin propiedad"} · {new Date(t.due_at).toLocaleString("es-MX")}</p>
 <div className="row">{t.status==="pending"?<><button disabled={busy} onClick={()=>void run(()=>request("/api/followups/"+t.id,"PATCH",{status:"done"}),"Gestión completada.")}>Marcar realizada</button><button className="secondary" disabled={busy} onClick={()=>void run(()=>request("/api/followups/"+t.id,"PATCH",{status:"cancelled"}),"Gestión cancelada.")}>Cancelar</button></>:<button className="secondary" disabled={busy} onClick={()=>void run(()=>request("/api/followups/"+t.id,"PATCH",{status:"pending"}),"Gestión reabierta.")}>Reabrir</button>}</div>
 </div>)}{!followups.length&&<p className="muted">Sin gestiones registradas.</p>}</div></section>
 <section><h2>Vincular interesados y propiedades</h2>
 <form onSubmit={e=>{e.preventDefault();void run(()=>request("/api/matches","POST",m),"Vínculo registrado.");}}>
 <div className="grid"><div><label>Interesado</label><select required value={m.contactId} onChange={e=>setM({...m,contactId:e.target.value})}><option value="">Seleccionar</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
 <div><label>Propiedad</label><select required value={m.propertyId} onChange={e=>setM({...m,propertyId:e.target.value})}><option value="">Seleccionar</option>{properties.map(q=><option key={q.id} value={q.id}>{q.code} · {q.title}</option>)}</select></div></div>
 <p><button disabled={busy||!contacts.length||!properties.length}>Vincular</button></p></form>
 <div className="items">{matches.map(x=><div className="item" key={x.contact_id+x.property_id}><strong>{x.contact_name}</strong><p className="muted">{x.property_code} · Interés registrado</p></div>)}{!matches.length&&<p className="muted">Sin vínculos registrados.</p>}</div></section>
 {error&&<section><p role="alert" className="error">{error}</p></section>}{message&&<section><p role="status" className="success">{message}</p></section>}
 <section><p className="notice">Prototipo: no ingresar datos personales reales hasta disponer de acceso individual, roles, protección documental, consentimiento y copias de seguridad verificadas.</p></section>
 </main></>;
}
