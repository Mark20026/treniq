"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  Utensils,
  Loader2,
  Copy,
  FileText,
  Trash2,
  Flame,
  Dumbbell,
  ArrowLeft,
} from "lucide-react";

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

interface AddMealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onPlanAdded: () => void;
}

export default function AddMealPlanModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  onPlanAdded,
}: AddMealPlanModalProps) {
  const t = useTranslations("AddMealPlan");
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    daily_calories: "",
    daily_protein: "",
    daily_carbs: "",
    daily_fat: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen && showTemplateSelector) {
      fetchTemplates();
    }
  }, [isOpen, showTemplateSelector]);

  async function fetchTemplates() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("meal_plan_templates")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loadTemplate = (template: Template) => {
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.content,
      daily_calories: template.daily_calories?.toString() || "",
      daily_protein: template.daily_protein?.toString() || "",
      daily_carbs: template.daily_carbs?.toString() || "",
      daily_fat: template.daily_fat?.toString() || "",
      notes: template.notes || "",
    });
    setShowTemplateSelector(false);
    toast.success(t("templateLoaded"));
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
      fetchTemplates();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("notLoggedIn"));
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("meal_plans").insert([
      {
        coach_id: user.id,
        client_id: clientId,
        name: formData.name,
        description: formData.description || null,
        content: formData.content,
        daily_calories: formData.daily_calories
          ? parseInt(formData.daily_calories)
          : null,
        daily_protein: formData.daily_protein
          ? parseFloat(formData.daily_protein)
          : null,
        daily_carbs: formData.daily_carbs
          ? parseFloat(formData.daily_carbs)
          : null,
        daily_fat: formData.daily_fat ? parseFloat(formData.daily_fat) : null,
        notes: formData.notes || null,
        status: "active",
      },
    ]);

    if (error) {
      toast.error(t("saveError") + error.message);
    } else {
      toast.success(t("saveSuccess"));
      setFormData({
        name: "",
        description: "",
        content: "",
        daily_calories: "",
        daily_protein: "",
        daily_carbs: "",
        daily_fat: "",
        notes: "",
      });
      onClose();
      onPlanAdded();
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[650px] h-[92vh] sm:h-auto max-h-[92vh] flex flex-col p-0 border-none overflow-hidden rounded-2xl sm:rounded-[2rem] shadow-2xl antialiased">
        {/* A felső padding (pt-20) megvédi a tartalmat a fix mobilos navbartól, sm kijelzőn visszaáll normálra */}
        <DialogHeader className="p-5 sm:p-6 pb-0 pt-20 sm:pt-6 shrink-0">
          <DialogTitle className="text-base sm:text-xl font-black text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
              <Utensils className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-600" />
            </div>
            <span className="truncate">
              {showTemplateSelector
                ? t("selectTemplate")
                : t("newMealPlan", { clientName })}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 touch-pan-y">
          {!showTemplateSelector ? (
            <form
              id="meal-plan-form"
              onSubmit={handleSubmit}
              className="space-y-4 sm:space-y-5"
            >
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowTemplateSelector(true)}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none rounded-xl font-bold gap-2 text-xs h-9"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t("loadTemplate")}
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider ml-1"
                  >
                    {t("name")} *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t("namePlaceholder")}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="rounded-xl sm:rounded-2xl border-slate-200 focus-visible:ring-indigo-500 h-10 sm:h-11 font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="content"
                    className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider ml-1"
                  >
                    {t("content")} *
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder={t("contentPlaceholder")}
                    value={formData.content}
                    onChange={handleChange}
                    rows={6}
                    required
                    className="rounded-xl sm:rounded-2xl border-slate-200 font-mono text-xs sm:text-sm resize-none focus-visible:ring-indigo-500 min-h-[140px] sm:min-h-[180px]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      {t("calories")}
                    </Label>
                    <Input
                      name="daily_calories"
                      type="number"
                      placeholder="kcal"
                      value={formData.daily_calories}
                      onChange={handleChange}
                      className="rounded-xl h-10 border-slate-200 text-sm font-medium focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      {t("protein")}
                    </Label>
                    <Input
                      name="daily_protein"
                      type="number"
                      placeholder="g"
                      value={formData.daily_protein}
                      onChange={handleChange}
                      className="rounded-xl h-10 border-slate-200 text-sm font-medium focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      {t("carbs")}
                    </Label>
                    <Input
                      name="daily_carbs"
                      type="number"
                      placeholder="g"
                      value={formData.daily_carbs}
                      onChange={handleChange}
                      className="rounded-xl h-10 border-slate-200 text-sm font-medium focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                      {t("fat")}
                    </Label>
                    <Input
                      name="daily_fat"
                      type="number"
                      placeholder="g"
                      value={formData.daily_fat}
                      onChange={handleChange}
                      className="rounded-xl h-10 border-slate-200 text-sm font-medium focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="notes"
                    className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider ml-1"
                  >
                    {t("clientNotes")}
                  </Label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder={t("clientNotesPlaceholder")}
                    value={formData.notes}
                    onChange={handleChange}
                    className="rounded-xl sm:rounded-2xl border-slate-200 focus-visible:ring-indigo-500 h-10 sm:h-11 font-medium text-sm"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Button
                variant="ghost"
                onClick={() => setShowTemplateSelector(false)}
                className="mb-1 text-slate-500 hover:text-indigo-600 font-black text-xs gap-1.5 p-0 hover:bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" /> {t("backToEdit")}
              </Button>

              {templates.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl sm:rounded-[2rem] border-2 border-dashed border-slate-200">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-slate-500 font-bold">
                    {t("noTemplates")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className="group p-4 bg-white border border-slate-100 rounded-xl sm:rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start pr-10">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm sm:text-base text-slate-800 truncate">
                            {template.name}
                          </h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 text-orange-400" />{" "}
                              {template.daily_calories || 0} kcal
                            </span>
                            <span className="flex items-center gap-1">
                              <Dumbbell className="h-3.5 w-3.5 text-indigo-400" />{" "}
                              {template.daily_protein || 0}g P
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                        className="absolute top-3 right-3 h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex flex-row items-center gap-2 justify-end">
          {!showTemplateSelector && (
            <>
              <Button
                variant="ghost"
                onClick={onClose}
                className="rounded-xl font-bold text-xs sm:text-sm text-slate-500 hover:bg-slate-100/80 h-10 sm:h-11 flex-1 sm:flex-none"
              >
                {t("cancel")}
              </Button>
              <Button
                form="meal-plan-form"
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 sm:px-8 font-bold text-xs sm:text-sm min-w-[110px] sm:min-w-[140px] h-10 sm:h-11 shadow-md shadow-indigo-100 flex-1 sm:flex-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("savePlan")
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
