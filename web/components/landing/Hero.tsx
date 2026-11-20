"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Play,
  Star,
  Sparkles,
  Dumbbell,
  Users,
  Activity,
  MessageCircle,
  Stethoscope,
  Bell,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  const t = useTranslations("Landing.hero");
  const tStats = useTranslations("Landing.stats");

  const stats = [
    { value: "500+", label: tStats("coaches") },
    { value: "10K+", label: tStats("clients") },
    { value: "98%", label: tStats("satisfaction") },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 overflow-hidden bg-slate-50/50">
      {/* Prémium Háttér Effektek */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 -z-10" />

      {/* Ragyogások */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px] -z-10 animate-pulse duration-[8s]" />
      <div className="absolute top-1/3 left-[-100px] w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Bal oldali tartalom */}
          <div className="space-y-7 lg:col-span-7 text-center md:text-left flex flex-col items-center md:items-start">
            <Badge
              variant="default"
              className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-4 py-1.5 text-xs font-bold rounded-full shadow-sm select-none transition-all hover:bg-indigo-100/70"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-600 animate-pulse" />
              {t("badge")}
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-2xl">
              {t("title")}{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent md:block mt-1">
                {t("titleHighlight")}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl">
              {t("description")}
            </p>

            {/* CTA Gombok */}
            <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto pt-2">
              <Link href="/hu/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-14 text-base rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-300 active:scale-98 group"
                >
                  {t("cta")}
                  <ArrowRight className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            {/* Social Proof & Stars */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4 border-t border-slate-100 w-full max-w-md">
              <div className="flex -space-x-2.5">
                {[
                  "from-pink-500 to-rose-400",
                  "from-amber-400 to-orange-500",
                  "from-emerald-400 to-teal-500",
                  "from-indigo-400 to-purple-500",
                ].map((gradient, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 rounded-full bg-gradient-to-tr ${gradient} border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-sm`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 justify-center md:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="text-sm font-bold text-slate-800 ml-1.5">
                    4.9
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {t("trust")}
                </p>
              </div>
            </div>

            {/* Statisztikai sáv */}
            <div className="grid grid-cols-3 gap-6 sm:gap-10 pt-4 max-w-md w-full text-left">
              {stats.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Jobb oldali tartalom - Valódi böngésző/alkalmazás képernyő mockup */}
          <div className="relative flex justify-center lg:col-span-5 pt-10 lg:pt-0 w-full">
            <div className="absolute inset-4 bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 rounded-[2rem] blur-2xl -z-10" />

            {/* Böngésző ablak wrapper */}
            <div className="w-full bg-slate-900/5 rounded-3xl p-2 border border-slate-200 shadow-2xl max-w-2xl lg:max-w-none backdrop-blur-sm">
              <div className="bg-slate-100 rounded-[1.25rem] border border-slate-200 overflow-hidden shadow-sm text-left select-none">
                {/* Képernyő Fejléc / Ablak vezérlők (Mac stílus) */}
                <div className="bg-slate-200/60 px-4 py-3 flex items-center border-b border-slate-300/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30" />
                    <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30" />
                  </div>
                  {/* Fiktív URL sáv a képernyő hatás erősítésére */}
                  <div className="mx-auto bg-white/60 text-slate-400 border border-slate-300/30 rounded-md px-12 py-0.5 text-[10px] font-medium tracking-tight">
                    app.treniq.hu
                  </div>
                </div>

                {/* Alkalmazás belső tere */}
                <div className="p-4 sm:p-5 bg-slate-50 space-y-5">
                  {/* Belső Al-Fejléc */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                        Vezérlőpult
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Üdvözlünk{" "}
                        <span className="text-indigo-600 font-bold">
                          Kovács Alex
                        </span>
                        ! 👋
                      </p>
                    </div>
                    <div className="self-start sm:self-auto flex items-center gap-1.5 text-[10px] font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-600 shadow-sm">
                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Rendszer: <span className="text-emerald-600">Aktív</span>
                    </div>
                  </div>

                  {/* Felső Kártyasor (Standard magasságok és szélességek) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Kliensek
                        </span>
                        <div className="p-1 bg-indigo-50 rounded-lg text-indigo-600">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xl font-black text-slate-900">
                          28
                        </span>
                        <p className="text-[8px] text-slate-400 font-medium">
                          24 aktív
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Tervek
                        </span>
                        <div className="p-1 bg-emerald-50 rounded-lg text-emerald-600">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xl font-black text-slate-900">
                          19
                        </span>
                        <p className="text-[8px] text-slate-400 font-medium">
                          folyamatban
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between h-20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Edzések
                        </span>
                        <div className="p-1 bg-purple-50 rounded-lg text-purple-600">
                          <Dumbbell className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-xl font-black text-slate-900">
                            32
                          </span>
                        </div>
                        <div className="flex items-center text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-150">
                          <TrendingUp className="h-2 w-2 mr-0.5 stroke-[3]" />
                          +23%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Második Kártyasor */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">
                          💪 Mai edzések
                        </span>
                        <span className="text-base font-black text-slate-900 block mt-0.5">
                          6
                        </span>
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Dumbbell className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">
                          💬 Mai konz.
                        </span>
                        <span className="text-base font-black text-slate-900 block mt-0.5">
                          3
                        </span>
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">
                          📏 Mai mérések
                        </span>
                        <span className="text-base font-black text-slate-900 block mt-0.5">
                          2
                        </span>
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                        <Stethoscope className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Alsó rész: Fix magasságú Grafikon és Értesítések */}
                  <div className="grid sm:grid-cols-12 gap-3">
                    {/* Grafikon kártya */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm sm:col-span-7 flex flex-col justify-between h-40">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block tracking-tight">
                          Edzések alakulása
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          Az elmúlt 7 nap eloszlása
                        </span>
                      </div>

                      {/* Chart standard magasságokkal (h-8, h-12 stb.) */}
                      <div className="flex items-end justify-between gap-2 h-16 border-b border-slate-100 pb-1 px-1">
                        {[
                          { day: "júl. 13", style: { height: "30%" } },
                          { day: "júl. 14", style: { height: "60%" } },
                          { day: "júl. 15", style: { height: "45%" } },
                          { day: "júl. 16", style: { height: "80%" } },
                          { day: "júl. 17", style: { height: "40%" } },
                          { day: "júl. 18", style: { height: "95%" } },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-1 justify-end h-full"
                          >
                            <div
                              style={item.style}
                              className="w-full bg-indigo-50 rounded-t-sm group-hover:bg-indigo-150 transition-all"
                            />
                            <span className="text-[7px] text-slate-400 font-bold tracking-tight whitespace-nowrap">
                              {item.day}
                            </span>
                          </div>
                        ))}
                        {/* Mai aktív nap */}
                        <div className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
                          <div
                            style={{ height: "100%" }}
                            className="w-full bg-indigo-600 rounded-t-sm shadow-sm"
                          />
                          <span className="text-[7px] text-indigo-600 font-black tracking-tight whitespace-nowrap">
                            júl. 19
                          </span>
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400 text-center font-semibold mt-1">
                        Összesen:{" "}
                        <span className="text-slate-700 font-bold">
                          32 edzés
                        </span>{" "}
                        ezen a héten
                      </p>
                    </div>

                    {/* Értesítések kártya */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm sm:col-span-5 flex flex-col justify-between h-40">
                      <div className="w-full flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block tracking-tight">
                            Értesítések
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            Legfrissebbek
                          </span>
                        </div>
                        <div className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                        </div>
                      </div>

                      <div className="space-y-1.5 my-1">
                        <div className="flex items-start gap-1.5 text-left bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div className="h-1 w-1 bg-indigo-500 rounded-full mt-1 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-800 truncate">
                              Új kliens regisztrált
                            </p>
                            <p className="text-[8px] font-medium text-slate-400 truncate">
                              Szabó Dániel
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 text-left bg-white p-1.5 rounded-lg border border-slate-50">
                          <div className="h-1 w-1 bg-emerald-500 rounded-full mt-1 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-700 truncate">
                              Súly naplózva
                            </p>
                            <p className="text-[8px] font-medium text-slate-400 truncate">
                              Nagy Petra: -1.2 kg
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
