import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { verifyPassword, validAccessId } from "@/lib/password";
import { hasValidOrigin } from "@/lib/request-security";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error:"forbidden" }, { status:403 });
  const form = await request.formData();
  const accessId = String(form.get("accessId") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const failure = () => NextResponse.redirect(new URL("/login?error=access_invalid", request.url), 303);
  if (!validAccessId(accessId) || password.length > 128) return failure();
  const db = supabaseAdmin();
  const { data:user } = await db.from("users").select("id,password_hash,failed_login_attempts,locked_until").ilike("access_id",accessId).maybeSingle();
  if (!user?.password_hash) return failure();
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) return NextResponse.redirect(new URL("/login?error=access_locked",request.url),303);
  const ok = await verifyPassword(password,user.password_hash);
  if (!ok) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    await db.from("users").update({failed_login_attempts:attempts,locked_until:attempts>=5?new Date(Date.now()+15*60_000).toISOString():null}).eq("id",user.id);
    return failure();
  }
  await db.from("users").update({failed_login_attempts:0,locked_until:null}).eq("id",user.id);
  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard",request.url),303);
}
