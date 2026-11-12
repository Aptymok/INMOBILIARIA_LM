import { NextRequest, NextResponse } from "next/server";
// Middleware runs in the Edge runtime; avoid Node-only crypto modules.
async function equalSecret(a:string,b:string) {
 const enc=new TextEncoder();
 const [ha,hb]=await Promise.all([crypto.subtle.digest("SHA-256",enc.encode(a)),crypto.subtle.digest("SHA-256",enc.encode(b))]);
 const x=new Uint8Array(ha),y=new Uint8Array(hb);
 let difference=0;for(let i=0;i<x.length;i++)difference|=x[i]^y[i];
 return difference===0;
}
export async function middleware(req:NextRequest){
 const user=process.env.ADMIN_USER;const pass=process.env.ADMIN_PASSWORD;
 if(!user||!pass||pass==="CHANGE_ME_LONG_RANDOM_SECRET")
 return new NextResponse("Configure ADMIN_USER y ADMIN_PASSWORD antes de usar la aplicación.",{status:503});
 const auth=req.headers.get("authorization")||"";
 let supplied="";
 try{if(auth.startsWith("Basic "))supplied=atob(auth.slice(6));}catch{}
 const index=supplied.indexOf(":");
 const valid=index>=0 && await equalSecret(supplied.slice(0,index),user) && await equalSecret(supplied.slice(index+1),pass);
 if(!valid)return new NextResponse("Autenticación requerida",{status:401,headers:{"WWW-Authenticate":'Basic realm="Inmobiliaria LM"',"Cache-Control":"no-store"}});
 return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
