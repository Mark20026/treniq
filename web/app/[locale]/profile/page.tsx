"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Navbar from "../../../components/Navbar"; // 🔥 Javítva: Navbar helyett a korábban optimalizált Sidebar importja
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Briefcase,
  FileText,
  Camera,
  Save,
  Loader2,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

interface CoachProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  gym_name: string | null;
  specialization: string[] | null;
  years_experience: number | null;
  bio: string | null;
}

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gym_name: "",
    specialization: "",
    years_experience: "",
    bio: "",
  });

  // Jelszóváltoztatás állapotok
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push(`/${locale}/login`);
      return;
    }

    const { data, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Profil betöltési hiba:", error);
      toast.error(t("loadError"));
    } else if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        gym_name: data.gym_name || "",
        specialization: data.specialization?.join(", ") || "",
        years_experience: data.years_experience?.toString() || "",
        bio: data.bio || "",
      });
    }
    setLoading(false);
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast.error(t("notLoggedIn"));
      setSaving(false);
      return;
    }

    const specializationArray = formData.specialization
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    const { error } = await supabase
      .from("coach_profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        gym_name: formData.gym_name || null,
        specialization:
          specializationArray.length > 0 ? specializationArray : null,
        years_experience: formData.years_experience
          ? parseInt(formData.years_experience)
          : null,
        bio: formData.bio || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      toast.error(t("saveError") + error.message);
    } else {
      toast.success(t("saveSuccess"));
      fetchProfile();
    }
    setSaving(false);
  };

  const openPasswordDialog = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordSuccess(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error(t("currentPasswordRequired"));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error(t("currentPasswordIncorrect"));
        } else {
          throw error;
        }
        setPasswordLoading(false);
        return;
      }

      setPasswordSuccess(true);
      toast.success(t("passwordChanged"));

      setTimeout(() => {
        setIsPasswordDialogOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error("Hiba a jelszó változtatása során:", error);
      toast.error(t("passwordChangeError") + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-1 lg:ml-64 flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />

      {/* lg:ml-64 tartja meg a helyet asztalin, pt-20 mobilon a fix fejrész miatt fontos */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 items-start">
            {/* Kártya / Gyorsnézet */}
            <div className="lg:col-span-1">
              <Card className="border-none shadow-sm sticky lg:top-8 bg-white overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600" />
                <CardHeader className="text-center pt-0 -mt-12 relative z-10">
                  <div className="relative inline-block mx-auto group">
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-xl shadow-indigo-100">
                      <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center text-indigo-600 text-3xl font-black">
                        {profile?.full_name?.charAt(0).toUpperCase() || "E"}
                      </div>
                    </div>
                    <button className="absolute -bottom-1 -right-1 p-2 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 active:scale-95 transition-all">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <CardTitle className="mt-4 text-xl font-bold text-slate-900">
                    {profile?.full_name}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-400">
                    {profile?.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm pb-6">
                  <hr className="border-slate-100" />

                  <div className="space-y-3">
                    {profile?.phone && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <span className="font-medium">{profile.phone}</span>
                      </div>
                    )}
                    {profile?.gym_name && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <span className="font-medium">{profile.gym_name}</span>
                      </div>
                    )}
                    {profile?.years_experience && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-1.5 bg-slate-50 rounded-lg">
                          <Briefcase className="h-4 w-4 text-slate-400" />
                        </div>
                        <span className="font-medium">
                          {profile.years_experience} {t("yearsExperience")}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={openPasswordDialog}
                    className="w-full mt-4 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all font-semibold rounded-xl"
                  >
                    <Key className="h-4 w-4 mr-2 text-indigo-500" />
                    {t("changePassword")}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Személyes Adatok Form */}
            <div className="lg:col-span-2">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="border-b border-slate-50">
                  <CardTitle className="text-lg font-bold text-slate-800">
                    {t("personalData")}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {t("personalDataDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="full_name"
                          className="text-slate-700 font-semibold text-xs sm:text-sm"
                        >
                          {t("fullName")} *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="phone"
                          className="text-slate-700 font-semibold text-xs sm:text-sm"
                        >
                          {t("phone")}
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+36 30 123 4567"
                            value={formData.phone}
                            onChange={handleChange}
                            className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="gym_name"
                          className="text-slate-700 font-semibold text-xs sm:text-sm"
                        >
                          {t("gymName")}
                        </Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="gym_name"
                            name="gym_name"
                            placeholder={t("gymNamePlaceholder")}
                            value={formData.gym_name}
                            onChange={handleChange}
                            className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="years_experience"
                          className="text-slate-700 font-semibold text-xs sm:text-sm"
                        >
                          {t("yearsExperience")}
                        </Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="years_experience"
                            name="years_experience"
                            type="number"
                            min="0"
                            max="50"
                            placeholder="5"
                            value={formData.years_experience}
                            onChange={handleChange}
                            className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="specialization"
                        className="text-slate-700 font-semibold text-xs sm:text-sm"
                      >
                        {t("specialization")}
                      </Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="specialization"
                          name="specialization"
                          placeholder={t("specializationPlaceholder")}
                          value={formData.specialization}
                          onChange={handleChange}
                          className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 px-1">
                        {t("specializationHint")}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="bio"
                        className="text-slate-700 font-semibold text-xs sm:text-sm"
                      >
                        {t("bio")}
                      </Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Textarea
                          id="bio"
                          name="bio"
                          placeholder={t("bioPlaceholder")}
                          value={formData.bio}
                          onChange={handleChange}
                          rows={5}
                          className="pl-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-50">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 font-semibold"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t("saving")}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {t("saveChanges")}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Jelszóváltoztató Modal */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="w-[92%] sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
              <Key className="h-5 w-5 text-indigo-600" />
              {t("changePasswordTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {t("changePasswordDescription")}
            </DialogDescription>
          </DialogHeader>

          {passwordSuccess ? (
            <div className="py-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {t("passwordChangedTitle")}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {t("passwordChangedDescription")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="current-password"
                    className="text-xs sm:text-sm font-semibold text-slate-700"
                  >
                    {t("currentPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder={t("currentPasswordPlaceholder")}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="h-11 pr-10 rounded-xl border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="new-password"
                    className="text-xs sm:text-sm font-semibold text-slate-700"
                  >
                    {t("newPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder={t("newPasswordPlaceholder")}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="h-11 pr-10 rounded-xl border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 px-1">
                    {t("passwordHint")}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirm-password"
                    className="text-xs sm:text-sm font-semibold text-slate-700"
                  >
                    {t("confirmPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("confirmPasswordPlaceholder")}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="h-11 pr-10 rounded-xl border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                  className="w-full sm:w-auto rounded-xl"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("savingPassword")}
                    </>
                  ) : (
                    t("changePasswordButton")
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
