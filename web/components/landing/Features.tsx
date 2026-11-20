"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Calendar,
  Dumbbell,
  Utensils,
  MessageCircle,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Save,
  X,
  Plus,
  Coffee,
  Apple,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const featureKeys = [
  "clientManagement",
  "calendar",
  "workout",
  "meal",
  "chat",
] as const;

const featureIcons = {
  clientManagement: Users,
  calendar: Calendar,
  workout: Dumbbell,
  meal: Utensils,
  chat: MessageCircle,
};

const featureColors = {
  clientManagement: "text-indigo-600",
  calendar: "text-emerald-600",
  workout: "text-amber-600",
  meal: "text-rose-600",
  chat: "text-blue-600",
};

const featureBgs = {
  clientManagement: "bg-indigo-50/60 border-indigo-100/50",
  calendar: "bg-emerald-50/60 border-emerald-100/50",
  workout: "bg-amber-50/60 border-amber-100/50",
  meal: "bg-rose-50/60 border-rose-100/50",
  chat: "bg-blue-50/60 border-blue-100/50",
};

export function Features() {
  const t = useTranslations("Landing.features");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFeature = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const features = featureKeys.map((key) => ({
    key,
    icon: featureIcons[key],
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    longDescription: t(`${key}.long`),
    features: t.raw(`${key}.features`) as string[],
    color: featureColors[key],
    bg: featureBgs[key],
  }));

  return (
    <section
      id="features"
      className="relative py-24 px-4 bg-white overflow-hidden"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-50/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-28">
        {/* 1. RÉSZ: A funkciók áttekintése (Grid) */}
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <Badge
              variant="default"
              className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-4 py-1.5 text-xs font-bold rounded-full shadow-sm select-none"
            >
              <Sparkles className="h-3 w-3 mr-1.5 text-indigo-500" />
              {t("badge")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight max-w-xl mx-auto leading-tight">
              {t("title")}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              {t("description")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            {features.map((feature, i) => {
              const isOpen = activeIndex === i;

              return (
                <Card
                  key={i}
                  onClick={() => toggleFeature(i)}
                  className={cn(
                    "group border border-slate-100 bg-white transition-all duration-500 rounded-[2rem] overflow-hidden relative cursor-pointer select-none",
                    isOpen
                      ? "shadow-[0_20px_50px_-12px_rgba(79,70,229,0.08)] border-indigo-100/80 bg-slate-50/30 ring-1 ring-indigo-500/5"
                      : "shadow-[0_4px_25px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_25px_45px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-1.5 hover:border-slate-200/60",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-purple-500 transition-opacity duration-300",
                      isOpen
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  />
                  <CardContent className="p-6 sm:p-8 space-y-5 flex flex-col h-full justify-between">
                    <div className="space-y-4">
                      <div
                        className={cn(
                          "p-3 rounded-xl w-fit border transition-all duration-300 shadow-sm",
                          feature.bg,
                          isOpen && "scale-105 border-indigo-200 bg-indigo-50",
                        )}
                      >
                        <feature.icon
                          className={cn(
                            "h-5 w-5 transition-colors duration-300",
                            feature.color,
                          )}
                        />
                      </div>
                      <h3
                        className={cn(
                          "text-lg font-black text-slate-900 tracking-tight transition-colors duration-200",
                          isOpen
                            ? "text-indigo-600"
                            : "group-hover:text-indigo-600",
                        )}
                      >
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {feature.description}
                      </p>

                      <div
                        className={cn(
                          "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
                          isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="pt-4 mt-1 border-t border-slate-100/80 space-y-4">
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium antialiased">
                              {feature.longDescription}
                            </p>
                            <div className="space-y-2 pt-1">
                              {feature.features.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2.5 py-0.5 text-xs font-semibold text-slate-500"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "pt-3 flex items-center justify-between text-xs font-bold transition-all duration-300 border-t border-transparent",
                        isOpen
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-indigo-600",
                      )}
                    >
                      <span className="tracking-wide">
                        {isOpen ? t("showLess") : t("showMore")}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
                          isOpen
                            ? "rotate-180 text-indigo-600"
                            : "group-hover:translate-y-0.5",
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 2. RÉSZ: Kiemelt Étrendtervező Funkció Bemutató (Split Layout) */}
        <div className="grid lg:grid-cols-12 gap-12 items-center pt-8 border-t border-slate-100">
          {/* Szöveges rész (5 oszlop széles) */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            <Badge
              variant="default"
              className="bg-rose-50 text-rose-700 border border-rose-100 px-3.5 py-1 text-xs font-bold rounded-full shadow-sm"
            >
              ✨ Kiemelt funkció
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
              Villámgyors és precíz <br className="hidden sm:inline" />{" "}
              étrendtervezés
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
              Felejtsd el a kaotikus Excel táblázatokat. Kövesd a kalóriákat és
              makrotápanyagokat valós időben, másolj át teljes napokat egyetlen
              kattintással, és nyújts prémium élményt a klienseidnek.
            </p>
            <ul className="space-y-3 pt-2 text-left w-full max-w-md">
              {[
                "Automatikus kalória és makró számlálás",
                "Teljes napok másolása és beillesztése másodpercek alatt",
                "Kliensoldali azonnali szinkronizáció",
              ].map((text, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 text-xs font-bold text-slate-700"
                >
                  <div className="h-5 w-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-rose-600" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Szoftver Képernyő Mockup (7 oszlop széles) */}
          <div className="lg:col-span-7 bg-slate-950/5 rounded-[2rem] p-2.5 sm:p-3.5 border border-slate-200/60 shadow-xl backdrop-blur-sm w-full">
            <div className="bg-slate-100 rounded-[1.4rem] border border-slate-200 shadow-sm overflow-hidden text-left select-none">
              {/* Böngésző fejléc */}
              <div className="bg-slate-200/70 px-4 py-2.5 flex items-center border-b border-slate-300/60">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="mx-auto bg-white/70 text-slate-400 border border-slate-300/30 rounded-md px-8 py-0.5 text-[9px] font-medium tracking-tight truncate">
                  app.treniq.hu/etrend-tervezo
                </div>
              </div>

              {/* Szoftver belső tere */}
              <div className="bg-white p-4 space-y-4">
                {/* Felső vezérlő sáv */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">
                      Étrend tervező
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold w-full sm:w-auto justify-end">
                    <button className="flex items-center gap-1 border border-emerald-200 bg-emerald-50/50 text-emerald-700 px-2 py-1 rounded-lg">
                      <FileSpreadsheet className="h-3 w-3" /> Excel import
                    </button>
                    <button className="flex items-center gap-1 border border-slate-200 bg-white text-slate-500 px-2 py-1 rounded-lg">
                      <Save className="h-3 w-3" /> Mentés
                    </button>
                    <button className="bg-indigo-600 text-white px-3 py-1 rounded-lg shadow-sm">
                      Terv mentése
                    </button>
                  </div>
                </div>

                {/* Info tipp csík */}
                <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-2.5 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-extrabold text-slate-800 flex items-center gap-1">
                      📋 Hogyan másolhatsz egy egész napot?
                    </p>
                    <p className="text-[9px] text-slate-500 font-medium leading-normal">
                      Kattints a másolás gombra ➔ Válts a cél napra ➔ Kattints a
                      beillesztésre.
                    </p>
                  </div>
                  <X className="h-3 w-3 text-slate-400 shrink-0" />
                </div>

                {/* Mind a 7 Nap vízszintes csíkja (Mobilbarát görgetéssel) */}
                <div className="flex gap-1 overflow-x-auto pb-1.5 border-b border-slate-100 scrollbar-none">
                  {[
                    "Hétfő",
                    "Kedd",
                    "Szerda",
                    "Csütörtök",
                    "Péntek",
                    "Szombat",
                    "Vasárnap",
                  ].map((day, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "px-3 py-1 text-[10px] font-extrabold rounded-full border shrink-0",
                        idx === 0
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm"
                          : "text-slate-400 border-transparent",
                      )}
                    >
                      {day}
                    </span>
                  ))}
                </div>

                {/* Makró kártyák */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      label: "Kalória",
                      val: "120.0",
                      unit: "kcal",
                      color: "text-orange-500",
                      emoji: "🔥",
                    },
                    {
                      label: "Fehérje",
                      val: "22.5",
                      unit: "g",
                      color: "text-indigo-500",
                      emoji: "🧬",
                    },
                    {
                      label: "Szh",
                      val: "0.0",
                      unit: "g",
                      color: "text-amber-500",
                      emoji: "🌾",
                    },
                    {
                      label: "Zsír",
                      val: "2.6",
                      unit: "g",
                      color: "text-emerald-500",
                      emoji: "🥑",
                    },
                  ].map((macro, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/70 p-2 rounded-xl border border-slate-100 text-center shadow-sm"
                    >
                      <span
                        className={cn(
                          "text-[8px] font-black uppercase tracking-wider block",
                          macro.color,
                        )}
                      >
                        {macro.emoji} {macro.label}
                      </span>
                      <p className="text-sm font-black text-slate-900 tracking-tight mt-0.5">
                        {macro.val}
                        <span className="text-[9px] font-medium text-slate-400 ml-0.5">
                          {macro.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Étkezések */}
                <div className="space-y-2">
                  {/* Reggeli */}
                  <div className="border border-amber-100 rounded-xl overflow-hidden bg-amber-50/10">
                    <div className="bg-amber-50/30 px-3 py-2 flex items-center justify-between text-[10px] font-bold text-slate-800 border-b border-amber-100/30">
                      <div className="flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 text-amber-600" />
                        <span>
                          REGGELI{" "}
                          <span className="text-slate-400 font-medium">
                            (1)
                          </span>
                        </span>
                      </div>
                      <span className="text-slate-400 flex items-center gap-0.5 text-[9px]">
                        <Plus className="h-3 w-3" /> Étel
                      </span>
                    </div>
                    <div className="p-2 bg-white">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/40">
                        Csirkemell
                      </span>
                    </div>
                  </div>

                  {/* Tízórai */}
                  <div className="border border-emerald-600/20 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-emerald-600 text-white px-3 py-2 flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <Apple className="h-3.5 w-3.5" />
                        <span>
                          TÍZÓRAI{" "}
                          <span className="opacity-70 font-medium">(1)</span>
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-[9px] opacity-90">
                        <Plus className="h-3 w-3" /> Étel
                      </span>
                    </div>
                    <div className="p-2 bg-white">
                      <span className="text-[10px] font-medium text-slate-400 italic">
                        Névtelen étel
                      </span>
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
