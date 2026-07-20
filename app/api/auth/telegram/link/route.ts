import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const user = await currentUser() as unknown as { id: string } | null;
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const raw = randomBytes(32).toString("base64url");
  const { error } = await supabaseAdmin().from("telegram_link_tokens").insert({
    user_id: user.id,
    token_hash: createHash("sha256").update(raw).digest("hex"),
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
  if (error) return NextResponse.redirect(new URL("/dashboard?link_error=telegram", request.url));
  const bot = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "arcanumvpnbot";
  return NextResponse.redirect(`https://t.me/${bot}?start=link_${raw}`);
}
