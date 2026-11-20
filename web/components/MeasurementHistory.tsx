"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { hu, sk, enUS } from "date-fns/locale";

interface Measurement {
  id: string;
  measured_at: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
}

interface MeasurementHistoryProps {
  clientId: string;
  onRefresh?: () => void;
}

export default function MeasurementHistory({
  clientId,
}: MeasurementHistoryProps) {
  const t = useTranslations("MeasurementHistory");
  const locale = useLocale();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const getLocale = () => {
    switch (locale) {
      case "hu":
        return hu;
      case "sk":
        return sk;
      default:
        return enUS;
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, [clientId]);

  async function fetchMeasurements() {
    const { data, error } = await supabase
      .from("measurements")
      .select("*")
      .eq("client_id", clientId)
      .order("measured_at", { ascending: false });

    if (!error && data) {
      setMeasurements(data);
      if (data.length > 0) {
        const firstKey = format(new Date(data[0].measured_at), "LLLL yyyy", {
          locale: getLocale(),
        });
        setExpandedMonth(firstKey);
      }
    }
    setLoading(false);
  }

  const groupedMeasurements = useMemo(() => {
    const groups: { [key: string]: Measurement[] } = {};
    measurements.forEach((m) => {
      const monthKey = format(new Date(m.measured_at), "LLLL yyyy", {
        locale: getLocale(),
      });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(m);
    });
    return groups;
  }, [measurements, locale]);

  const renderTrend = (
    current: number | null,
    previous: number | null,
    isLowerBetter: boolean,
  ) => {
    if (current === null || previous === null || current === previous) {
      return <Minus className="h-3.5 w-3.5 text-slate-300" />;
    }

    const isDecreasing = current < previous;
    const isPositiveChange = isLowerBetter ? isDecreasing : !isDecreasing;

    if (isDecreasing) {
      return (
        <TrendingDown
          className={`h-3.5 w-3.5 shrink-0 ${isPositiveChange ? "text-emerald-500" : "text-rose-500"}`}
        />
      );
    } else {
      return (
        <TrendingUp
          className={`h-3.5 w-3.5 shrink-0 ${isPositiveChange ? "text-emerald-500" : "text-rose-500"}`}
        />
      );
    }
  };

  if (loading)
    return (
      <div className="pt-20 sm:pt-4 p-8 text-center w-full">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-8 w-48 bg-slate-50 rounded" />
        </div>
      </div>
    );

  if (measurements.length === 0) {
    return (
      <div className="pt-20 sm:pt-4 p-4 sm:p-8 w-full">
        <div className="p-8 sm:p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <Activity className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium italic text-sm">
            {t("noMeasurements")}
          </p>
        </div>
      </div>
    );
  }

  const getMetrics = (item: Measurement, prevItem: Measurement | undefined) => [
    {
      label: t("metricWeight"),
      value: item.weight,
      prevValue: prevItem?.weight,
      unit: "kg",
      lowerBetter: true,
    },
    {
      label: t("metricBodyFat"),
      value: item.body_fat,
      prevValue: prevItem?.body_fat,
      unit: "%",
      lowerBetter: true,
    },
    {
      label: t("metricMuscle"),
      value: item.muscle_mass,
      prevValue: prevItem?.muscle_mass,
      unit: "kg",
      lowerBetter: false,
    },
    {
      label: t("metricChest"),
      value: item.chest,
      prevValue: prevItem?.chest,
      unit: "cm",
      lowerBetter: false,
    },
    {
      label: t("metricWaist"),
      value: item.waist,
      prevValue: prevItem?.waist,
      unit: "cm",
      lowerBetter: true,
    },
    {
      label: t("metricHips"),
      value: item.hips,
      prevValue: prevItem?.hips,
      unit: "cm",
      lowerBetter: true,
    },
  ];

  return (
    <div className="pt-20 sm:pt-4 p-4 sm:p-8 space-y-4 w-full max-w-7xl mx-auto">
      {Object.entries(groupedMeasurements).map(([monthName, monthItems]) => {
        const isMonthExpanded = expandedMonth === monthName;

        return (
          <div
            key={monthName}
            className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all"
          >
            {/* Hónap fejléc */}
            <div
              onClick={() =>
                setExpandedMonth(isMonthExpanded ? null : monthName)
              }
              className="px-4 sm:px-6 py-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-sm font-black text-slate-800 capitalize tracking-tight truncate">
                  {monthName}
                </span>
                <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                  {monthItems.length}
                </span>
              </div>
              {isMonthExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </div>

            {/* Mérések listája */}
            {isMonthExpanded && (
              <div className="divide-y divide-slate-50 bg-white">
                {monthItems.map((item) => {
                  const globalIndex = measurements.findIndex(
                    (m) => m.id === item.id,
                  );
                  const prevItem = measurements[globalIndex + 1];
                  const metrics = getMetrics(item, prevItem);

                  return (
                    <div key={item.id} className="p-4 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider block max-w-full truncate">
                          {format(new Date(item.measured_at), "EEEE, MMMM d", {
                            locale: getLocale(),
                          })}
                        </span>
                      </div>

                      {/* Metrikák rács elrendezése */}
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
                        {metrics.map((metric, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50/40 border border-slate-100 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center space-y-0.5 min-w-0"
                          >
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight truncate w-full">
                              {metric.label}
                            </p>
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full min-w-0">
                              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tighter truncate">
                                {metric.value ?? "--"}
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase shrink-0">
                                {metric.unit}
                              </span>
                              <div className="shrink-0">
                                {renderTrend(
                                  metric.value ?? null,
                                  metric.prevValue ?? null,
                                  metric.lowerBetter,
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
