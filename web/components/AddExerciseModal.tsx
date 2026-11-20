"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Clock,
  Weight,
  Repeat,
  CalendarDays,
  Timer,
  Ruler,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

interface MasterExercise {
  id: number;
  name: string;
  description: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
}

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutPlanId: string;
  workoutPlanName: string;
  onExerciseAdded: () => void;
}

export default function AddExerciseModal({
  isOpen,
  onClose,
  workoutPlanId,
  workoutPlanName,
  onExerciseAdded,
}: AddExerciseModalProps) {
  const t = useTranslations("AddExercise");
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("all");
  const [masterExercises, setMasterExercises] = useState<MasterExercise[]>([]);
  const [selectedExercise, setSelectedExercise] =
    useState<MasterExercise | null>(null);
  const [isCardio, setIsCardio] = useState(false);
  const [formData, setFormData] = useState({
    sets: "3",
    min_reps: "8",
    max_reps: "12",
    weight: "",
    duration: "",
    distance: "",
    rest_time: "60",
    notes: "",
    day_of_week: "1",
  });

  const locale = pathname?.split("/")[1] || "hu";

  const muscleGroups = [
    { id: "all", label: t("muscleGroup_all"), icon: "🎯" },
    { id: "chest", label: t("muscleGroup_chest"), icon: "💪" },
    { id: "back", label: t("muscleGroup_back"), icon: "🏋️" },
    { id: "legs", label: t("muscleGroup_legs"), icon: "🦵" },
    { id: "shoulders", label: t("muscleGroup_shoulders"), icon: "🎯" },
    { id: "arms", label: t("muscleGroup_arms"), icon: "💪" },
    { id: "core", label: t("muscleGroup_core"), icon: "🧘" },
    { id: "cardio", label: t("muscleGroup_cardio"), icon: "🏃" },
    { id: "other", label: t("muscleGroup_other"), icon: "📦" },
  ];

  const weekDays = [
    { value: "1", label: t("dayMonday") },
    { value: "2", label: t("dayTuesday") },
    { value: "3", label: t("dayWednesday") },
    { value: "4", label: t("dayThursday") },
    { value: "5", label: t("dayFriday") },
    { value: "6", label: t("daySaturday") },
    { value: "7", label: t("daySunday") },
  ];

  const fetchMasterExercises = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("master_exercises")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Nem sikerült betölteni a gyakorlatokat");
        return;
      }

      if (!data || data.length === 0) {
        setMasterExercises([]);
        return;
      }

      const firstItem = data[0];
      const nameField = `name_${locale}`;
      const descriptionField = `description_${locale}`;

      if (
        firstItem[nameField] !== undefined &&
        firstItem[nameField] !== null &&
        firstItem[nameField] !== ""
      ) {
        const translatedData = data.map((item) => ({
          id: item.id,
          name: item[nameField] || item.name,
          description: item[descriptionField] || item.description || "",
          muscle_group: item.muscle_group,
          equipment: item.equipment,
          difficulty: item.difficulty,
        }));
        setMasterExercises(translatedData);
      } else {
        setMasterExercises(data);
      }
    } catch {
      setMasterExercises([]);
      toast.error("Nem sikerült betölteni a gyakorlatokat");
    }
  }, [locale]);

  useEffect(() => {
    if (isOpen) void Promise.resolve().then(fetchMasterExercises);
  }, [isOpen, fetchMasterExercises]);

  const filteredExercises = useMemo(() => {
    let filtered = [...masterExercises];
    if (selectedMuscleGroup !== "all") {
      filtered = filtered.filter(
        (ex) => ex.muscle_group === selectedMuscleGroup,
      );
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (ex) =>
          ex.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return filtered;
  }, [masterExercises, searchTerm, selectedMuscleGroup]);

  const selectExercise = (exercise: MasterExercise) => {
    setSelectedExercise(exercise);
    setIsCardio(exercise.muscle_group === "cardio");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise) return;


    setLoading(true);

    const day = Number(formData.day_of_week);
    const { data: existing, error: orderError } = await supabase.from("exercises")
      .select("order_index").eq("workout_plan_id", workoutPlanId).eq("day_of_week", day);
    if (orderError) { toast.error("Could not determine exercise order."); setLoading(false); return; }
    const order = Math.max(0, ...(existing ?? []).map(row => Number(row.order_index) || 0)) + 1;
    if (order > 32767) { toast.error("This day has too many exercises."); setLoading(false); return; }

    const exerciseData: Record<string, string | number | null> = {
      workout_plan_id: workoutPlanId,
      name: selectedExercise?.name,
      category: selectedExercise?.muscle_group || "other",
      notes: formData.notes || null,
      day_of_week: day,
      order_index: order,
    };



    if (isCardio) {
      exerciseData.duration = formData.duration
        ? parseInt(formData.duration)
        : null;
      exerciseData.distance = formData.distance
        ? parseFloat(formData.distance)
        : null;
    } else {
      exerciseData.sets = parseInt(formData.sets);
      exerciseData.min_reps = parseInt(formData.min_reps);
      exerciseData.max_reps = parseInt(formData.max_reps);
      exerciseData.weight = formData.weight
        ? parseFloat(formData.weight)
        : null;
      exerciseData.rest_time = parseInt(formData.rest_time);
    }



    const { error } = await supabase.from("exercises").insert([exerciseData]);

    if (error) {
      toast.error(error.message.includes("reviewed prescription order") ? "Exercise order changed. Refresh and try again." : "Could not save this exercise. Review its fields and try again.");
    } else {
      toast.success(t("saveSuccess"));
      resetForm();
      onClose();
      onExerciseAdded();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedExercise(null);
    setFormData({
      sets: "3",
      min_reps: "8",
      max_reps: "12",
      weight: "",
      duration: "",
      distance: "",
      rest_time: "60",
      notes: "",
      day_of_week: "1",
    });
  };

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "1rem",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full h-full sm:h-auto max-w-full sm:max-w-[500px] max-h-screen sm:max-h-[90vh] overflow-hidden flex flex-col p-0 pt-16 sm:pt-0 border-none shadow-2xl sm:rounded-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800">
            {selectedExercise && (
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors mr-1"
                type="button"
              >
                <ArrowLeft className="h-5 w-5 text-slate-500" />
              </button>
            )}
            {selectedExercise ? t("settings") : t("addExercise")}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-indigo-600 font-medium truncate">
            {workoutPlanName}
          </p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-4 sm:space-y-6"
        >
          {!selectedExercise ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-slate-200 rounded-xl w-full"
                  />
                </div>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedMuscleGroup}
                    onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                    className="h-11 w-full sm:w-auto pl-3 pr-8 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                    style={selectStyle}
                  >
                    {muscleGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.icon} {group.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden bg-slate-50/30">
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => selectExercise(exercise)}
                      className="w-full text-left p-3.5 sm:p-4 hover:bg-white hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-sm sm:text-base text-slate-700 group-hover:text-indigo-600 transition-colors truncate">
                          {exercise.name}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1 items-center">
                          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-bold uppercase truncate">
                            {
                              muscleGroups.find(
                                (g) => g.id === exercise.muscle_group,
                              )?.label
                            }
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                            {exercise.equipment}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-400 italic text-sm">
                    {t("noResults")}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-4 sm:p-5 rounded-2xl">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  {selectedExercise.name}
                </h3>
                <p className="text-xs sm:text-sm text-indigo-700/70 mt-1 line-clamp-3">
                  {selectedExercise.description || t("noDescription")}
                </p>
              </div>


              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <CalendarDays className="h-4 w-4 text-indigo-500" />{" "}
                    {t("selectDay")}
                  </Label>
                  <select
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                    style={selectStyle}
                  >
                    {weekDays.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isCardio ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase flex items-center gap-1 truncate">
                          <Repeat className="h-3 w-3 shrink-0" /> {t("sets")}
                        </Label>
                        <Input
                          name="sets"
                          type="number"
                          value={formData.sets}
                          onChange={handleChange}
                          className="h-11 rounded-xl text-center text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">
                          {t("minReps")}
                        </Label>
                        <Input
                          name="min_reps"
                          type="number"
                          value={formData.min_reps}
                          onChange={handleChange}
                          className="h-11 rounded-xl text-center text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">
                          {t("maxReps")}
                        </Label>
                        <Input
                          name="max_reps"
                          type="number"
                          value={formData.max_reps}
                          onChange={handleChange}
                          className="h-11 rounded-xl text-center text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 truncate">
                          <Weight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />{" "}
                          {t("weight")}
                        </Label>
                        <Input
                          name="weight"
                          type="number"
                          step="0.001"
                          placeholder="60"
                          value={formData.weight}
                          onChange={handleChange}
                          className="h-11 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 truncate">
                          <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />{" "}
                          {t("restTime")}
                        </Label>
                        <Input
                          name="rest_time"
                          type="number"
                          value={formData.rest_time}
                          onChange={handleChange}
                          className="h-11 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 truncate">
                        <Timer className="h-3.5 w-3.5 text-indigo-500 shrink-0" />{" "}
                          {t("duration")}
                      </Label>
                      <Input
                        name="duration"
                        type="number"
                        placeholder="30"
                        value={formData.duration}
                        onChange={handleChange}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 truncate">
                        <Ruler className="h-3.5 w-3.5 text-indigo-500 shrink-0" />{" "}
                          {t("distance")}
                      </Label>
                      <Input
                        name="distance"
                        type="number"
                        step="0.1"
                        placeholder="5.2"
                        value={formData.distance}
                        onChange={handleChange}
                        className="h-11 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-semibold text-slate-700">
                    {t("notes")}
                  </Label>
                  <Textarea
                    name="notes"
                    placeholder={t("notesPlaceholder")}
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="rounded-xl resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 shrink-0 mt-auto">
          <div className="flex w-full gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl flex-1 sm:flex-initial h-11 text-sm font-medium"
            >
              {t("cancel")}
            </Button>
            {selectedExercise && (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 rounded-xl flex-1 sm:flex-initial h-11 text-sm font-semibold shadow-md active:scale-95 transition-transform"
              >
                {loading ? t("saving") : t("addButton")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
