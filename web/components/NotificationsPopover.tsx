"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  Check,
  Calendar,
  Dumbbell,
  Activity,
  MessageCircle,
  Clock,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { hu, sk, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPopover() {
  const t = useTranslations("Notifications");
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isSetupRef = useRef(false);

  const getLocale = () => {
    switch (locale) {
      case "hu":
        return hu;
      case "sk":
        return sk;
      default:
        return enUS;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (user) {
        setCurrentUserId(user.id);
        await fetchNotifications(user.id);

        if (!isSetupRef.current) {
          setupRealtimeChannel(user.id);
          isSetupRef.current = true;
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (channelRef.current) {

        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Blokkoljuk az oldal görgetését mobilon, ha nyitva van a teljes képernyős panel
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function fetchNotifications(userId: string) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
    setLoading(false);
  }

  function setupRealtimeChannel(userId: string) {
    if (channelRef.current) {

      return;
    }

    const channel = supabase.channel(`notifications-${userId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {

        const newNotification = payload.new as Notification;

        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotification.id)) return prev;
          return [newNotification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);

        toast.info(newNotification.title, {
          description: newNotification.message,
          duration: 5000,
        });
      },
    );

    channel.subscribe((status) => {

    });

    channelRef.current = channel;
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
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      setUnreadCount(0);
      toast.success(t("markAllRead"));
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "workout_reminder":
        return <Dumbbell className="h-4 w-4" />;
      case "measurement_reminder":
        return <Activity className="h-4 w-4" />;
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      case "appointment":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "workout_reminder":
        return "text-emerald-500 bg-emerald-50";
      case "measurement_reminder":
        return "text-blue-500 bg-blue-50";
      case "message":
        return "text-indigo-500 bg-indigo-50";
      case "appointment":
        return "text-amber-500 bg-amber-50";
      default:
        return "text-slate-500 bg-slate-50";
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            // Fix elrendezés mobilon, abszolút pozíció és térköz desktopon
            "fixed inset-0 pt-16 z-[200] bg-white flex flex-col",
            "sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:pt-0 sm:w-96 sm:h-auto sm:max-h-[500px]",
            "sm:rounded-2xl sm:shadow-xl sm:border sm:border-slate-100",
          )}
        >
          {/* Fejléc */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-sm">
                {t("title")}
              </h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 p-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">{t("markAllRead")}</span>
                </button>
              )}
              {/* Bezárás gomb kizárólag mobilon */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg sm:hidden transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Értesítések lista görgethető területe */}
          <div className="flex-1 overflow-y-auto bg-white sm:max-h-[400px]">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-100 border-t-indigo-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Bell className="h-8 w-8 mx-auto mb-3 opacity-20 text-slate-900" />
                <p className="text-sm font-medium">{t("noNotifications")}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3",
                      !notification.is_read ? "bg-indigo-50/10" : "",
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      // Mobilon elrejtjük a panelt kattintás után a jobb UX érdekében
                      if (window.innerWidth < 640) setIsOpen(false);
                    }}
                  >
                    <div
                      className={`p-2 rounded-xl h-9 w-9 flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800 tracking-tight leading-snug break-words">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed break-words line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 pt-1 text-[10px] font-bold text-slate-400">
                        <Clock className="h-3 w-3" />
                        {format(
                          new Date(notification.created_at),
                          "MMM dd, HH:mm",
                          { locale: getLocale() },
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
