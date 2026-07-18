import Link from "next/link";
import { CalendarDays, Copy, CreditCard, Laptop, ShieldCheck, UserPlus, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import "./dashboard.css";

type User = { id: string; first_name: string | null; telegram_username: string | null; referral_code: string };

export default async function Dashboard() {
  const rawUser = await currentUser();
  if (!rawUser) redirect("/login");
  const user = rawUser as unknown as User;
  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const [{ data: subscription }, { count: devices }, { data: membership }] = await Promise.all([
    db.from("subscriptions").select("status,expires_at,plans(name,device_limit,family_limit)").eq("user_id", user.id).eq("status", "active").gt("expires_at", now).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("devices").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
    db.from("family_members").select("role,families(id,owner_id)").eq("user_id", user.id).maybeSingle(),
  ]);
  const plan = subscription?.plans as unknown as { name?: string; device_limit?: number; family_limit?: number } | null;
  const referralUrl = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "arcanumvpnbot"}?start=ref_${user.referral_code}`;
  const expires = subscription?.expires_at ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(subscription.expires_at)) : null;

  return <main className="dashboard">
    <header><Link className="brand" href="/">ARCANUM</Link><form action="/api/auth/logout" method="post"><button className="button ghost">Выйти</button></form></header>
    <section className="dashHero"><span>ЛИЧНЫЙ КАБИНЕТ</span><h1>Здравствуйте, {user.first_name || "пользователь"}</h1><p>{user.telegram_username ? `@${user.telegram_username}` : "Аккаунт Telegram подключён"}</p></section>
    <section className="statusGrid">
      <article className={subscription ? "statusCard active" : "statusCard"}><ShieldCheck/><div><small>ПОДПИСКА</small><h2>{plan?.name || "Не активна"}</h2><p>{expires ? <>Действует до {expires}</> : "Выберите тариф, чтобы получить доступ"}</p></div></article>
      <article className="statusCard"><Laptop/><div><small>УСТРОЙСТВА</small><h2>{devices || 0} {plural(devices || 0, "подключено", "подключены", "подключено")}</h2><p>{plan?.device_limit ? `Доступно до ${plan.device_limit}` : "Лимит появится после активации"}</p></div></article>
    </section>
    <section className="dashColumns">
      <article className="panel"><div className="panelTitle"><CreditCard/><div><small>УПРАВЛЕНИЕ</small><h2>Тариф и оплата</h2></div></div>{subscription ? <><p>Продление добавит месяц к текущему сроку подписки.</p><button className="button primary" disabled>Продлить — скоро</button></> : <><p>Выберите подходящий тариф. Оплата картой и через СБП появится после подключения платёжного провайдера.</p><Link className="button primary" href="/#plans">Выбрать тариф</Link></>}</article>
      <article className="panel"><div className="panelTitle"><Users/><div><small>СЕМЬЯ</small><h2>{membership ? "Семейная группа" : "Подключите близких"}</h2></div></div><p>{membership ? "Вы состоите в семейной группе. Управление участниками появится после активации семейного тарифа." : "На семейном тарифе можно добавить до пяти участников по защищённой ссылке."}</p><button className="button ghost" disabled><UserPlus size={17}/> Приглашения — скоро</button></article>
    </section>
    <section className="referral"><div><small>РЕФЕРАЛЬНАЯ ПРОГРАММА</small><h2>Приглашайте друзей</h2><p>Персональная ссылка уже создана. Правила начисления бонусов будут включены перед запуском оплаты.</p></div><div className="referralCode"><code>{referralUrl}</code><Copy size={18}/></div></section>
    <footer className="dashFooter"><CalendarDays size={17}/><span>История операций и уведомления появятся после подключения платежей.</span></footer>
  </main>;
}

function plural(value: number, one: string, few: string, many: string) { const mod10=value%10,mod100=value%100;return mod10===1&&mod100!==11?one:mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?few:many; }
