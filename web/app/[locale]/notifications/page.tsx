"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Navbar";
import {
  Bell,
  Check,
  Trash2,
  Clock,
  Dumbbell,
  Activity,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  scheduled_for: string | null;
  metadata: any;
}

export default function NotificationsPage() {
  const t = useTranslations("NotificationsPage");
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  }

  async function markAsRead(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      toast.success(t("markReadSuccess"));
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success(t("markAllReadSuccess"));
    }
  }

  async function deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success(t("deleteSuccess"));
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "workout_reminder":
        return <Dumbbell className="h-5 w-5" />;
      case "measurement_reminder":
        return <Activity className="h-5 w-5" />;
      case "appointment":
        return <Calendar className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "workout_reminder":
        return "bg-emerald-100 text-emerald-600";
      case "measurement_reminder":
        return "bg-blue-100 text-blue-600";
      case "appointment":
        return "bg-amber-100 text-amber-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {t("title")}
              </h1>
              <p className="text-slate-500 mt-1">{t("subtitle")}</p>
            </div>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                <Check className="h-4 w-4" />
                {t("markAllRead")}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
              <Bell className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700">
                {t("noNotifications")}
              </h3>
              <p className="text-slate-400 mt-1">
                {t("noNotificationsDescription")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    !notification.is_read
                      ? "border-indigo-200 shadow-sm"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`p-3 rounded-xl ${getIconColor(notification.type)}`}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                              title={t("markRead")}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {format(
                          new Date(notification.created_at),
                          "yyyy. MMMM dd. HH:mm",
                          { locale: hu },
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
