import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { hashPassword, validAccessId, validPassword } from "@/lib/password";
import { hasValidOrigin } from "@/lib/request-security";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error:"forbidden" }, { status:403 });
  const user = await currentUser() as unknown as {id:string}|null;
  if (!user) return NextResponse.redirect(new URL("/login",request.url),303);
  const form=await request.formData();
  const accessId=String(form.get("accessId")||"").trim().toLowerCase();
  const password=String(form.get("password")||"");
  if (!validAccessId(accessId)||!validPassword(password)) return NextResponse.redirect(new URL("/dashboard?access=invalid",request.url),303);
  const passwordHash=await hashPassword(password);
  const {error}=await supabaseAdmin().from("users").update({access_id:accessId,password_hash:passwordHash,failed_login_attempts:0,locked_until:null}).eq("id",user.id);
  return NextResponse.redirect(new URL(error?"/dashboard?access=taken":"/dashboard?access=saved",request.url),303);
}
