"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUserProfile();
  }, []);

  async function getUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || "");
    }
  }

  async function updateProfile() {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (error) {
      toast.error(t("updateError") + error.message);
    } else {
      toast.success(t("updateSuccess"));
    }
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("profileData")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" value={email} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("fullNamePlaceholder")}
              />
            </div>
            <Button onClick={updateProfile} disabled={loading}>
              {loading ? t("saving") : t("save")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
