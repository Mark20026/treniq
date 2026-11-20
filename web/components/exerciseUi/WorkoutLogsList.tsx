"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Heart,
  Activity,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  MessageSquare,
} from "lucide-react";

interface WorkoutLog {
  id: string;
  performed_at: string;
  duration: number | null;
  calories_burned: number | null;
  feeling: number | null;
  notes: string | null;
  workout_plan: { name: string } | { name: string }[] | null;
  workout_log_exercises: WorkoutLogExercise[];
}

interface WorkoutLogExercise {
  id: string;
  exercise_name: string;
  sets_completed: number | null;
  reps_completed: string | null;
  weight_used: string | null;
  duration_completed: number | null;
  distance_completed: number | null;
  notes: string | null;
}

interface WorkoutLogsListProps {
  clientId: string;
}

export default function WorkoutLogsList({ clientId }: WorkoutLogsListProps) {
  const t = useTranslations("WorkoutLogs");
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const fetchWorkoutLogs = useCallback(async () => {
    let query = supabase
      .from("workout_logs")
      .select(
        `
        id,
        performed_at,
        duration,
        calories_burned,
        feeling,
        notes,
        workout_plan:workout_plans (name),
        workout_log_exercises (
          id,
          exercise_name,
          sets_completed,
          reps_completed,
          weight_used,
          duration_completed,
          distance_completed,
          notes
        )
      `,
      )
      .eq("client_id", clientId);
    const { data, error } = await query.order("performed_at", { ascending: false });

    if (!error && data) {
      setLogs(data as unknown as WorkoutLog[]);
      if (data.length > 0) {
        const firstKey = new Date(data[0].performed_at).toLocaleDateString(
          "hu-HU",
          {
            year: "numeric",
            month: "long",
          },
        );
        setExpandedMonth(firstKey);
      }
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { void Promise.resolve().then(fetchWorkoutLogs); }, [fetchWorkoutLogs]);

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: WorkoutLog[] } = {};
    logs.forEach((log) => {
      const monthKey = new Date(log.performed_at).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
      });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(log);
    });
    return groups;
  }, [logs]);

  const toggleExpandLog = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const getFeelingEmoji = (feeling: number | null) => {
    if (!feeling) return "😐";
    if (feeling <= 3) return "😫";
    if (feeling <= 6) return "😐";
    if (feeling <= 8) return "😊";
    return "💪";
  };

  const getFeelingColor = (feeling: number | null) => {
    if (!feeling) return "bg-slate-50 text-slate-500 border-slate-100";
    if (feeling <= 3) return "bg-rose-50 text-rose-600 border-rose-100";
    if (feeling <= 6) return "bg-amber-50 text-amber-600 border-amber-100";
    if (feeling <= 8)
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-indigo-50 text-indigo-600 border-indigo-100";
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-3 pt-16 sm:pt-0">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="pt-16 sm:pt-0 p-4 sm:p-0">
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center">
          <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Activity className="h-6 w-6 text-slate-300" />
          </div>
          <h3 className="text-md font-black text-slate-800">
            {t("noWorkoutLogs")}
          </h3>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {t("noWorkoutLogsDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-4 antialiased pt-16 sm:pt-0">
      {Object.entries(groupedLogs).map(([monthName, monthItems]) => {
        const isMonthExpanded = expandedMonth === monthName;

        return (
          <div
            key={monthName}
            className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all"
          >
            <div
              onClick={() =>
                setExpandedMonth(isMonthExpanded ? null : monthName)
              }
              className="px-4 sm:px-6 py-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Dumbbell className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-sm font-black text-slate-800 capitalize tracking-tight truncate">
                  {monthName}
                </span>
                <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md shrink-0">
                  {monthItems.length} {t("workouts")}
                </span>
              </div>
              {isMonthExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </div>

            {isMonthExpanded && (
              <div className="divide-y divide-slate-100/70 bg-white p-3 sm:p-4 space-y-3">
                {monthItems.map((log) => {
                  const isLogExpanded = expandedLog === log.id;

                  return (
                    <div
                      key={log.id}
                      className={`border rounded-xl transition-all overflow-hidden ${
                        isLogExpanded
                          ? "border-slate-200 shadow-sm"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div
                        className="p-3 sm:p-4 cursor-pointer flex items-center justify-between gap-2 sm:gap-4 select-none bg-white"
                        onClick={() => toggleExpandLog(log.id)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap min-w-0">

                          <div
                            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider shrink-0 ${getFeelingColor(log.feeling)}`}
                          >
                            {getFeelingEmoji(log.feeling)}{" "}
                            {log.feeling ? `${log.feeling}/10` : "N/A"}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="capitalize">
                              {format(
                                new Date(log.performed_at),
                                "eee • LLLL dd.",
                                { locale: hu },
                              )}
                            </span>
                          </div>

                          {log.duration && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                              <Clock className="h-3.5 w-3.5" />
                              {log.duration} {t("minutes")}
                            </div>
                          )}

                          {log.calories_burned && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                              <Heart className="h-3.5 w-3.5" />
                              {log.calories_burned} kcal
                            </div>
                          )}

                          {log.workout_plan && (
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md truncate max-w-[140px] sm:max-w-xs">
                              {Array.isArray(log.workout_plan) ? log.workout_plan[0]?.name : log.workout_plan.name}
                            </span>
                          )}
                        </div>

                        <div className="text-slate-400 shrink-0">
                          {isLogExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {isLogExpanded && (
                        <div className="border-t border-slate-50 p-3 sm:p-4 bg-slate-50/30 space-y-4">
                          {log.workout_log_exercises.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Dumbbell className="h-3.5 w-3.5" />{" "}
                                {t("completedExercises")}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {log.workout_log_exercises.map((exercise) => (
                                  <div
                                    key={exercise.id}
                                    className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs"
                                  >
                                    <p className="text-xs font-bold text-slate-800">
                                      {exercise.exercise_name}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] font-medium text-slate-500">
                                      {exercise.sets_completed && (
                                        <span>
                                          <strong className="text-slate-700 font-bold">
                                            {exercise.sets_completed}
                                          </strong>{" "}
                                          {t("sets")}
                                        </span>
                                      )}
                                      {exercise.reps_completed && (
                                        <span>
                                          <strong className="text-slate-700 font-bold">
                                            {exercise.reps_completed}
                                          </strong>{" "}
                                          {t("reps")}
                                        </span>
                                      )}
                                      {exercise.weight_used && (
                                        <span>
                                          <strong className="text-indigo-600 font-bold">
                                            {exercise.weight_used}
                                          </strong>{" "}
                                          kg
                                        </span>
                                      )}
                                      {exercise.duration_completed && (
                                        <span>
                                          <strong className="text-slate-700 font-bold">
                                            {exercise.duration_completed}
                                          </strong>{" "}
                                          {t("minutes")}
                                        </span>
                                      )}
                                      {exercise.distance_completed && (
                                        <span>
                                          <strong className="text-slate-700 font-bold">
                                            {exercise.distance_completed}
                                          </strong>{" "}
                                          km
                                        </span>
                                      )}
                                    </div>
                                    {exercise.notes && (
                                      <p className="text-[11px] text-slate-400 mt-1.5 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                                        {exercise.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.notes && (
                            <div className="space-y-1.5">
                              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />{" "}
                                {t("clientNote")}
                              </h4>
                              <p className="text-xs font-medium text-slate-600 bg-white rounded-xl p-3 border border-slate-100 leading-relaxed">
                                {log.notes}
                              </p>
                            </div>
                          )}

                          {log.workout_log_exercises.length === 0 &&
                            !log.notes && (
                              <p className="text-xs text-slate-400 italic">
                                {t("noDetails")}
                              </p>
                            )}
                        </div>
                      )}
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
