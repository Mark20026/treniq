"use client";

import { useTranslations } from "next-intl";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Pricing() {
  const t = useTranslations("Landing.pricing");

  const planKeys = ["starter", "growing", "scaling"] as const;

  const pricingPlans = planKeys.map((key) => ({
    name: t(`${key}.name`),
    price: t(`${key}.price`),
    currency: t("currency"),
    description: t(`${key}.description`),
    clientCap: t(`${key}.clientCap`),
    overage: t(`${key}.overage`),
    features: t.raw(`${key}.features`) as string[],
    buttonText: t(`${key}.cta`),
    popular: key === "growing",
  }));

  return (
    <section
      id="pricing"
      className="relative py-24 px-4 bg-white overflow-hidden"
    >
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {pricingPlans.map((plan, i) => (
            <Card
              key={i}
              className={cn(
                "border bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1.5 rounded-3xl overflow-hidden relative flex flex-col justify-between",
                plan.popular
                  ? "border-indigo-500 ring-2 ring-indigo-500/10 md:scale-[1.03] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.12)] z-10"
                  : "border-slate-100",
              )}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md shadow-indigo-100 select-none animate-pulse">
                  <Sparkles className="h-3 w-3" />
                  <span>{t("popular")}</span>
                </div>
              )}

              <CardContent className="p-8 space-y-6 flex flex-col h-full justify-between">
                <div className="space-y-5">
                  <div>
                    <h3
                      className={cn(
                        "text-xl font-black tracking-tight",
                        plan.popular ? "text-indigo-600" : "text-slate-900",
                      )}
                    >
                      {plan.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="pt-2 border-b border-slate-50 pb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        {plan.currency}
                        {t("month")}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 mt-1.5">
                      {plan.overage}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full",
                      plan.popular
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-slate-50 text-slate-600",
                    )}
                  >
                    {plan.clientCap}
                  </div>

                  <ul className="space-y-3.5 pt-2">
                    {plan.features.map((feature, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-sm font-medium text-slate-600 leading-snug"
                      >
                        <div
                          className={cn(
                            "p-0.5 rounded-full mt-0.5 shrink-0",
                            plan.popular
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-emerald-50 text-emerald-600",
                          )}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className={cn(
                      "w-full font-bold h-12 rounded-xl transition-all active:scale-98 flex items-center justify-center gap-1.5 group text-sm",
                      plan.popular
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200",
                    )}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
