"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  NotebookPen,
  Trash2,
  Save,
  Settings2,
  HeartPulse,
  ShieldAlert,
  Target,
} from "lucide-react";

interface EditClientDialogProps {
  client: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: () => void;
}

export default function EditClientDialog({
  client,
  open,
  onOpenChange,
  onClientUpdated,
}: EditClientDialogProps) {
  const t = useTranslations("EditClient");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "male",
    address: "",
    emergency_contact: "",
    emergency_phone: "",
    medical_conditions: "",
    medications: "",
    allergies: "",
    injuries: "",
    goals: "",
    notes: "",
    status: "active",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name || "",
        email: client.email || "",
        phone: client.phone || "",
        birth_date: client.birth_date || "",
        gender: client.gender || "male",
        address: client.address || "",
        emergency_contact: client.emergency_contact || "",
        emergency_phone: client.emergency_phone || "",
        medical_conditions: client.medical_conditions || "",
        medications: client.medications || "",
        allergies: client.allergies || "",
        injuries: client.injuries || "",
        goals: client.goals || "",
        notes: client.notes || "",
        status: client.status || "active",
      });
    }
  }, [client]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("clients")
      .update({
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        medical_conditions: formData.medical_conditions || null,
        medications: formData.medications || null,
        allergies: formData.allergies || null,
        injuries: formData.injuries || null,
        goals: formData.goals || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    if (error) {
      toast.error(t("saveError") + error.message);
    } else {
      toast.success(t("saveSuccess"));
      onOpenChange(false);
      onClientUpdated();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;

    setLoading(true);
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (error) {
      toast.error(t("deleteError") + error.message);
    } else {
      toast.success(t("deleteSuccess"));
      onOpenChange(false);
      onClientUpdated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl p-0 border-none shadow-2xl sm:rounded-2xl overflow-hidden bg-white h-full sm:h-auto sm:max-h-[90vh] flex flex-col pt-16 sm:pt-0">
        <div className="bg-slate-900 px-6 sm:px-8 py-6 sm:py-8 text-white relative sticky top-0 z-20 shrink-0">
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shrink-0">
              <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm truncate">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 space-y-8 sm:space-y-10 bg-white overflow-y-auto flex-1 custom-scrollbar"
        >
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="h-4 w-4 text-indigo-500" />
              <h3 className="font-bold text-slate-800 uppercase text-[10px] sm:text-xs tracking-widest">
                {t("personalProfile")}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t("fullName")}</Label>
                <Input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t("status")}</Label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                >
                  <option value="active">{t("active")}</option>
                  <option value="inactive">{t("inactive")}</option>
                  <option value="archived">{t("archived")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">{t("birthDate")}</Label>
                <Input
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">{t("gender")}</Label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                >
                  <option value="male">{t("male")}</option>
                  <option value="female">{t("female")}</option>
                  <option value="other">{t("other")}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <HeartPulse className="h-4 w-4 text-rose-500" />
              <h3 className="font-bold text-slate-800 uppercase text-[10px] sm:text-xs tracking-widest">
                {t("healthProfile")}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label>{t("medicalConditions")}</Label>
                <Input
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("allergies")}</Label>
                <Input
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("injuries")}</Label>
                <Input
                  name="injuries"
                  value={formData.injuries}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("medications")}</Label>
                <Input
                  name="medications"
                  value={formData.medications}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            <section className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldAlert className="h-4 w-4 text-orange-500" />
                <h3 className="font-bold text-slate-800 uppercase text-[10px] sm:text-xs tracking-widest">
                  {t("emergencyData")}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("emergencyContact")}</Label>
                  <Input
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("emergencyPhone")}</Label>
                  <Input
                    name="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Target className="h-4 w-4 text-emerald-500" />
                <h3 className="font-bold text-slate-800 uppercase text-[10px] sm:text-xs tracking-widest">
                  {t("goals")}
                </h3>
              </div>
              <Textarea
                name="goals"
                value={formData.goals}
                onChange={handleChange}
                className="min-h-[100px]"
                placeholder={t("goalsPlaceholder")}
              />
            </section>
          </div>

          <section className="space-y-2 pt-4 border-t border-slate-100">
            <Label className="flex items-center gap-2">
              <NotebookPen className="h-3.5 w-3.5" /> {t("internalNotes")}
            </Label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="min-h-[80px]"
            />
          </section>

          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-3 sm:gap-4 pt-4 sm:pt-6 sticky bottom-0 bg-white border-t border-slate-100 pb-4 sm:pb-0 shrink-0 z-10">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="w-full md:w-auto gap-2 h-11 active:scale-[0.99] transition-transform"
            >
              <Trash2 className="h-4 w-4" /> {t("deleteClient")}
            </Button>

            <div className="flex w-full md:w-auto gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-1/2 md:w-auto h-11"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-1/2 md:w-auto gap-2 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 h-11 active:scale-[0.99] transition-transform"
              >
                {loading ? (
                  t("saving")
                ) : (
                  <>
                    <Save className="h-4 w-4" /> {t("saveChanges")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
