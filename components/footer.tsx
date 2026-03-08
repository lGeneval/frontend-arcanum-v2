"use client";

import Link from "next/link";
import { Apple, Monitor, Smartphone, Tv, Chrome, Terminal, Send, Mail, MessageCircle } from "lucide-react";
import { AnimatedLogo } from "./animated-logo";

const platforms = [
  { name: "iOS", icon: Apple, href: "#" },
  { name: "Android", icon: Smartphone, href: "#" },
  { name: "Windows", icon: Monitor, href: "#" },
  { name: "macOS", icon: Apple, href: "#" },
  { name: "Android TV", icon: Tv, href: "#" },
  { name: "Browser", icon: Chrome, href: "#" },
  { name: "Linux", icon: Terminal, href: "#" },
];

const aboutLinks = [
  { name: "О компании", href: "#" },
  { name: "Пользовательское соглашение", href: "#" },
  { name: "Политика конфиденциальности", href: "#" },
  { name: "Политика возврата", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative pt-20 pb-8 border-t border-purple-500/20 overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-purple-600/10 to-transparent rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <AnimatedLogo size={44} />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent tracking-wider" style={{ fontFamily: "serif" }}>
                Arkanum
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Безопасный VPN для всей семьи. Древняя магия защиты, приватности и свободы в цифровом мире.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-secondary border border-purple-500/20 flex items-center justify-center hover:border-purple-400/50 hover:bg-purple-500/10 transition-all duration-300 hover:scale-110"
              >
                <Send className="w-5 h-5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Downloads */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">
              Скачать
            </h4>
            <ul className="space-y-3">
              {platforms.map((platform) => (
                <li key={platform.name}>
                  <a 
                    href={platform.href}
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <platform.icon className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
                    <span className="text-sm">{platform.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">
              О нас
            </h4>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground hover:text-purple-300 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">
              Поддержка
            </h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:support@arkanum-vpn.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary border border-purple-500/20 flex items-center justify-center group-hover:border-purple-400/50 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="text-sm text-foreground">support@arkanum-vpn.com</div>
                  </div>
                </a>
              </li>
              <li>
                <a 
                  href="#"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary border border-purple-500/20 flex items-center justify-center group-hover:border-purple-400/50 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Онлайн чат</div>
                    <div className="text-sm text-foreground">Доступен 24/7</div>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            2024 Arkanum VPN. Все права защищены.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-purple-300 transition-colors">
              Условия использования
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-purple-300 transition-colors">
              Приватность
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
