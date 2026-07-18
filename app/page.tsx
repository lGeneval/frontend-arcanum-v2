import Link from "next/link";
import { ArrowRight, Check, Globe2, ShieldCheck, Smartphone, Users } from "lucide-react";

const plans = [
  { name: "Мобильный", price: 199, note: "До 2 устройств", features: ["Телефон и планшет", "Все доступные локации", "Поддержка в Telegram"] },
  { name: "Личный", price: 299, note: "До 5 устройств", featured: true, features: ["Телефон, компьютер и ТВ", "Все доступные локации", "Приоритетная поддержка"] },
  { name: "Семейный", price: 449, note: "5 участников · 15 устройств", features: ["Личные доступы для семьи", "Общий баланс", "Приглашение по ссылке"] },
];

export default function Home() {
  return <main>
    <header className="nav shell"><Link className="brand" href="/">ARCANUM</Link><nav><a href="#plans">Тарифы</a><a href="#how">Как подключиться</a></nav><Link className="button ghost" href="/login">Личный кабинет</Link></header>
    <section className="hero"><video autoPlay muted loop playsInline aria-hidden="true"><source src="https://cdn.pixabay.com/video/2020/05/25/40130-424930941_large.mp4" type="video/mp4" /></video><div className="veil"/><div className="heroContent shell"><span className="eyebrow"><ShieldCheck size={16}/> Управление через Telegram</span><h1>Ваш интернет.<br/><em>Ваши правила.</em></h1><p>Подключайте нужные устройства, выбирайте локацию и управляйте подпиской в одном понятном кабинете.</p><div className="actions"><a className="button primary" href="https://t.me/arcanumvpnbot">Открыть Telegram-бота <ArrowRight size={18}/></a><a className="button ghost" href="#plans">Посмотреть тарифы</a></div></div></section>
    <section className="section shell" id="how"><div className="sectionHead"><span>ПРОСТОЙ СТАРТ</span><h2>От входа до подключения — несколько минут</h2></div><div className="featureGrid"><article><Smartphone/><b>01</b><h3>Войдите через Telegram</h3><p>Без пароля и отдельной регистрации.</p></article><article><Globe2/><b>02</b><h3>Выберите тариф</h3><p>Для телефона, всех устройств или семьи.</p></article><article><ShieldCheck/><b>03</b><h3>Подключите устройство</h3><p>Кабинет покажет приложение и инструкцию.</p></article></div></section>
    <section className="section shell" id="plans"><div className="sectionHead"><span>ТАРИФЫ</span><h2>Платите только за нужный формат</h2></div><div className="planGrid">{plans.map(plan => <article className={plan.featured ? "plan featured" : "plan"} key={plan.name}>{plan.featured && <small>ПОПУЛЯРНЫЙ</small>}<h3>{plan.name}</h3><p className="price">{plan.price} ₽<span>/месяц</span></p><p>{plan.note}</p><ul>{plan.features.map(item => <li key={item}><Check size={17}/>{item}</li>)}</ul><a className="button primary" href="https://t.me/arcanumvpnbot">Выбрать тариф</a></article>)}</div></section>
    <section className="family shell"><Users/><div><span>СЕМЕЙНЫЙ ДОСТУП</span><h2>Одна подписка — отдельный доступ для каждого</h2><p>До пяти участников смогут подключаться по приглашению и пополнять общий баланс.</p></div></section>
    <footer className="shell"><span className="brand">ARCANUM</span><p>© 2026 Arcanum. Сервис находится в разработке.</p><a href="https://t.me/arcanumvpnbot">Telegram</a></footer>
  </main>;
}
