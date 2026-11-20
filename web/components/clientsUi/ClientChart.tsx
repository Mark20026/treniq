"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Weight, Activity, Loader2 } from "lucide-react";

interface ClientChartsProps {
  clientId: string;
}

export default function ClientCharts({ clientId }: ClientChartsProps) {
  const t = useTranslations("ClientCharts");
  const [weightData, setWeightData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientMeasurements();
  }, [clientId]);

  async function fetchClientMeasurements() {
    const { data, error } = await supabase
      .from("measurements")
      .select("measured_at, weight, body_fat")
      .eq("client_id", clientId)
      .not("weight", "is", null)
      .order("measured_at", { ascending: true })
      .limit(20);

    if (!error && data) {
      const chartData = data.map((m) => ({
        date: format(new Date(m.measured_at), "MMM dd", { locale: hu }),
        weight: m.weight,
        bodyFat: m.body_fat,
      }));
      setWeightData(chartData);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 pt-16 sm:pt-0">
        <Card className="flex items-center justify-center min-h-[200px]">
          <CardContent className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            {t("loading")}
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center min-h-[200px] hidden md:flex">
          <CardContent className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            {t("loading")}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (weightData.length === 0) {
    return (
      <div className="pt-16 sm:pt-0">
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border px-4 font-medium text-sm">
          {t("noMeasurements")}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 pt-16 sm:pt-0">
      <Card className="overflow-hidden sm:rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-slate-800">
            <Weight className="h-4 w-4 text-indigo-500" />
            {t("weightChange")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pl-0 sm:p-6 sm:pt-0">
          <div className="w-full h-[220px] sm:h-[250px] text-xs font-semibold text-slate-400">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weightData}
                margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#94a3b8"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden sm:rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-slate-800">
            <Activity className="h-4 w-4 text-emerald-500" />
            {t("bodyFatChange")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pl-0 sm:p-6 sm:pt-0">
          <div className="w-full h-[220px] sm:h-[250px] text-xs font-semibold text-slate-400">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weightData}
                margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#94a3b8"
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="bodyFat"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
