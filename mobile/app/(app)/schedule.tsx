import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Linking,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  subscribeToLanguageChange,
  getCurrentLanguage,
} from "../../services/i18n";

interface Appointment {
  id: string;
  title: string;
  description: string|null;
  start_time: string;
  end_time: string;
  location: string|null;
  meeting_link: string|null;
  type: "workout"|"consultation"|"measurement"|"other";
  status: string;
}

export default function ScheduleScreen() {
  const [appointments, setAppointments]=useState<Appointment[]>([]);
  const [loading, setLoading]=useState(true);
  const [refreshing, setRefreshing]=useState(false);
  const [selectedTab, setSelectedTab]=useState<"upcoming"|"past">(
    "upcoming",
  );
  const [error, setError]=useState<string|null>(null);
  const [realtimeConnected, setRealtimeConnected]=useState(false);
  const [currentLang, setCurrentLang]=useState(getCurrentLanguage());

  const subscriptionRef=useRef<any>(null);
  const userIdRef=useRef<string|null>(null);

  const fetchAppointments=React.useCallback(async function() {

    const userId=userIdRef.current;
    if (!userId) {

      return;
    }

    return Promise.resolve(supabase
      .from("appointments")
      .select("*")
      .eq("client_id", userId)
      .order("start_time", { ascending: true })).then(async (loaded) => {
        const { data, error }=loaded;


        if (error) throw error;

        setAppointments(data||[]);
        setError(null);

      }).catch(async (error: any) => {
        console.error("❌ Hiba a lekéréskor:", error);
        setError(error.message||t("errors:generic"));
      }).finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  const setupRealtimeSubscription=React.useCallback(function() {
    const userId=userIdRef.current;
    if (!userId) {

      return;
    }

    if (subscriptionRef.current) {

      subscriptionRef.current.unsubscribe();
      subscriptionRef.current=null;
    }


    const channel=supabase
      .channel(`appointments-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `client_id=eq.${userId}`,
        },
        async (payload) => {

          fetchAppointments();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `client_id=eq.${userId}`,
        },
        (payload) => {

          fetchAppointments();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "appointments",
          filter: `client_id=eq.${userId}`,
        },
        (payload) => {

          fetchAppointments();
        },
      );

    channel.subscribe((status) => {

      if (status==="SUBSCRIBED") {
        setRealtimeConnected(true);

      } else if (status==="CHANNEL_ERROR") {
        setRealtimeConnected(false);

      }
    });

    subscriptionRef.current=channel;
  }, [fetchAppointments]);

  const loadUserAndSetup=React.useCallback(async function() {
    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;


      if (user) {
        userIdRef.current=user.id;

        await fetchAppointments();
        setupRealtimeSubscription();
      } else {

        setLoading(false);
      }

    });
  }, [fetchAppointments, setupRealtimeSubscription]);

  const onRefresh=() => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getTypeIcon=(type: string): any => {
    switch (type) {
      case "workout":
        return "barbell-outline";
      case "consultation":
        return "chatbubble-outline";
      case "measurement":
        return "fitness-outline";
      default:
        return "calendar-outline";
    }
  };

  const getTypeLabel=(type: string) => {
    switch (type) {
      case "workout":
        return t("schedule:type.workout");
      case "consultation":
        return t("schedule:type.consultation");
      case "measurement":
        return t("schedule:type.measurement");
      default:
        return t("schedule:type.other");
    }
  };

  const getTypeColor=(type: string) => {
    switch (type) {
      case "workout":
        return "#38BDF8";
      case "consultation":
        return "#10B981";
      case "measurement":
        return "#F59E0B";
      default:
        return "#94A3B8";
    }
  };

  // EGYSZERŰSÍTETT STÁTUSZOK - nincs "teljesítve" és "lemaradva"
  const getStatusText=(appointment: Appointment) => {
    const now=new Date();
    const startTime=new Date(appointment.start_time);

    if (appointment.status==="cancelled")
      return t("schedule:status.cancelled");

    if (startTime<now) return t("schedule:status.past");

    const diffHours=(startTime.getTime()-now.getTime())/(1000*60*60);
    if (diffHours<24) return t("schedule:status.soon");

    return t("schedule:status.upcoming");
  };

  const getStatusColor=(appointment: Appointment) => {
    const now=new Date();
    const startTime=new Date(appointment.start_time);

    if (appointment.status==="cancelled") return "#EF4444";
    if (startTime<now) return "#64748B"; // múltbeli - szürke
    return "#10B981"; // jövőbeli - zöld
  };

  const openMeetingLink=async (link: string) => {
    try {
      const supported=await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert(t("errors:generic"), t("common:error"));
      }
    } catch (error) {
      Alert.alert(t("errors:generic"), t("common:error"));
    }
  };

  const formatDateLabel=(date: Date) => {
    const now=new Date();
    const isToday=date.toDateString()===now.toDateString();
    const isTomorrow=
      date.toDateString()===new Date(now.getTime()+86400000).toDateString();

    if (isToday) return t("common:today");
    if (isTomorrow) return t("common:tomorrow");

    const localeStr=
      currentLang==="hu"? "hu-HU":currentLang==="sk"? "sk-SK":"en-US";
    return date.toLocaleDateString(localeStr, {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime=(date: Date) => {
    const localeStr=
      currentLang==="hu"? "hu-HU":currentLang==="sk"? "sk-SK":"en-US";
    return date.toLocaleTimeString(localeStr, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  useEffect(() => {
    loadUserAndSetup();

    const unsubscribeLang=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current=null;
      }
      unsubscribeLang();
    };
  }, [loadUserAndSetup]);


  useFocusEffect(
    useCallback(() => {

      fetchAppointments();
    }, [fetchAppointments]),
  );

  const now=new Date();
  const upcomingAppointments=appointments.filter((a) => {
    if (a.status==="cancelled") return false;
    return new Date(a.start_time)>=now;
  });

  const pastAppointments=appointments.filter((a) => {
    if (a.status==="cancelled") return false;
    return new Date(a.start_time)<now;
  });

  const displayAppointments=
    selectedTab==="upcoming"? upcomingAppointments:pastAppointments;

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
        <View style={styles.header}>
          <View></View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab==="upcoming"&&styles.tabActive]}
            onPress={() => setSelectedTab("upcoming")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab==="upcoming"&&styles.tabTextActive,
              ]}
            >
              {t("schedule:upcoming")} ({upcomingAppointments.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab==="past"&&styles.tabActive]}
            onPress={() => setSelectedTab("past")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab==="past"&&styles.tabTextActive,
              ]}
            >
              {t("schedule:past")} ({pastAppointments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {displayAppointments.length===0? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={32} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>
              {selectedTab==="upcoming"
                ? t("schedule:noUpcoming")
                :t("schedule:noPast")}
            </Text>
            <Text style={styles.emptyText}>
              {selectedTab==="upcoming"
                ? t("schedule:noUpcomingDesc")
                :t("schedule:noPastDesc")}
            </Text>
          </View>
        ):(
          displayAppointments.map((appointment) => {
            const startDate=new Date(appointment.start_time);
            const endDate=new Date(appointment.end_time);
            const dateLabel=formatDateLabel(startDate);
            const timeLabel=formatTime(startDate);
            const endTimeLabel=appointment.end_time
              ? formatTime(endDate)
              :null;

            const status=getStatusText(appointment);
            const statusColor=getStatusColor(appointment);
            const typeColor=getTypeColor(appointment.type);

            const minutesUntilStart=
              (startDate.getTime()-now.getTime())/(1000*60);
            const withinOneHour=
              minutesUntilStart>0&&minutesUntilStart<=60;

            return (
              <View
                key={appointment.id}
                style={[
                  styles.eventCard,
                  withinOneHour&&styles.eventCardUrgent,
                ]}
              >
                {withinOneHour&&(
                  <View style={styles.urgentBadge}>
                    <Ionicons name="alarm" size={12} color="#090D16" />
                    <Text style={styles.urgentBadgeText}>
                      {t("schedule:status.soon")}
                    </Text>
                  </View>
                )}

                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.eventTypeBadge,
                      { backgroundColor: `${typeColor}08` },
                    ]}
                  >
                    <Ionicons
                      name={getTypeIcon(appointment.type)}
                      size={13}
                      color={typeColor}
                    />
                    <Text style={[styles.eventTypeText, { color: typeColor }]}>
                      {getTypeLabel(appointment.type)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${statusColor}08`,
                        borderColor: `${statusColor}20`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDotSmall,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {status}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{appointment.title}</Text>

                  {appointment.description&&(
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {appointment.description}
                    </Text>
                  )}

                  <View style={styles.eventMeta}>
                    <View style={styles.eventMetaItem}>
                      <Ionicons name="time-outline" size={14} color="#475569" />
                      <Text style={styles.eventMetaText}>
                        {dateLabel} • {timeLabel}
                        {endTimeLabel&&` - ${endTimeLabel}`}
                      </Text>
                    </View>

                    {appointment.location&&(
                      <View style={styles.eventMetaItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#475569"
                        />
                        <Text style={styles.eventMetaText} numberOfLines={1}>
                          {appointment.location}
                        </Text>
                      </View>
                    )}

                    {appointment.meeting_link&&(
                      <TouchableOpacity
                        style={styles.meetingLink}
                        onPress={() =>
                          openMeetingLink(appointment.meeting_link!)
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="videocam-outline"
                          size={14}
                          color="#38BDF8"
                        />
                        <Text
                          style={[
                            styles.eventMetaText,
                            { color: "#38BDF8", fontWeight: "600" },
                          ]}
                        >
                          {t("common:onlineMeeting")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
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
    paddingHorizontal: 24,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 4,
    fontWeight: "500",
  },
  realtimeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotGreen: {
    backgroundColor: "#10B981",
  },
  statusDotRed: {
    backgroundColor: "#EF4444",
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  realtimeStatusText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#111726",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "#182235",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.15)",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  tabTextActive: {
    color: "#F8FAFC",
    fontWeight: "700",
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
  eventCard: {
    backgroundColor: "#131C2E",
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1C2638",
    position: "relative",
  },
  eventCardUrgent: {
    borderColor: "#38BDF8",
    borderWidth: 1.5,
    backgroundColor: "rgba(56, 189, 248, 0.04)",
  },
  urgentBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#38BDF8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#090D16",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  eventTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  eventContent: {
    gap: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  eventDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1C2638",
  },
  eventMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  eventMetaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  meetingLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#38BDF8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#090D16",
    fontWeight: "700",
    fontSize: 14,
  },
});
