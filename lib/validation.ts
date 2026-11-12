export function limited(value:unknown,max:number) {return typeof value==="string"?value.trim().slice(0,max):"";}
export function validUuid(v:string) {return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);}
export function errorMessage(e:unknown){console.error(e);return "No se pudo completar la operación.";}
