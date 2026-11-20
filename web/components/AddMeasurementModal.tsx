"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Activity,
  Ruler,
  Weight,
  Heart,
  ScrollText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onMeasurementAdded: () => void;
}

export default function AddMeasurementModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  onMeasurementAdded,
}: AddMeasurementModalProps) {
  const t = useTranslations("AddMeasurement");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    body_fat: "",
    muscle_mass: "",
    chest: "",
    waist: "",
    hips: "",
    arm_left: "",
    arm_right: "",
    thigh_left: "",
    thigh_right: "",
    resting_heart_rate: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error(t("errorTitle"), { description: t("notLoggedIn") });
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const measurementData = {
      client_id: clientId,
      measured_at: today,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
      muscle_mass: formData.muscle_mass
        ? parseFloat(formData.muscle_mass)
        : null,
      chest: formData.chest ? parseFloat(formData.chest) : null,
      waist: formData.waist ? parseFloat(formData.waist) : null,
      hips: formData.hips ? parseFloat(formData.hips) : null,
      arm_left: formData.arm_left ? parseFloat(formData.arm_left) : null,
      arm_right: formData.arm_right ? parseFloat(formData.arm_right) : null,
      thigh_left: formData.thigh_left ? parseFloat(formData.thigh_left) : null,
      thigh_right: formData.thigh_right
        ? parseFloat(formData.thigh_right)
        : null,
      resting_heart_rate: formData.resting_heart_rate
        ? parseInt(formData.resting_heart_rate)
        : null,
      notes: formData.notes || null,
    };

    const { error } = await supabase
      .from("measurements")
      .insert([measurementData]);

    if (error) {
      if (error.code === "23505") {
        toast.error(t("duplicateTitle"), {
          description: t("duplicateDescription"),
          icon: <AlertCircle className="h-5 w-5 text-rose-500" />,
          duration: 6000,
        });
      } else {
        toast.error(t("errorTitle"), { description: error.message });
      }
    } else {
      toast.success(t("successTitle"), {
        description: t("successDescription"),
      });
      setFormData({
        weight: "",
        height: "",
        body_fat: "",
        muscle_mass: "",
        chest: "",
        waist: "",
        hips: "",
        arm_left: "",
        arm_right: "",
        thigh_left: "",
        thigh_right: "",
        resting_heart_rate: "",
        notes: "",
      });
      onClose();
      onMeasurementAdded();
    }
    setLoading(false);
  };

  const inputSections = [
    {
      title: t("sectionBodyComposition"),
      icon: Weight,
      fields: [
        { name: "weight", label: t("weight"), step: "0.1" },
        { name: "height", label: t("height"), step: "0.1" },
        { name: "body_fat", label: t("bodyFat"), step: "0.1" },
        { name: "muscle_mass", label: t("muscleMass"), step: "0.1" },
      ],
    },
    {
      title: t("sectionCircumference"),
      icon: Ruler,
      fields: [
        { name: "chest", label: t("chest"), step: "0.1" },
        { name: "waist", label: t("waist"), step: "0.1" },
        { name: "hips", label: t("hips"), step: "0.1" },
        { name: "arm_left", label: t("armLeft"), step: "0.1" },
        { name: "arm_right", label: t("armRight"), step: "0.1" },
        { name: "thigh_left", label: t("thighLeft"), step: "0.1" },
        { name: "thigh_right", label: t("thighRight"), step: "0.1" },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:h-auto max-w-full sm:max-w-2xl p-0 pt-16 sm:pt-0 border-none shadow-2xl sm:rounded-3xl overflow-hidden bg-white max-h-screen sm:max-h-[90vh] flex flex-col">
        {/* Mobilon kicsit kisebb padding (px-5 py-5) a kompaktság miatt */}
        <DialogHeader className="bg-slate-900 px-5 py-5 sm:px-8 sm:py-7 text-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-indigo-500/20 rounded-xl sm:rounded-2xl shrink-0">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-black tracking-tight truncate">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm font-medium truncate">
                {t("clientLabel")}:{" "}
                <span className="text-indigo-300 font-bold">{clientName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Görgethető tartalom paddingja igazítva */}
        <div className="overflow-y-auto p-5 sm:p-8 flex-1 custom-scrollbar">
          <form
            id="measurement-form"
            onSubmit={handleSubmit}
            className="space-y-6 sm:space-y-10"
          >
            {inputSections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                  <section.icon className="h-4 w-4 text-indigo-500 shrink-0" />
                  <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] truncate">
                    {section.title}
                  </h3>
                </div>
                {/* 2 oszlopos elrendezés szűk mobilon is, de kisebb gap-ekkel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {section.fields.map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <label
                        htmlFor={field.name}
                        className="text-[10px] sm:text-[11px] font-bold text-slate-500 ml-1 truncate block"
                      >
                        {field.label}
                      </label>
                      <input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step={field.step}
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                        className="w-full h-11 px-3 sm:px-4 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-300"
                        placeholder="--"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                <Heart className="h-4 w-4 text-rose-500 shrink-0" />
                <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em] truncate">
                  {t("sectionHealth")}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 ml-1 truncate block">
                    {t("restingHeartRate")}
                  </label>
                  <input
                    name="resting_heart_rate"
                    type="number"
                    value={formData.resting_heart_rate}
                    onChange={handleChange}
                    className="w-full h-11 px-3 sm:px-4 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500 ml-1">
                <ScrollText className="h-3.5 w-3.5" /> {t("measurementNotes")}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                placeholder={t("notesPlaceholder")}
              />
            </div>
          </form>
        </div>

        {/* Alsó lábléc gombjai reszponzív flexboxszal */}
        <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3 shrink-0 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all text-center"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="measurement-form"
            disabled={loading}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading ? t("saving") : t("save")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
