"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Edit,
  Dumbbell,
  Repeat,
  Weight,
  Clock,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  category: string;
  sets: number;
  min_reps: number;
  max_reps: number;
  weight: number | null;
  rest_time: number;
  notes: string | null;
  day_of_week: number;
}

interface ExercisesListProps {
  workoutPlanId: string;
  onAddClick: () => void;
  onRefresh?: () => void;
}

export default function ExercisesList({
  workoutPlanId,
  onAddClick,
  onRefresh,
}: ExercisesListProps) {
  const t = useTranslations("ExercisesList");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedExercises, setGroupedExercises] = useState<
    Record<number, Exercise[]>
  >({});

  useEffect(() => {
    fetchExercises();
  }, [workoutPlanId]);

  useEffect(() => {
    const grouped = exercises.reduce(
      (acc, exercise) => {
        const day = exercise.day_of_week;
        if (!acc[day]) acc[day] = [];
        acc[day].push(exercise);
        return acc;
      },
      {} as Record<number, Exercise[]>,
    );
    setGroupedExercises(grouped);
  }, [exercises]);

  async function fetchExercises() {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_plan_id", workoutPlanId)
      .order("day_of_week", { ascending: true })
      .order("order_index", { ascending: true });

    if (!error && data) {
      setExercises(data);
    }
    setLoading(false);
  }

  const handleDelete = async (exerciseId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", exerciseId);

    if (error) {
      toast.error(t("deleteError") + error.message);
    } else {
      toast.success(t("deleteSuccess"));
      fetchExercises();
      if (onRefresh) onRefresh();
    }
  };

  const weekDays: Record<number, string> = {
    1: t("dayMonday"),
    2: t("dayTuesday"),
    3: t("dayWednesday"),
    4: t("dayThursday"),
    5: t("dayFriday"),
    6: t("daySaturday"),
    7: t("daySunday"),
  };

  const categoryLabels: Record<string, string> = {
    chest: t("categoryChest"),
    back: t("categoryBack"),
    legs: t("categoryLegs"),
    shoulders: t("categoryShoulders"),
    arms: t("categoryArms"),
    cardio: t("categoryCardio"),
    core: t("categoryCore"),
    full_body: t("categoryFullBody"),
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm font-medium animate-pulse">
        {t("loading")}
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl">
        <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Dumbbell className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm font-medium">{t("noExercises")}</p>
        <Button
          onClick={onAddClick}
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 rounded-xl text-xs font-bold px-4 h-9 border-slate-200 hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addFirst")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Szekció fejléc gombbal */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-3 gap-4">
        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">
          {t("exercises")}
        </h4>
        <Button
          onClick={onAddClick}
          size="sm"
          className="gap-1 rounded-xl text-xs font-bold h-9 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addExercise")}
        </Button>
      </div>

      {/* Napok szerinti bontás */}
      {Object.entries(groupedExercises).map(([day, dayExercises]) => (
        <div key={day} className="space-y-3">
          <h5 className="text-[10px] md:text-xs font-black text-indigo-600 bg-indigo-50/70 uppercase tracking-widest inline-block px-3 py-1 rounded-lg">
            {weekDays[parseInt(day)]}
          </h5>

          <div className="space-y-2.5">
            {dayExercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="hover:shadow-md border-slate-100 transition-all rounded-xl md:rounded-2xl overflow-hidden bg-white"
              >
                <CardContent className="p-3.5 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Gyakorlat neve és kategória */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <span className="font-bold text-sm sm:text-base text-slate-800 tracking-tight block truncate max-w-[180px] sm:max-w-none">
                          {exercise.name}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
                          {categoryLabels[exercise.category] ||
                            exercise.category}
                        </span>
                      </div>

                      {/* Paraméterek rácsa - Mobilon 2 oszlop, nagyobb kijelzőn rugalmas sor */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 sm:gap-5 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5 bg-slate-50 sm:bg-transparent px-2 py-1 sm:p-0 rounded-lg">
                          <Repeat className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {exercise.sets} × {exercise.min_reps}-
                            {exercise.max_reps}
                          </span>
                        </div>

                        {exercise.weight && (
                          <div className="flex items-center gap-1.5 bg-slate-50 sm:bg-transparent px-2 py-1 sm:p-0 rounded-lg">
                            <Weight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>
                              {exercise.weight} {t("kg")}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 bg-slate-50 sm:bg-transparent px-2 py-1 sm:p-0 rounded-lg col-span-2 sm:col-span-1">
                          <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {exercise.rest_time} {t("seconds")}
                          </span>
                        </div>
                      </div>

                      {/* Megjegyzések szekció */}
                      {exercise.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-400 mt-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <p className="italic leading-relaxed break-words min-w-0">
                            {exercise.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Törlés gomb */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-9 w-9 p-0 shrink-0 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
