"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, X, Users, Calendar } from "lucide-react";

interface CoachProfile {
  id: string;
  full_name: string;
  email: string;
  subscription_status: string;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
}

export default function AdminSubscriptionsPage() {
  const t = useTranslations("AdminSubscriptions");
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCoaches();
  }, []);

  async function fetchCoaches() {
    const { data, error } = await supabase
      .from("coach_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCoaches(data);
    }
    setLoading(false);
  }

  async function updateSubscription(
    coachId: string,
    status: "active" | "expired" | "cancelled" | "trial",
  ) {
    setUpdating(coachId);
    const { error } = await supabase
      .from("coach_profiles")
      .update({
        subscription_status: status,
        trial_end:
          status === "active"
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", coachId);

    if (error) {
      toast.error(t("updateError") + error.message);
    } else {
      toast.success(t("updateSuccess", { status }));
      fetchCoaches();
    }
    setUpdating(null);
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      trial: "bg-indigo-100 text-indigo-700",
      active: "bg-emerald-100 text-emerald-700",
      expired: "bg-rose-100 text-rose-700",
      cancelled: "bg-slate-100 text-slate-700",
    };
    return styles[status] || styles.trial;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "trial":
        return t("statusTrial");
      case "active":
        return t("statusActive");
      case "expired":
        return t("statusExpired");
      case "cancelled":
        return t("statusCancelled");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 sm:pt-8 p-4 sm:p-8 w-full">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Fejléc */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-1">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm self-start sm:self-auto shrink-0">
            <Users className="h-4 w-4 text-indigo-500" />
            <span className="font-bold">
              {coaches.length} {t("coaches")}
            </span>
          </div>
        </div>

        {/* Edzők listája */}
        <div className="grid gap-4">
          {coaches.map((coach) => (
            <Card
              key={coach.id}
              className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Információs blokk */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base truncate max-w-[200px] xs:max-w-none">
                        {coach.full_name || t("unnamed")}
                      </h3>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${getStatusBadge(coach.subscription_status)}`}
                      >
                        {getStatusLabel(coach.subscription_status)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 truncate font-medium">
                      {coach.email}
                    </p>

                    {/* Dátumok sora */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1.5 text-[10px] sm:text-xs font-semibold text-slate-400">
                      {coach.trial_start && (
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                          {t("trialStart")}{" "}
                          <strong className="text-slate-600 font-bold">
                            {new Date(coach.trial_start).toLocaleDateString(
                              "hu-HU",
                            )}
                          </strong>
                        </span>
                      )}
                      {coach.trial_end && (
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                          <Calendar className="h-3 w-3 text-indigo-500" />
                          {t("trialEnd")}{" "}
                          <strong className="text-slate-600 font-bold">
                            {new Date(coach.trial_end).toLocaleDateString(
                              "hu-HU",
                            )}
                          </strong>
                        </span>
                      )}
                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                        {t("registered")}{" "}
                        <strong className="text-slate-600 font-bold">
                          {new Date(coach.created_at).toLocaleDateString(
                            "hu-HU",
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Akció gombok */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 lg:pt-0 border-t border-slate-50 lg:border-none shrink-0">
                    {coach.subscription_status === "trial" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl text-xs px-3.5 py-2"
                          onClick={() => updateSubscription(coach.id, "active")}
                          disabled={updating === coach.id}
                        >
                          {updating === coach.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" strokeWidth={3} />
                          )}
                          {t("activate")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs px-3.5 py-2"
                          onClick={() =>
                            updateSubscription(coach.id, "expired")
                          }
                          disabled={updating === coach.id}
                        >
                          {updating === coach.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3 mr-1" strokeWidth={3} />
                          )}
                          {t("expire")}
                        </Button>
                      </>
                    )}
                    {coach.subscription_status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs px-3.5 py-2"
                        onClick={() => updateSubscription(coach.id, "expired")}
                        disabled={updating === coach.id}
                      >
                        {updating === coach.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3 mr-1" strokeWidth={3} />
                        )}
                        {t("expire")}
                      </Button>
                    )}
                    {coach.subscription_status === "expired" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl text-xs px-3.5 py-2"
                        onClick={() => updateSubscription(coach.id, "trial")}
                        disabled={updating === coach.id}
                      >
                        {updating === coach.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" strokeWidth={3} />
                        )}
                        {t("restartTrial")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
