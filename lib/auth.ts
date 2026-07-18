import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
const COOKIE="arcanum_session";const hash=(v:string)=>createHash("sha256").update(v).digest("hex");
export async function createSession(userId:string){const token=randomBytes(32).toString("base64url");const expiresAt=new Date(Date.now()+30*86400_000);const{error}=await supabaseAdmin().from("sessions").insert({user_id:userId,token_hash:hash(token),expires_at:expiresAt.toISOString()});if(error)throw error;(await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt})}
export async function currentUser(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const{data}=await supabaseAdmin().from("sessions").select("user_id, users(*)").eq("token_hash",hash(token)).gt("expires_at",new Date().toISOString()).maybeSingle();return data?.users??null}
export async function destroySession(){const store=await cookies();const token=store.get(COOKIE)?.value;if(token)await supabaseAdmin().from("sessions").delete().eq("token_hash",hash(token));store.delete(COOKIE)}
