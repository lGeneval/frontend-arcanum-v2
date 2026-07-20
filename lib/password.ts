import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
const scrypt=(password:string,salt:Buffer,options:{N:number;r:number;p:number})=>new Promise<Buffer>((resolve,reject)=>nodeScrypt(password,salt,64,options,(error,key)=>error?reject(error):resolve(key)));

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, { N: 32768, r: 8, p: 1 });
  return `scrypt$32768$8$1$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind,n,r,p,salt,expected] = stored.split("$");
  if (kind !== "scrypt" || !n || !r || !p || !salt || !expected) return false;
  const derived = await scrypt(password, Buffer.from(salt, "base64url"), { N:Number(n), r:Number(r), p:Number(p) });
  const expectedBuffer = Buffer.from(expected, "base64url");
  return derived.length === expectedBuffer.length && timingSafeEqual(derived, expectedBuffer);
}

export function validAccessId(value: string) { return /^[a-z0-9][a-z0-9_-]{4,31}$/.test(value); }
export function validPassword(value: string) { return value.length >= 12 && value.length <= 128; }
