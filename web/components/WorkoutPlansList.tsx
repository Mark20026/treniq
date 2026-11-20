"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Dumbbell,
  Plus,
  ChevronRight,
  Clock,
  LayoutGrid,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  weekly_frequency: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

interface WorkoutPlansListProps {
  clientId: string;
  onAddClick: () => void;
  onRefresh?: () => void;
}

export default function WorkoutPlansList({
  clientId,
  onAddClick,
  onRefresh,
}: WorkoutPlansListProps) {
  const t = useTranslations("WorkoutPlansList");
  const router = useRouter();
  const pathname = usePathname();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale = pathname?.split("/")[1] || "hu";

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;
      setPlans(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(`${locale}-HU`, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "---";
    }
  };

  const difficultyLabels: Record<string, { label: string; color: string }> = {
    beginner: {
      label: t("difficultyBeginner"),
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    intermediate: {
      label: t("difficultyIntermediate"),
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    advanced: {
      label: t("difficultyAdvanced"),
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: {
      label: t("statusActive"),
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    completed: {
      label: t("statusCompleted"),
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    archived: {
      label: t("statusArchived"),
      color: "bg-slate-50 text-slate-500 border-slate-100",
    },
  };

  if (loading)
    return (
      <div className="pt-20 sm:pt-4 p-8 flex flex-col items-center justify-center text-slate-400 gap-3 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs font-bold uppercase tracking-widest">
          {t("loading")}
        </p>
      </div>
    );

  if (error)
    return (
      <div className="pt-20 sm:pt-4 p-4 sm:p-8 w-full max-w-7xl mx-auto">
        <div className="p-6 sm:p-8 bg-rose-50 rounded-[2rem] border border-rose-100 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
          <p className="text-rose-600 font-bold text-sm">{error}</p>
          <button
            onClick={fetchPlans}
            className="mt-4 text-xs font-black uppercase text-rose-700 underline"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );

  if (plans.length === 0) {
    return (
      <div className="pt-20 sm:pt-4 p-4 sm:p-8 w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 p-6 sm:p-12 text-center transition-all hover:border-indigo-100">
          <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 sm:mb-6 transition-transform">
            <LayoutGrid className="h-8 w-8 sm:h-10 sm:w-10 text-slate-200" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-2">
            {t("noPlans")}
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-[280px] mx-auto mb-6 sm:mb-8 font-medium leading-relaxed">
            {t("noPlansDescription")}
          </p>
          <button
            onClick={onAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2.5 mx-auto"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
            {t("createFirstPlan")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 sm:pt-4 p-4 sm:p-8 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto">
      {/* Fejléc rész */}
      <div className="flex justify-between items-center px-1">
        <div className="min-w-0">
          <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight leading-none truncate">
            {t("workoutPlans")}
          </h3>
          <p className="text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5 sm:mt-2">
            {plans.length} {t("activePrograms")}
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="group bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white p-2.5 sm:p-3 rounded-xl transition-all active:scale-90 shrink-0"
          title={t("addNew")}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
        </button>
      </div>

      {/* Tervek listája */}
      <div className="grid gap-3 sm:gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() =>
              router.push(`/${locale}/clients/${clientId}/plans/${plan.id}`)
            }
            className="group relative bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 p-4 sm:p-7 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all cursor-pointer overflow-hidden"
          >
            {/* Dekoratív ikon háttér - közepes kijelzőktől látható */}
            <Dumbbell className="hidden md:block absolute -right-6 -bottom-6 h-32 w-32 text-slate-50 opacity-0 group-hover:opacity-100 group-hover:-rotate-12 transition-all duration-500 pointer-events-none" />

            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-3 sm:space-y-5 flex-1 min-w-0">
                {/* Címkék */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span
                    className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border shrink-0 ${difficultyLabels[plan.difficulty]?.color || "bg-slate-50 text-slate-500"}`}
                  >
                    {difficultyLabels[plan.difficulty]?.label ||
                      plan.difficulty}
                  </span>
                  <span
                    className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border shrink-0 ${statusLabels[plan.status]?.color || "bg-slate-50 text-slate-500"}`}
                  >
                    {statusLabels[plan.status]?.label || plan.status}
                  </span>
                </div>

                {/* Cím és Leírás */}
                <div className="min-w-0">
                  <h4 className="text-base sm:text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-1 truncate">
                    {plan.name}
                  </h4>
                  {plan.description && (
                    <p className="text-xs sm:text-sm text-slate-400 font-medium line-clamp-1 italic pr-4 sm:pr-10">
                      &ldquo;{plan.description}&rdquo;
                    </p>
                  )}
                </div>

                {/* Időpont és Gyakoriság sáv */}
                <div className="flex flex-col xs:flex-row xs:items-center gap-x-6 gap-y-2 pt-3 sm:pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-tighter truncate">
                      {formatDate(plan.start_date)}
                      {plan.end_date && ` — ${formatDate(plan.end_date)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors shrink-0">
                      <Clock className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-tighter truncate">
                      {plan.weekly_frequency} {t("timesPerWeek")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Jobb oldali nyíl / Akció gomb */}
              <div className="shrink-0 self-center">
                <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-slate-50 group-hover:bg-indigo-600 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 shadow-sm">
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-300 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
