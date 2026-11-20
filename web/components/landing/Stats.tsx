"use client";

import { useTranslations } from "next-intl";
import { Users, ShieldCheck, Heart, Star } from "lucide-react";

export function Stats() {
  const t = useTranslations("Landing.stats");

  const stats = [
    {
      value: "500+",
      label: t("coaches"),
      icon: <Users className="h-4 w-4 text-indigo-500" />,
    },
    {
      value: "10K+",
      label: t("clients"),
      icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
    },
    {
      value: "98%",
      label: t("satisfaction"),
      icon: <Heart className="h-4 w-4 text-rose-500" />,
    },
    {
      value: "4.9",
      label: t("rating"),
      icon: <Star className="h-4 w-4 text-amber-500 fill-amber-500" />,
    },
  ];

  return (
    <section className="relative py-16 bg-white border-y border-slate-100 overflow-hidden">
      {/* Finom háttérfény dekoráció */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[150px] bg-indigo-50/30 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-center p-4 lg:px-8 group transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Kis ikon jelvény a szám felett */}
              <div className="mb-3 p-2 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-md group-hover:shadow-slate-100 transition-all duration-300 border border-slate-100/50">
                {stat.icon}
              </div>

              {/* Szám érték prémium színátmenettel */}
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight bg-gradient-to-br from-slate-950 to-slate-800 bg-clip-text text-transparent">
                {stat.value}
              </p>

              {/* Címke */}
              <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-500 tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
