"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Faq() {
  const t = useTranslations("Landing.faq");
  const [leftOpenId, setLeftOpenId] = useState<string | null>(null);
  const [rightOpenId, setRightOpenId] = useState<string | null>(null);

  // Faq kulcsok sorrendben
  const faqKeys = [
    "item1",
    "item2",
    "item3",
    "item4",
    "item5",
    "item6",
    "item7",
    "item9",
    "item10",
  ];

  const faqs = faqKeys.map((key) => ({
    id: key,
    question: t(`questions.${key}.question`),
    answer: t(`questions.${key}.answer`),
  }));

  const halfLength = Math.ceil(faqs.length / 2);
  const firstColumn = faqs.slice(0, halfLength);
  const secondColumn = faqs.slice(halfLength);

  const toggleLeft = (id: string) => {
    setLeftOpenId(leftOpenId === id ? null : id);
  };

  const toggleRight = (id: string) => {
    setRightOpenId(rightOpenId === id ? null : id);
  };

  return (
    <section id="faq" className="relative py-24 px-4 bg-white overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <Badge
            variant="default"
            className="bg-indigo-50 text-indigo-700 border border-indigo-100/80 px-4 py-1.5 text-xs font-bold rounded-full shadow-sm select-none"
          >
            {t("badge")}
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {t("title")}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto font-medium">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4 items-start">
          {/* 1. Oszlop */}
          <div className="space-y-4 w-full">
            {firstColumn.map((faq) => {
              const isOpen = leftOpenId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen
                      ? "bg-slate-50/50 border-indigo-100 shadow-sm"
                      : "border-slate-100 bg-white hover:border-indigo-200/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.01)]"
                  }`}
                >
                  <button
                    onClick={() => toggleLeft(faq.id)}
                    className="flex items-center justify-between p-5 w-full font-bold text-slate-800 hover:text-indigo-600 transition-colors duration-200 text-sm sm:text-[15px] text-left select-none outline-none"
                  >
                    <span className="flex items-center gap-2.5 pr-2">
                      <HelpCircle
                        className={`h-4 w-4 shrink-0 transition-colors duration-300 ${isOpen ? "text-indigo-500" : "text-slate-400"}`}
                      />
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-indigo-600" : ""}`}
                    />
                  </button>

                  <div
                    className="transition-all duration-300 ease-in-out overflow-hidden"
                    style={{
                      maxHeight: isOpen ? "200px" : "0px",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="px-5 pb-5 text-sm leading-relaxed text-slate-500 font-medium border-t border-slate-100/60 pt-4 bg-white/50">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Oszlop */}
          <div className="space-y-4 w-full">
            {secondColumn.map((faq) => {
              const isOpen = rightOpenId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen
                      ? "bg-slate-50/50 border-indigo-100 shadow-sm"
                      : "border-slate-100 bg-white hover:border-indigo-200/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.01)]"
                  }`}
                >
                  <button
                    onClick={() => toggleRight(faq.id)}
                    className="flex items-center justify-between p-5 w-full font-bold text-slate-800 hover:text-indigo-600 transition-colors duration-200 text-sm sm:text-[15px] text-left select-none outline-none"
                  >
                    <span className="flex items-center gap-2.5 pr-2">
                      <HelpCircle
                        className={`h-4 w-4 shrink-0 transition-colors duration-300 ${isOpen ? "text-indigo-500" : "text-slate-400"}`}
                      />
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-indigo-600" : ""}`}
                    />
                  </button>

                  <div
                    className="transition-all duration-300 ease-in-out overflow-hidden"
                    style={{
                      maxHeight: isOpen ? "200px" : "0px",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="px-5 pb-5 text-sm leading-relaxed text-slate-500 font-medium border-t border-slate-100/60 pt-4 bg-white/50">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 text-center">
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            {t("helpText")}{" "}
            <a
              href="mailto:support@treniq.com"
              className="text-indigo-600 font-bold hover:underline underline-offset-4"
            >
              {t("helpLink")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
