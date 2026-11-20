"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  const t = useTranslations("Landing.cta");

  return (
    <section className="relative py-24 sm:py-32 px-4 overflow-hidden bg-slate-950">
      {/* Drámai háttérfények (Glow effektek) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Rácsháló minta a háttérben (Opcionális, nagyon halvány) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e510_1px,transparent_1px),linear-gradient(to_bottom,#4f46e510_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center z-10">
        {/* Lebegő, prémium Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-5 py-2 rounded-full text-xs sm:text-sm font-bold border border-indigo-500/20 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(79,70,229,0.15)]">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          {t("badge")}
        </div>

        {/* Címsor prémium színátmenettel */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
          {t("title")} <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent pb-2 block sm:inline-block">
            {t("titleHighlight")}
          </span>
        </h2>

        {/* Leírás */}
        <p className="text-slate-400 text-lg sm:text-xl mt-6 max-w-2xl mx-auto font-medium leading-relaxed">
          {t("description")}
        </p>

        {/* Gombok */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link href="/hu/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-100 font-black px-8 h-14 text-base rounded-xl transition-all duration-300 hover:scale-105 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] group"
            >
              {t("cta")}
              <ArrowRight className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Megnyugtató apró szöveg a gombok alatt */}
        <p className="mt-6 text-xs text-slate-500 font-medium">
          {t("subtext")}
        </p>
      </div>
    </section>
  );
}
