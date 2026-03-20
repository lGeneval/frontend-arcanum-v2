"use client";

import { Shield, CreditCard, ArrowRight, Check, Sparkles } from "lucide-react";
import { MagicButton } from "./magic-button";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Family protection card */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-card to-pink-500/20 p-1 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="relative h-full rounded-3xl bg-card/95 backdrop-blur-xl p-8 md:p-10 overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: '32px 32px'
                }} />
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 animate-pulse-glow">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "serif" }}>
                  Защитите свою семью
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Один аккаунт защищает всех членов семьи. Родительский контроль, безопасный интернет для детей.
                </p>

                <ul className="space-y-3 mb-8">
                  {["До 10 устройств", "Родительский контроль", "Общий доступ"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-foreground">
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-purple-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link href="/login">
                  <MagicButton 
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border border-purple-400/30"
                  >
                    Подключить семью
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </MagicButton>
                </Link>
              </div>
            </div>
          </div>

          {/* Free trial card */}
          <div className="group relative rounded-3xl bg-gradient-to-br from-pink-500/20 via-card to-purple-500/20 p-1 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500">
            <div className="relative h-full rounded-3xl bg-card/95 backdrop-blur-xl p-8 md:p-10 overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 animate-shimmer opacity-30" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "serif" }}>
                  Начните бесплатно
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  7 дней бесплатного доступа ко всем премиум функциям. Без привязки карты.
                </p>

                <div className="bg-purple-500/10 rounded-2xl p-6 mb-8 border border-purple-500/20">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-foreground" style={{ fontFamily: "serif" }}>0 ₽</span>
                    <span className="text-muted-foreground">/ 7 дней</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Затем от 299 ₽/мес при годовой подписке
                  </p>
                </div>

                <Link href="/login">
                  <MagicButton 
                    size="lg"
                    variant="outline"
                    className="w-full border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-400/50"
                  >
                    Попробовать бесплатно
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </MagicButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}