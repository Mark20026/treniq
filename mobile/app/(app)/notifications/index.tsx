import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";
import { format } from "date-fns";
import { hu, sk, enUS } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications]=useState<Notification[]>([]);
  const [loading, setLoading]=useState(true);
  const [refreshing, setRefreshing]=useState(false);
  const [filter, setFilter]=useState<"all"|"unread"|"read">("all");
  const [currentLang, setCurrentLang]=useState(getCurrentLanguage());

  const fetchNotifications=React.useCallback(async function() {

    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error }=await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data||[]);

    }).catch(async (error) => {
      console.error("Hiba az értesítések betöltésekor:", error);
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, []);

  const onRefresh=() => {
    setRefreshing(true);
    fetchNotifications();
  };

  async function markAsRead(notificationId: string) {
    try {
      const { error }=await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id===notificationId? { ...n, is_read: true }:n,
        ),
      );
    } catch (error) {
      console.error("Hiba az értesítés olvasottá jelölésekor:", error);
    }
  }

  async function markAllAsRead() {
    const unreadIds=notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length===0) return;

    try {
      const { error }=await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Hiba az összes értesítés olvasottá jelölésekor:", error);
    }
  }

  async function deleteNotification(notificationId: string) {
    Alert.alert(
      "Értesítés törlése",
      "Biztosan törölni szeretnéd ezt az értesítést?",
      [
        { text: "Mégse", style: "cancel" },
        {
          text: "Törlés",
          style: "destructive",
          onPress: async () => {
            try {
              const { error }=await supabase
                .from("notifications")
                .delete()
                .eq("id", notificationId);

              if (error) throw error;

              setNotifications((prev) =>
                prev.filter((n) => n.id!==notificationId),
              );
            } catch (error) {
              console.error("Hiba az értesítés törlésekor:", error);
            }
          },
        },
      ],
    );
  }

  const getIcon=(type: string): any => {
    switch (type) {
      case "workout_reminder":
        return "barbell-outline";
      case "measurement_reminder":
        return "fitness-outline";
      case "message":
        return "chatbubble-outline";
      case "appointment":
        return "calendar-outline";
      case "goal_achieved":
        return "trophy-outline";
      case "payment_due":
        return "card-outline";
      default:
        return "notifications-outline";
    }
  };

  const getIconColor=(type: string) => {
    switch (type) {
      case "workout_reminder":
        return "#38BDF8";
      case "measurement_reminder":
        return "#10B981";
      case "message":
        return "#8B5CF6";
      case "appointment":
        return "#F59E0B";
      case "goal_achieved":
        return "#F472B6";
      case "payment_due":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  const getTypeLabel=(type: string) => {
    switch (type) {
      case "workout_reminder":
        return "Edzés emlékeztető";
      case "measurement_reminder":
        return "Mérés emlékeztető";
      case "message":
        return "Új üzenet";
      case "appointment":
        return "Időpont";
      case "goal_achieved":
        return "Cél elérve";
      case "payment_due":
        return "Fizetés esedékes";
      default:
        return "Értesítés";
    }
  };

  const formatDate=(dateStr: string) => {
    const date=new Date(dateStr);
    const now=new Date();
    const diffDays=Math.floor(
      (now.getTime()-date.getTime())/(1000*60*60*24),
    );

    const localeMap={
      hu: hu,
      sk: sk,
      en: enUS,
    };
    const locale=localeMap[currentLang as keyof typeof localeMap]||hu;

    if (diffDays===0) {
      return format(date, "HH:mm", { locale });
    } else if (diffDays===1) {
      return "Tegnap";
    } else if (diffDays<7) {
      return format(date, "EEEE", { locale });
    } else {
      return format(date, "yyyy. MMMM dd.", { locale });
    }
  };


  useEffect(() => {
    fetchNotifications();
    const unsubscribe=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });
    return () => unsubscribe();
  }, [fetchNotifications]);


  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const filteredNotifications=notifications.filter((n) => {
    if (filter==="unread") return !n.is_read;
    if (filter==="read") return n.is_read;
    return true;
  });

  const unreadCount=notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
      >
        {/* Fejléc */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>🔔 Értesítések</Text>
            {unreadCount>0&&(
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount>0&&(
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllText}>Összes olvasott</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Szűrők */}
        <View style={styles.filterContainer}>
          {["all", "unread", "read"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                filter===f&&styles.filterButtonActive,
              ]}
              onPress={() => setFilter(f as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter===f&&styles.filterTextActive,
                ]}
              >
                {f==="all"&&"Összes"}
                {f==="unread"&&
                  `Olvasatlan (${notifications.filter((n) => !n.is_read).length})`}
                {f==="read"&&"Olvasott"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Értesítések lista */}
        {filteredNotifications.length===0? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="notifications-off-outline"
                size={32}
                color="#475569"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {filter==="all"
                ? "Nincs értesítés"
                :filter==="unread"
                  ? "Nincs olvasatlan értesítés"
                  :"Nincs olvasott értesítés"}
            </Text>
            <Text style={styles.emptyText}>
              {filter==="all"
                ? "Még nem érkezett értesítés"
                :"Minden értesítés el lett olvasva"}
            </Text>
          </View>
        ):(
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.is_read&&styles.notificationCardUnread,
              ]}
              onPress={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getIconColor(notification.type)+"15" },
                  ]}
                >
                  <Ionicons
                    name={getIcon(notification.type)}
                    size={20}
                    color={getIconColor(notification.type)}
                  />
                </View>

                <View style={styles.notificationInfo}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    {!notification.is_read&&<View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>

                  <View style={styles.notificationFooter}>
                    <Text style={styles.notificationType}>
                      {getTypeLabel(notification.type)}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Ionicons name="close-outline" size={18} color="#475569" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  unreadBadge: {
    backgroundColor: "#38BDF8",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#090D16",
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#38BDF8",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#131C2E",
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  filterButtonActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  filterTextActive: {
    color: "#090D16",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#111726",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#182235",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
  },
  notificationCard: {
    backgroundColor: "#131C2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  notificationCardUnread: {
    borderColor: "rgba(56, 189, 248, 0.3)",
    backgroundColor: "rgba(56, 189, 248, 0.04)",
  },
  notificationContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38BDF8",
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationType: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
    backgroundColor: "#1C2638",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  notificationTime: {
    fontSize: 10,
    color: "#475569",
  },
  deleteButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
});
