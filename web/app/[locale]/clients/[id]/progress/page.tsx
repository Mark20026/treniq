"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  Dumbbell,
  Activity,
  Weight,
  Layers,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface ExerciseLog {
  id: string;
  performed_at: string;
  sets_completed: number;
  reps_completed: string;
  weight_used: string | null;
  feeling: number | null;
  notes?: string | null;
}

type ChartPoint = { chartIndex: number; date: string; formattedDate: string; fullDate: string; volume: number; avgWeight: number; sets: number; reps: string; weightUsed: string | null };
const CustomTooltip = ({ active, payload, activeTab }: { active?: boolean; payload?: { payload: ChartPoint }[]; activeTab: "volume" | "weight" }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg">
        <p className="text-xs text-slate-400 mb-1 font-medium">
          {dataPoint.formattedDate}
        </p>
        {activeTab === "volume" ? (
          <>
            <p className="text-sm font-bold text-indigo-600">
              {dataPoint.volume?.toLocaleString() || 0} kg
            </p>
            <p className="text-xs text-slate-500">
              {dataPoint.sets} × ({dataPoint.reps})
            </p>
            {dataPoint.weightUsed && (
              <p className="text-xs text-slate-400 mt-1">
                {dataPoint.weightUsed} kg
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-emerald-600">
              {dataPoint.avgWeight || 0} kg
            </p>
            <p className="text-xs text-slate-500">{dataPoint.sets}</p>
            {dataPoint.weightUsed && (
              <p className="text-xs text-slate-400 mt-1">
                {dataPoint.weightUsed} kg
              </p>
            )}
          </>
        )}
      </div>
    );
  }
  return null;
};

export default function ClientProgressPage() {
  const t = useTranslations("ClientProgress");
  const params = useParams();
  const pathname = usePathname();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>("");
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [activeTab, setActiveTab] = useState<"volume" | "weight">("volume");
  const [isMounted, setIsMounted] = useState(false);

  const locale = pathname?.split("/")[1] || "hu";

  const fetchExercises = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: plans } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("client_id", params.id);

    if (!plans || plans.length === 0) {
      setLoading(false);
      return;
    }

    const planIds = plans.map((p) => p.id);

    const { data, error } = await supabase
      .from("exercises")
      .select("id, name, category")
      .in("workout_plan_id", planIds);

    if (!error && data && data.length > 0) {
      setExercises(data);
      setSelectedExercise(data[0].id);
      setSelectedExerciseName(data[0].name);
    }
    setLoading(false);
  }, [params.id]);

  const calculateVolume = (log: ExerciseLog): number => {
    if (!log.weight_used || !log.reps_completed) return 0;

    const weights = log.weight_used.split(",").map((w) => parseFloat(w.trim()));
    const reps = log.reps_completed.split(",").map((r) => parseInt(r.trim()));

    let totalVolume = 0;
    for (let i = 0; i < log.sets_completed; i++) {
      const weight = weights[i] || weights[weights.length - 1] || 0;
      const rep = reps[i] || reps[reps.length - 1] || 0;
      totalVolume += weight * rep;
    }
    return totalVolume;
  };

  const calculateAverageWeight = (log: ExerciseLog): number => {
    if (!log.weight_used) return 0;
    const weights = log.weight_used.split(",").map((w) => parseFloat(w.trim()));
    const validWeights = weights.filter((w) => w > 0);
    if (validWeights.length === 0) return 0;
    return validWeights.reduce((a, b) => a + b, 0) / validWeights.length;
  };

  const fetchExerciseLogs = useCallback(async () => {
    if (!selectedExerciseName) return;

    let workoutQuery = supabase
      .from("workout_logs")
      .select("id, performed_at, feeling, notes")
      .eq("client_id", params.id);
    const { data: workoutLogs } = await workoutQuery.order("performed_at", { ascending: true });

    if (!workoutLogs || workoutLogs.length === 0) {
      setLogs([]);
      setChartData([]);
      return;
    }

    const workoutLogIds = workoutLogs.map((wl) => wl.id);

    const { data, error } = await supabase
      .from("workout_log_exercises")
      .select("*, workout_log:workout_logs(performed_at, feeling, notes)")
      .in("workout_log_id", workoutLogIds)
      .eq("exercise_name", selectedExerciseName);

    if (error) {
      console.error("Error fetching logs:", error);
    }

    if (!error && data && data.length > 0) {
      const formattedLogs = data.map((log) => ({
        id: log.id,
        performed_at: log.workout_log.performed_at,
        sets_completed: log.sets_completed,
        reps_completed: log.reps_completed,
        weight_used: log.weight_used,
        feeling: log.workout_log.feeling,
        notes: log.workout_log.notes,
      }));
      formattedLogs.sort((a, b) =>
        a.performed_at.localeCompare(b.performed_at) || a.id.localeCompare(b.id),
      );
      setLogs(formattedLogs);

      const chartPoints = formattedLogs.map((log, index) => {
        const volume = calculateVolume(log);
        const avgWeight = calculateAverageWeight(log);

        return {
          chartIndex: index,
          date: new Date(log.performed_at).toLocaleDateString(`${locale}-HU`, {
            month: "short",
            day: "numeric",
          }),
          formattedDate: new Date(log.performed_at).toLocaleDateString(
            `${locale}-HU`,
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            },
          ),
          fullDate: log.performed_at,
          volume: Math.round(volume),
          avgWeight: Math.round(avgWeight * 10) / 10,
          sets: log.sets_completed,
          reps: log.reps_completed,
          weightUsed: log.weight_used,
        };
      });

      setChartData(chartPoints);
    } else {
      setLogs([]);
      setChartData([]);
    }
  }, [selectedExerciseName, params.id, locale]);

  useEffect(() => {
    void Promise.resolve().then(() => { setIsMounted(true); return fetchExercises(); });
  }, [fetchExercises]);

  useEffect(() => {
    if (selectedExercise) void Promise.resolve().then(fetchExerciseLogs);
  }, [selectedExercise, fetchExerciseLogs]);

  const handleExerciseChange = (exerciseId: string, exerciseName: string) => {
    setSelectedExercise(exerciseId);
    setSelectedExerciseName(exerciseName);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50">
        <Sidebar />
        {/* Eltávolítottuk az md:ml-64-et a loading állapotból */}
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const totalWorkouts = logs.length;
  const totalSets = logs.reduce(
    (sum, log) => sum + (log.sets_completed || 0),
    0,
  );

  const getMaxVolume = () => {
    let max = 0;
    logs.forEach((log) => {
      const volume = calculateVolume(log);
      if (volume > max) max = volume;
    });
    return max;
  };

  const getLastVolume = () => {
    const lastLog = logs[logs.length - 1];
    if (!lastLog) return 0;
    return calculateVolume(lastLog);
  };

  const getFirstVolume = () => {
    const firstLog = logs[0];
    if (!firstLog) return 0;
    return calculateVolume(firstLog);
  };

  const getChange = () => {
    const first = getFirstVolume();
    const last = getLastVolume();
    if (first === 0 || last === 0) return 0;
    const change = ((last - first) / first) * 100;
    return change.toFixed(0);
  };

  const selectedExerciseDisplay =
    exercises.find((e) => e.id === selectedExercise)?.name ||
    selectedExerciseName;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50 text-slate-800">
      <Sidebar />

      {/*
        Eltávolítottuk az "md:ml-64" és "w-full" osztályokat.
        Ezentúl a Sidebar komponensben lévő Spacer tolja el a tartalmat dinamikusan!
      */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6">
          <Link
            href={`/${locale}/clients/${params.id}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-2 group text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {t("backToClient")}
          </Link>

          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 shrink-0">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
              </div>
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-2 text-xs md:text-sm">
              {t("subtitle")}
            </p>
          </div>


          <Card className="bg-white border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-indigo-500" />
                {t("selectExercise")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedExercise}
                onChange={(e) => {
                  const ex = exercises.find((x) => x.id === e.target.value);
                  if (ex) handleExerciseChange(ex.id, ex.name);
                }}
                className="w-full md:w-96 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {logs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t("statWorkouts")}
                  </span>
                  <Activity className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-black text-slate-900">
                    {totalWorkouts}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
                    {t("statWorkoutsDesc")}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t("statSets")}
                  </span>
                  <Layers className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-black text-slate-900">
                    {totalSets}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
                    {t("statSetsDesc")}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t("statMax")}
                  </span>
                  <TrendingUpIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg md:text-2xl font-black text-slate-900 truncate">
                    {getMaxVolume().toLocaleString()}{" "}
                    <span className="text-xs md:text-sm font-normal text-slate-400">
                      kg
                    </span>
                  </p>
                  <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
                    {t("statMaxDesc")}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t("statProgress")}
                  </span>
                  <TrendingUp className="h-4 w-4 text-fuchsia-500" />
                </div>
                <div>
                  <p
                    className={`text-xl md:text-2xl font-black ${Number(getChange()) >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {Number(getChange()) > 0 ? `+${getChange()}` : getChange()}%
                  </p>
                  <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
                    {t("statProgressDesc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none whitespace-nowrap">
              <button
                onClick={() => setActiveTab("volume")}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 text-xs md:text-sm font-medium transition-all border-b-2 shrink-0 ${
                  activeTab === "volume"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUpIcon className="h-4 w-4" /> {t("tabVolume")}
              </button>
              <button
                onClick={() => setActiveTab("weight")}
                className={`flex items-center gap-2 px-4 md:px-5 py-2.5 text-xs md:text-sm font-medium transition-all border-b-2 shrink-0 ${
                  activeTab === "weight"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Weight className="h-4 w-4" /> {t("tabWeight")}
              </button>
            </div>
          </div>

          {activeTab === "volume" && (
            <Card className="bg-white border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-bold text-slate-900">
                  {selectedExerciseDisplay} - {t("chartVolumeTitle")}
                </CardTitle>
                <p className="text-xs text-slate-500">{t("chartVolumeDesc")}</p>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="text-center py-12 md:py-16 text-slate-400">
                    <Dumbbell className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 text-slate-300 animate-pulse" />
                    <p className="text-xs md:text-sm font-medium">
                      {t("noDataChart")}
                    </p>
                    <p className="text-[11px] md:text-xs text-slate-400 mt-1">
                      {t("noDataChartDesc")}
                    </p>
                  </div>
                ) : chartData.length === 1 ? (
                  <div className="text-center py-12 md:py-16 text-slate-400">
                    <Dumbbell className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs md:text-sm font-medium">
                      {t("oneDataPoint")}
                    </p>
                    <p className="text-[11px] md:text-xs text-slate-400 mt-1">
                      {t("oneDataPointDesc")}
                    </p>
                  </div>
                ) : isMounted ? (
                  <div className="w-full h-[300px] md:h-[400px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="chartIndex"
                          tickFormatter={(value) =>
                            chartData[value]?.date || ""
                          }
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          domain={["auto", "auto"]}
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomTooltip activeTab={activeTab} />}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          name={t("lineVolume")}
                          dot={{
                            fill: "white",
                            stroke: "#4f46e5",
                            strokeWidth: 2,
                            r: 4,
                          }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {activeTab === "weight" && (
            <Card className="bg-white border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-bold text-slate-900">
                  {selectedExerciseDisplay} - {t("chartWeightTitle")}
                </CardTitle>
                <p className="text-xs text-slate-500">{t("chartWeightDesc")}</p>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="text-center py-12 md:py-16 text-slate-400">
                    <Dumbbell className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs md:text-sm font-medium">
                      {t("noDataChart")}
                    </p>
                  </div>
                ) : chartData.length === 1 ? (
                  <div className="text-center py-12 md:py-16 text-slate-400">
                    <Dumbbell className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs md:text-sm font-medium">
                      {t("oneDataPoint")}
                    </p>
                    <p className="text-[11px] md:text-xs text-slate-400 mt-1">
                      {t("oneDataPointDesc")}
                    </p>
                  </div>
                ) : isMounted ? (
                  <div className="w-full h-[300px] md:h-[400px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="chartIndex"
                          tickFormatter={(value) =>
                            chartData[value]?.date || ""
                          }
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          domain={["auto", "auto"]}
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<CustomTooltip activeTab={activeTab} />}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="avgWeight"
                          stroke="#10b981"
                          strokeWidth={3}
                          name={t("lineWeight")}
                          dot={{
                            fill: "white",
                            stroke: "#10b981",
                            strokeWidth: 2,
                            r: 4,
                          }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <div className="mt-4 md:mt-8">
            <Card className="bg-white border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-bold text-slate-900">
                  {t("logTitle")}
                </CardTitle>
                <p className="text-xs text-slate-500">{t("logDesc")}</p>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-12 md:py-16 text-slate-400">
                    <Activity className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-xs md:text-sm font-medium">
                      {t("noLogs")}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[500px] text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="py-3.5 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                            {t("tableDate")}
                          </th>
                          <th className="py-3.5 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                            {t("tableSets")}
                          </th>
                          <th className="py-3.5 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                            {t("tableReps")}
                          </th>
                          <th className="py-3.5 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">
                            {t("tableWeight")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {logs.map((log, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {new Date(log.performed_at).toLocaleDateString(
                                `${locale}-HU`,
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                },
                              )}
                            </td>
                            <td className="py-3 px-4 text-indigo-600 font-bold">
                              {log.sets_completed}×
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium tracking-wide">
                              {log.reps_completed}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-cyan-700 font-mono text-xs font-bold">
                                {log.weight_used || "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
