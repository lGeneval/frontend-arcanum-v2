import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { supabaseAdmin } from "@/lib/supabase-admin";

const equal = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET || "";
  const actual = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!expected || !equal(actual, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = supabaseAdmin();
  const now = new Date();
  const until = new Date(now.getTime() + 3 * 86_400_000);
  const { data: subscriptions, error } = await db
    .from("subscriptions")
    .select("id,user_id,expires_at,users(telegram_id),plans(name)")
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .lte("expires_at", until.toISOString());

  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  let sent = 0;
  for (const item of subscriptions || []) {
    const dedupeKey = `subscription_3d:${item.id}`;
    const { data: existing } = await db
      .from("notifications")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();
    if (existing) continue;

    const user = item.users as unknown as { telegram_id: number } | null;
    const plan = item.plans as unknown as { name: string } | null;
    if (!user) continue;

    const date = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(new Date(item.expires_at));

    await sendTelegramMessage(
      user.telegram_id,
      `Подписка <b>${plan?.name || "Arcanum"}</b> заканчивается ${date}. Откройте кабинет, чтобы продлить доступ.`,
    );
    await db.from("notifications").insert({
      user_id: item.user_id,
      type: "subscription_expiring",
      dedupe_key: dedupeKey,
      sent_at: new Date().toISOString(),
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
