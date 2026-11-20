"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Utensils,
  Plus,
  Eye,
  Trash2,
  Save,
  Copy,
  Flame,
  Dumbbell,
  Loader2,
  ChevronRight,
  ShoppingCart,
  ListChecks,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import StructuredMealPlanView from "./StructuredMealPlanView";
import StructuredMealPlanEditor from "./StructuredMealPlanEditor";
import ShoppingListModal from "./ShoppingListModal";

interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  content: string;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  shopping_list: string | null;
  options: string | null;
}

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  notes: string;
}

interface MealPlansListProps {
  clientId: string;
  onAddClick: () => void;
  onRefresh?: () => void;
}

export default function MealPlansList({
  clientId,
  onAddClick,
  onRefresh,
}: MealPlansListProps) {
  const t = useTranslations("MealPlansList");
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isTemplateViewOpen, setIsTemplateViewOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<Template | null>(null);
  const isMounted = useRef(true);

  const loadData = async () => {
    if (!clientId) {
      console.warn("MealPlansList: clientId is undefined, skipping load");
      setLoading(false);
      return;
    }

    if (!isMounted.current) return;

    try {
      const { data: plansData } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (plansData && isMounted.current) {
        setPlans(plansData);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && isMounted.current) {
        const { data: templatesData } = await supabase
          .from("meal_plan_templates")
          .select("*")
          .eq("coach_id", user.id)
          .order("created_at", { ascending: false });

        if (templatesData) {
          setTemplates(templatesData);
        }
      }
    } catch (error) {
      console.error("Error loading meal plans:", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    loadData();

    return () => {
      isMounted.current = false;
    };
  }, [clientId]);

  const handleSaveAsTemplate = async (plan: MealPlan) => {
    setSavingTemplate(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("notLoggedIn"));
        setSavingTemplate(false);
        return;
      }

      const { data: planData, error: planError } = await supabase
        .from("meal_plans")
        .select("shopping_list, options, notes")
        .eq("id", plan.id)
        .single();

      if (planError) {
        console.error("Hiba a terv adatainak betöltésekor:", planError);
      }

      const { data: entries, error: entriesError } = await supabase
        .from("daily_meal_entries")
        .select("*")
        .eq("meal_plan_id", plan.id)
        .order("day_of_week", { ascending: true })
        .order("order_index", { ascending: true });

      if (entriesError) {
        console.error("Hiba az ételek betöltésekor:", entriesError);
        toast.error(t("entriesLoadError"));
        setSavingTemplate(false);
        return;
      }

      if (!entries || entries.length === 0) {
        toast.error(t("noEntriesError"));
        setSavingTemplate(false);
        return;
      }

      const mealLabels: Record<string, string> = {
        breakfast: t("mealBreakfast"),
        morning_snack: t("mealMorningSnack"),
        lunch: t("mealLunch"),
        afternoon_snack: t("mealAfternoonSnack"),
        dinner: t("mealDinner"),
        evening_snack: t("mealEveningSnack"),
      };

      const weekDayNames: Record<number, string> = {
        1: t("dayMonday"),
        2: t("dayTuesday"),
        3: t("dayWednesday"),
        4: t("dayThursday"),
        5: t("dayFriday"),
        6: t("daySaturday"),
        7: t("daySunday"),
      };

      let content = `# ${plan.name}\n\n`;

      const groupedByDay: Record<number, any[]> = {};
      entries.forEach((entry) => {
        if (!groupedByDay[entry.day_of_week]) {
          groupedByDay[entry.day_of_week] = [];
        }
        groupedByDay[entry.day_of_week].push(entry);
      });

      const sortedDays = Object.keys(groupedByDay).sort(
        (a, b) => Number(a) - Number(b),
      );

      sortedDays.forEach((dayKey) => {
        const dayNum = Number(dayKey);
        content += `## ${weekDayNames[dayNum] || dayKey}\n\n`;

        const dayEntries = groupedByDay[dayNum];

        const groupedByMeal: Record<string, any[]> = {};
        dayEntries.forEach((entry) => {
          if (!groupedByMeal[entry.meal_type]) {
            groupedByMeal[entry.meal_type] = [];
          }
          groupedByMeal[entry.meal_type].push(entry);
        });

        Object.entries(mealLabels).forEach(([mealType, mealLabel]) => {
          const meals = groupedByMeal[mealType] || [];
          if (meals.length > 0) {
            content += `### ${mealLabel}\n`;
            meals.forEach((item) => {
              content += `- ${item.food_name}`;
              if (item.quantity)
                content += ` (${item.quantity} ${item.unit || "g"})`;
              if (item.calories) content += ` - ${item.calories} kcal`;
              if (item.protein) content += `, ${item.protein}g P`;
              if (item.carbs) content += `, ${item.carbs}g Sz`;
              if (item.fat) content += `, ${item.fat}g Zs`;
              if (item.notes) {
                const notes = item.notes;
                if (notes.includes("Opciók:") || notes.includes("🔹")) {
                  const optMatch = notes.match(
                    /(?:Opciók:|🔹 Opciók:)\s*(.+?)(?=\n|$)/,
                  );
                  if (optMatch)
                    content += `\n  - ${t("optionsLabel")}: ${optMatch[1].trim()}`;
                }
                if (notes.includes("Megjegyzés:") || notes.includes("📝")) {
                  const noteMatch = notes.match(
                    /(?:Megjegyzés:|📝 Megjegyzés:)\s*(.+?)(?=\n|$)/,
                  );
                  if (noteMatch)
                    content += `\n  - ${t("notesLabel")}: ${noteMatch[1].trim()}`;
                }
              }
              content += `\n`;
            });
            content += `\n`;
          }
        });
        content += `---\n\n`;
      });

      if (planData?.shopping_list) {
        content += `## 🛒 ${t("shoppingListTitle")}\n\n`;
        const items = planData.shopping_list
          .split("\n")
          .filter((item: string) => item.trim());
        items.forEach((item: string) => {
          content += `- ${item.trim()}\n`;
        });
        content += `\n---\n\n`;
      }

      if (planData?.options) {
        content += `## ✏️ ${t("optionsTitle")}\n\n`;
        content += `${planData.options}\n\n`;
        content += `---\n\n`;
      }

      if (planData?.notes) {
        content += `## 📝 ${t("notesTitle")}\n\n`;
        content += `${planData.notes}\n\n`;
      }

      const { error } = await supabase.from("meal_plan_templates").insert([
        {
          coach_id: user.id,
          name: `${plan.name} (${t("templateSuffix")})`,
          description:
            plan.description || `${t("templatePrefix")}: ${plan.name}`,
          content: content,
          daily_calories: plan.daily_calories,
          daily_protein: plan.daily_protein,
          daily_carbs: plan.daily_carbs,
          daily_fat: plan.daily_fat,
          notes: t("templateNotes"),
          is_public: false,
        },
      ]);

      if (error) {
        console.error("❌ Sablon mentési hiba:", error);
        toast.error(t("templateSaveError") + error.message);
      } else {
        toast.success(t("templateSaveSuccess", { name: plan.name }));
        const { data: templatesData } = await supabase
          .from("meal_plan_templates")
          .select("*")
          .eq("coach_id", user.id)
          .order("created_at", { ascending: false });

        if (templatesData) {
          setTemplates(templatesData);
        }
        if (onRefresh) onRefresh();
      }
    } catch (error: any) {
      console.error("❌ Sablon mentési hiba:", error);
      toast.error(t("templateSaveError") + error.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const openShoppingList = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setIsShoppingListOpen(true);
  };

  const closeShoppingList = () => {
    setIsShoppingListOpen(false);
    setTimeout(() => setSelectedPlan(null), 200);
  };

  const handleView = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setIsViewOpen(true);
  };

  const closeView = () => {
    setIsViewOpen(false);
    setSelectedPlan(null);
  };

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsTemplateViewOpen(true);
  };

  const closeTemplateView = () => {
    setIsTemplateViewOpen(false);
    setSelectedTemplate(null);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", planId);

    if (error) {
      toast.error(t("deleteError") + error.message);
    } else {
      toast.success(t("deleteSuccess"));
      loadData();
      if (onRefresh) onRefresh();
    }
  };

  const handleDeleteTemplate = async (
    templateId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!confirm(t("deleteTemplateConfirm"))) return;

    const { error } = await supabase
      .from("meal_plan_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      toast.error(t("deleteTemplateError") + error.message);
    } else {
      toast.success(t("deleteTemplateSuccess"));
      loadData();
    }
  };

  const loadTemplateToEditor = (template: Template) => {
    setTemplateToEdit(template);
    setIsEditorOpen(true);
  };

  const openNewPlanEditor = () => {
    setTemplateToEdit(null);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setTemplateToEdit(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    /* pt-20 hozzáadva mobil nézethez a felső rögzített navbar miatt, sm képernyőn kikapcsol */
    <div className="space-y-6 pt-20 sm:pt-0">
      <div className="space-y-4">
        <div className="flex flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Utensils className="h-5 w-5 text-indigo-500 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight truncate">
              {t("mealPlanTitle")}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={openNewPlanEditor}
            className="text-indigo-600 font-semibold gap-1 hover:bg-indigo-50 text-xs sm:text-sm shrink-0"
          >
            <Plus className="h-4 w-4" /> {t("newPlan")}
          </Button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
            <Utensils className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-xs sm:text-sm">{t("noPlans")}</p>
            <Button
              onClick={openNewPlanEditor}
              variant="outline"
              className="mt-3 text-xs sm:text-sm"
            >
              <Plus className="h-4 w-4 mr-1" /> {t("newMealPlan")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white rounded-2xl"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3">
                    {/* Elrendezés mobilbaráttá tétele: kis kijelzőn egymás alá törhet, ha túl sok a gomb */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">
                          {plan.name}
                        </h4>
                        <span
                          className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                            plan.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {plan.status === "active"
                            ? t("active")
                            : t("archived")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-slate-50/80 sm:bg-transparent p-1 sm:p-0 rounded-xl">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openShoppingList(plan)}
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 shrink-0"
                          title={t("shoppingListTitle")}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveAsTemplate(plan)}
                          disabled={savingTemplate}
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                          title={t("saveTemplate")}
                        >
                          {savingTemplate ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(plan)}
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                          title={t("view")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                          title={t("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-medium text-slate-400">
                      {plan.daily_calories !== null &&
                        plan.daily_calories > 0 && (
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg sm:bg-transparent sm:p-0">
                            <Flame className="h-3 w-3 text-orange-400 shrink-0" />
                            {plan.daily_calories} {t("kcal")}
                          </span>
                        )}
                      {plan.daily_protein !== null &&
                        plan.daily_protein > 0 && (
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg sm:bg-transparent sm:p-0">
                            <Dumbbell className="h-3 w-3 text-indigo-400 shrink-0" />
                            {plan.daily_protein}g {t("proteinShort")}
                          </span>
                        )}
                      {plan.daily_carbs !== null && plan.daily_carbs > 0 && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg sm:bg-transparent sm:p-0">
                          🍚 {plan.daily_carbs}g {t("carbsShort")}
                        </span>
                      )}
                      {plan.daily_fat !== null && plan.daily_fat > 0 && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg sm:bg-transparent sm:p-0">
                          🥑 {plan.daily_fat}g {t("fatShort")}
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg sm:bg-transparent sm:p-0 ml-auto sm:ml-0">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {new Date(plan.created_at).toLocaleDateString("hu-HU")}
                      </span>
                    </div>

                    {plan.shopping_list && (
                      <div className="flex items-start gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <ListChecks className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-700 line-clamp-1 flex-1 font-medium">
                          {plan.shopping_list}
                        </p>
                      </div>
                    )}

                    {plan.options && (
                      <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                        <Pencil className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700 line-clamp-1 flex-1 font-medium">
                          {plan.options}
                        </p>
                      </div>
                    )}

                    {plan.notes && (
                      <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                        <Pencil className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700 line-clamp-1 flex-1 font-medium">
                          {plan.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {templates.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors w-full py-1"
          >
            <ChevronRight
              className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${showTemplates ? "rotate-90" : ""}`}
            />
            <Copy className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {t("myTemplates", { count: templates.length })}
            </span>
          </button>

          {showTemplates && (
            <div className="mt-3 space-y-2 animate-in fade-in duration-200">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-colors gap-3"
                >
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => handleViewTemplate(template)}
                  >
                    <p className="font-bold text-slate-700 text-sm truncate">
                      {template.name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1 text-[11px] font-medium text-slate-400">
                      {template.daily_calories && (
                        <span className="flex items-center gap-0.5">
                          🔥 {template.daily_calories} {t("kcal")}
                        </span>
                      )}
                      {template.daily_protein && (
                        <span className="flex items-center gap-0.5">
                          💪 {template.daily_protein}g {t("proteinShort")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadTemplateToEditor(template)}
                      className="h-8 px-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      {t("load")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteTemplate(template.id, e)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ShoppingListModal
        isOpen={isShoppingListOpen}
        onClose={closeShoppingList}
        plan={selectedPlan}
        onSave={() => {
          loadData();
          if (onRefresh) onRefresh();
        }}
      />

      {selectedPlan && (
        <StructuredMealPlanView
          planId={selectedPlan.id}
          onClose={closeView}
          isOpen={isViewOpen}
          isTemplate={false}
        />
      )}

      {selectedTemplate && (
        <StructuredMealPlanView
          planId={selectedTemplate.id}
          onClose={closeTemplateView}
          isOpen={isTemplateViewOpen}
          isTemplate={true}
        />
      )}

      <StructuredMealPlanEditor
        clientId={clientId}
        clientName=""
        onSave={() => {
          loadData();
          if (onRefresh) onRefresh();
        }}
        onClose={closeEditor}
        isOpen={isEditorOpen}
        templateToLoad={templateToEdit}
      />
    </div>
  );
}
