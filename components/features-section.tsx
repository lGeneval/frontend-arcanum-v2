"use client";

import { Globe, Shield, Eye, Smartphone, Users, Zap, Lock } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Серверы по всему миру",
    description: "Более 100 серверов в 50+ странах мира. Получайте доступ к контенту из любой точки планеты.",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: Shield,
    title: "Непробиваемая защита",
    description: "AES-256 шифрование военного уровня. Ваши данные под надёжной защитой 24/7.",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    icon: Eye,
    title: "Политика No-Logs",
    description: "Мы не храним и не отслеживаем ваши действия. Полная приватность — наш главный приоритет.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Smartphone,
    title: "До 10 устройств",
    description: "Подключайте все ваши устройства: телефоны, планшеты, компьютеры и Smart TV.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Users,
    title: "Семейный доступ",
    description: "Один аккаунт для всей семьи. Защитите близких без дополнительных затрат.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Молниеносная скорость",
    description: "Оптимизированные протоколы для максимальной скорости без потери безопасности.",
    gradient: "from-yellow-500 to-orange-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="about" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 backdrop-blur-sm">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Преимущества</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance" style={{ fontFamily: "serif" }}>
            Почему выбирают{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
              Arkanum
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Мощная защита для вас и вашей семьи
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl bg-card border border-purple-500/10 p-8 hover:border-purple-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-300 transition-colors" style={{ fontFamily: "serif" }}>
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Animated corner accent */}
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-150" />
            </div>
          ))}
        </div>

        {/* Stats section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "50+", label: "Стран" },
            { value: "100+", label: "Серверов" },
            { value: "1M+", label: "Пользователей" },
            { value: "24/7", label: "Поддержка" },
          ].map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform" style={{ fontFamily: "serif" }}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
