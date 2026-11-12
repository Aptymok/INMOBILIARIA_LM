import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
function eq(a:string,b:string) {const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length && timingSafeEqual(x,y);}
export function middleware(req:NextRequest){
 const user=process.env.ADMIN_USER; const pass=process.env.ADMIN_PASSWORD;
 if (!user || !pass || pass==="CHANGE_ME_LONG_RANDOM_SECRET") return new NextResponse("Configure ADMIN_USER y ADMIN_PASSWORD antes de usar la aplicación.",{status:503});
 const auth=req.headers.get("authorization")||"";
 let supplied="";
 try {if(auth.startsWith("Basic "))supplied=atob(auth.slice(6));}catch{}
 const split=supplied.indexOf(":");
 if(split<0 || !eq(supplied.slice(0,split),user)||!eq(supplied.slice(split+1),pass))
 return new NextResponse("Autenticación requerida",{status:401,headers:{"WWW-Authenticate":'Basic realm="Inmobiliaria LM"',"Cache-Control":"no-store"}});
 return NextResponse.next();
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
