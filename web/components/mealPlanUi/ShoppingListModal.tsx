"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShoppingCart,
  ListChecks,
  Pencil,
  Save,
  Plus,
  Trash2,
  Check,
  ClipboardList,
  Loader2,
} from "lucide-react";

interface MealPlan {
  id: string;
  name: string;
  shopping_list: string | null;
  options: string | null;
  notes: string | null;
}

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MealPlan | null;
  onSave: () => void;
}

export default function ShoppingListModal({
  isOpen,
  onClose,
  plan,
  onSave,
}: ShoppingListModalProps) {
  const t = useTranslations("ShoppingListModal");
  const [loading, setLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState("");
  const [options, setOptions] = useState("");
  const [notes, setNotes] = useState("");
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "options" | "notes">(
    "list",
  );

  const prevPlanIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }

    if (plan) {
      const currentPlanId = plan.id;

      if (
        prevPlanIdRef.current !== currentPlanId ||
        !isInitializedRef.current
      ) {
        prevPlanIdRef.current = currentPlanId;
        isInitializedRef.current = true;

        const list = plan.shopping_list || "";
        const opts = plan.options || "";
        const note = plan.notes || "";

        setShoppingList(list);
        setOptions(opts);
        setNotes(note);

        if (list) {
          const items = list.split("\n").filter((item) => item.trim() !== "");
          setShoppingItems(items);
        } else {
          setShoppingItems([]);
        }
      }
    } else {
      prevPlanIdRef.current = null;
      isInitializedRef.current = false;
      setShoppingList("");
      setOptions("");
      setNotes("");
      setShoppingItems([]);
    }
  }, [plan, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      prevPlanIdRef.current = null;
      isInitializedRef.current = false;
    }
  }, [isOpen]);

  const addShoppingItem = () => {
    if (newItem.trim()) {
      setShoppingItems([...shoppingItems, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeShoppingItem = (index: number) => {
    setShoppingItems(shoppingItems.filter((_, i) => i !== index));
  };

  const updateShoppingItem = (index: number, value: string) => {
    const updated = [...shoppingItems];
    updated[index] = value;
    setShoppingItems(updated);
  };

  const handleSave = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const listText = shoppingItems
        .filter((item) => item.trim() !== "")
        .join("\n");

      const { error } = await supabase
        .from("meal_plans")
        .update({
          shopping_list: listText || null,
          options: options || null,
          notes: notes || null,
        })
        .eq("id", plan.id);

      if (error) throw error;

      toast.success(t("saveSuccess"));
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(t("saveError") + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addShoppingItem();
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Max szélesség és magasság optimalizálva, lekerekítés mobilbarát szintre csökkentve full screen kockázat helyett */}
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl sm:w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 border-none overflow-hidden rounded-2xl sm:rounded-[2rem] shadow-2xl bg-white m-3 sm:m-0">
        {/* A felső fix navbar kompenzálására mobil nézetben pt-16 került rá */}
        <DialogHeader className="p-4 pt-16 sm:p-6 sm:pb-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-500 truncate">
                {t("subtitle", { name: plan.name })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Görgethető fül-menü (Tabok) mobilra, ha túl sok szöveg lenne */}
        <div className="px-4 sm:px-6 border-b border-slate-100 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === "list"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <ListChecks className="h-4 w-4 shrink-0" />
              <span>{t("tabList")}</span>
              {shoppingItems.length > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 font-bold rounded-full">
                  {shoppingItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("options")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === "options"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              <span>{t("tabOptions")}</span>
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === "notes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <ClipboardList className="h-4 w-4 shrink-0" />
              <span>{t("tabNotes")}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "list" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={t("addItemPlaceholder")}
                  className="rounded-xl border-slate-200 text-sm h-10"
                  onKeyDown={handleKeyDown}
                />
                <Button
                  onClick={addShoppingItem}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shrink-0 h-10 px-3 sm:px-4 text-xs sm:text-sm font-bold"
                >
                  <Plus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t("addButton")}</span>
                </Button>
              </div>

              {shoppingItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">{t("noItems")}</p>
                  <p className="text-xs text-slate-400/80">
                    {t("noItemsDescription")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[35vh] sm:max-h-none overflow-y-auto pr-0.5">
                  {shoppingItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-1.5 sm:p-2 bg-slate-50 rounded-xl border border-slate-100 group hover:border-emerald-200 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <Input
                          value={item}
                          onChange={(e) =>
                            updateShoppingItem(index, e.target.value)
                          }
                          className="border-none bg-transparent focus:ring-0 p-1 h-auto text-sm font-medium text-slate-700 w-full"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShoppingItem(index)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {shoppingItems.length > 0 && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>
                    {t("itemsCount", { count: shoppingItems.length })}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === "options" && (
            <div className="space-y-2.5">
              <Label className="text-xs sm:text-sm font-bold text-slate-700">
                {t("optionsLabel")}
              </Label>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {t("optionsDescription")}
              </p>
              <Textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder={t("optionsPlaceholder")}
                rows={window.innerWidth < 640 ? 5 : 7}
                className="rounded-xl border-slate-200 resize-none text-sm"
              />
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-2.5">
              <Label className="text-xs sm:text-sm font-bold text-slate-700">
                {t("notesLabel")}
              </Label>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {t("notesDescription")}
              </p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={window.innerWidth < 640 ? 5 : 7}
                className="rounded-xl border-slate-200 resize-none text-sm"
              />
            </div>
          )}
        </div>

        {/* Footer flex irányváltással: kis kijelzőn egymás mellé rendeződik gombként */}
        <DialogFooter className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-row items-center justify-end gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl font-bold text-slate-500 text-xs sm:text-sm flex-1 sm:flex-initial h-10"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 sm:px-8 font-bold text-xs sm:text-sm flex-1 sm:flex-initial h-10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <Save className="h-4 w-4" />
                <span>{t("save")}</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
