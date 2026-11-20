"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  NotebookPen,
  Sparkles,
  HeartPulse,
  ShieldAlert,
  Target,
  Loader2,
  Key,
} from "lucide-react";

interface AddClientDialogProps {
  onClientAdded: () => void;
}

export default function AddClientDialog({
  onClientAdded,
}: AddClientDialogProps) {
  const t = useTranslations("AddClient");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

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
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("passwordCopied"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user: coachUser },
    } = await supabase.auth.getUser();
    if (!coachUser) {
      toast.error(t("sessionExpired"));
      setLoading(false);
      return;
    }

    if (formData.email) {
      const { data: existingUser } = await supabase
        .from("clients")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        toast.error(t("emailExists"));
        setLoading(false);
        return;
      }
    }

    let clientUserId = null;

    if (formData.email) {
      try {

        const response = await fetch("/api/create-client-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            email: formData.email,
            full_name: formData.full_name,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || t("unknownError"));
        }

        if (result.success && result.user) {
          clientUserId = result.user.id;
          setGeneratedPassword(result.temporaryPassword);
          setShowPasswordDialog(true);

          toast.success(
            <div>
              <p className="font-bold">✅ {t("clientCreated")}</p>
              <p className="text-sm mt-1">{t("passwordVisible")}</p>
            </div>,
            { duration: 5000 },
          );
        } else {
          throw new Error(t("userCreationFailed"));
        }
      } catch (error: any) {
        console.error("API error:", error);
        toast.error(t("userCreationError") + error.message);
        setLoading(false);
        return;
      }
    }

    const { error: clientError } = await supabase.from("clients").insert([
      {
        id: clientUserId ?? crypto.randomUUID(),
        coach_id: coachUser.id,
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
        medical_conditions: formData.medical_conditions || null,
        medications: formData.medications || null,
        allergies: formData.allergies || null,
        injuries: formData.injuries || null,
        goals: formData.goals || null,
        notes: formData.notes || null,
        status: "active",
      },
    ]);

    if (clientError) {
      toast.error(t("clientSaveError") + clientError.message);
      if (clientUserId) {
        await fetch("/api/delete-client-user", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}` },
          body: JSON.stringify({ userId: clientUserId }),
        });
      }
    } else {
      if (!clientUserId) {
        toast.success(t("clientSavedNoEmail"));
      }
      setFormData({
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
      });
      setOpen(false);
      onClientAdded();
    }
    setLoading(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            className="gap-2 px-5 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100"
          >
            <Plus className="h-4 w-4" />
            {t("addClient")}
          </Button>
        </DialogTrigger>

        {/* 🔥 MEGOLDVA: Reszponzív méretezés, flexbox struktúra és felső padding mobilon a navbar miatt */}
        <DialogContent className="w-full sm:max-w-3xl p-0 border-none shadow-2xl sm:rounded-2xl overflow-hidden bg-white h-full sm:h-auto sm:max-h-[90vh] flex flex-col pt-16 sm:pt-0">
          {/* Fix fejléc, ami mobilon is tökéletesen látszik */}
          <div className="bg-slate-900 px-6 sm:px-8 py-6 sm:py-8 text-white relative sticky top-0 z-20 shrink-0">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                  {t("registerClient")}
                </DialogTitle>
              </div>
              <DialogDescription className="text-slate-400 text-xs sm:text-sm">
                {t("registerClientDescription")}
              </DialogDescription>
            </div>
          </div>

          {/* Görgethető űrlap részlet, sűrűbb mobilos térközökkel */}
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 space-y-8 sm:space-y-10 overflow-y-auto flex-1 custom-scrollbar"
          >
            <section className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="h-4 w-4 text-indigo-500" />
                <h3 className="font-bold text-slate-800 uppercase text-[10px] sm:text-xs tracking-widest">
                  {t("personalData")}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full_name">{t("fullName")} *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder={t("fullNamePlaceholder")}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")} *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("emailPlaceholder")}
                    required
                  />
                  <p className="text-[10px] text-slate-400">{t("emailInfo")}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("phonePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">{t("birthDate")}</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">{t("gender")}</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
                  <Label htmlFor="medical_conditions">
                    {t("medicalConditions")}
                  </Label>
                  <Input
                    id="medical_conditions"
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                    placeholder={t("medicalConditionsPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">{t("allergies")}</Label>
                  <Input
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder={t("allergiesPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="injuries">{t("injuries")}</Label>
                  <Input
                    id="injuries"
                    name="injuries"
                    value={formData.injuries}
                    onChange={handleChange}
                    placeholder={t("injuriesPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">{t("medications")}</Label>
                  <Input
                    id="medications"
                    name="medications"
                    value={formData.medications}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                  <h3 className="font-bold text-slate-800 uppercase text-[10px] sm:text-xs tracking-widest">
                    {t("emergency")}
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact">
                      {t("emergencyContact")}
                    </Label>
                    <Input
                      id="emergency_contact"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone">
                      {t("emergencyPhone")}
                    </Label>
                    <Input
                      id="emergency_phone"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleChange}
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
                <div className="space-y-2">
                  <Label htmlFor="goals">{t("mainGoal")}</Label>
                  <Textarea
                    id="goals"
                    name="goals"
                    value={formData.goals}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </div>
              </section>
            </div>

            <section className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-slate-400" /> {t("notes")}
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t("notesPlaceholder")}
              />
            </section>

            {/* Reszponzív alsó akciógombok, mobilon egymás alatt elrendezve */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-100 pb-4 sm:pb-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[150px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("saveClient")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Jelszó generáló popup - változatlan maradt, de reszponzív */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="w-[95%] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-600" />
              {t("clientCredentials")}
            </DialogTitle>
            <DialogDescription>
              {t("clientCredentialsDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="text-sm text-amber-700 mb-2 font-medium">
              {t("emailLabel")}:
            </p>
            <p className="text-base font-mono bg-white p-2 rounded-lg border border-amber-100 break-all">
              {formData.email}
            </p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
            <p className="text-sm text-indigo-700 mb-2 font-medium">
              {t("tempPassword")}:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-base font-mono bg-white p-2 rounded-lg border border-indigo-100 break-all">
                {generatedPassword}
              </code>
              <Button
                onClick={() => copyToClipboard(generatedPassword || "")}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {t("copy")}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600">{t("passwordWarning")}</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowPasswordDialog(false);
                setOpen(false);
                onClientAdded();
              }}
            >
              {t("ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
