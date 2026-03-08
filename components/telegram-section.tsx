"use client";

import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";

export function TelegramSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-secondary to-pink-500/20 p-1 group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-30 blur-xl group-hover:opacity-50 transition-opacity" />
          
          <div className="relative rounded-3xl bg-card/90 backdrop-blur-xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-start gap-6">
                {/* Telegram icon with sparkle inside the animated container */}
                <div className="relative animate-float">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Send className="w-8 h-8 text-white" />
                  </div>
                  {/* Sparkle moves with the container */}
                  <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "serif" }}>
                    Подписывайся на наш Telegram
                  </h3>
                  <p className="text-muted-foreground max-w-md leading-relaxed">
                    Будь в курсе всех новостей и акций. Получай эксклюзивные предложения первым!
                  </p>
                </div>
              </div>
              
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 whitespace-nowrap border border-purple-400/30"
              >
                <Send className="w-5 h-5 mr-2" />
                Открыть Telegram
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
