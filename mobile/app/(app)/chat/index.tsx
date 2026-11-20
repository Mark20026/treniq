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
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";

interface Conversation {
  coachId: string;
  coachName: string;
  coachEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function ChatListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(() => {
    fetchClientAndConversations();

    const unsubscribe = subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchClientAndConversations();
    }, []),
  );

  async function fetchClientAndConversations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setClientId(user.id);
    await fetchConversations(user.id);
  }

  async function fetchConversations(clientId: string) {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("coach_id")
        .eq("id", clientId)
        .single();

      if (clientError || !clientData) {

        setLoading(false);
        return;
      }

      const coachId = clientData.coach_id;

      const { data: coachData } = await supabase
        .from("coach_profiles")
        .select("id, full_name, email")
        .eq("id", coachId)
        .single();

      if (!coachData) {
        setLoading(false);
        return;
      }

      const { data: messages } = await supabase
        .from("messages")
        .select("message, created_at, is_read, sender_id")
        .or(
          `and(sender_id.eq.${clientId},receiver_id.eq.${coachId}),and(sender_id.eq.${coachId},receiver_id.eq.${clientId})`,
        )
        .order("created_at", { ascending: false })
        .limit(1);

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", coachId)
        .eq("receiver_id", clientId)
        .eq("is_read", false);

      let lastMessage = t("chat:noMessages");
      let lastMessageAt = new Date().toISOString();

      if (messages && messages.length > 0) {
        lastMessage = messages[0].message;
        lastMessageAt = messages[0].created_at;
      }

      setConversations([
        {
          coachId: coachData.id,
          coachName: coachData.full_name,
          coachEmail: coachData.email || "",
          lastMessage: lastMessage,
          lastMessageAt: lastMessageAt,
          unreadCount: unreadCount || 0,
        },
      ]);
    } catch (error) {
      console.error("Hiba a beszélgetések betöltésekor:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    if (clientId) fetchConversations(clientId);
  };

  const openChat = (coachId: string, coachName: string) => {
    router.push(`/(app)/chat/${coachId}?name=${encodeURIComponent(coachName)}`);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    const localeStr =
      currentLang === "hu" ? "hu-HU" : currentLang === "sk" ? "sk-SK" : "en-US";

    if (diffDays === 0) {
      return date.toLocaleTimeString(localeStr, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return t("chat:yesterday");
    } else if (diffDays < 7) {
      return date.toLocaleDateString(localeStr, { weekday: "short" });
    } else {
      return date.toLocaleDateString(localeStr, {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubble-outline" size={32} color="#475569" />
          </View>
          <Text style={styles.emptyTitle}>{t("chat:noMessages")}</Text>
          <Text style={styles.emptyText}>{t("chat:startConversation")}</Text>
        </View>
      </SafeAreaView>
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
        <View style={styles.header}></View>

        {conversations.map((conv) => {
          const hasUnread = conv.unreadCount > 0;

          return (
            <TouchableOpacity
              key={conv.coachId}
              style={styles.conversationCard}
              onPress={() => openChat(conv.coachId, conv.coachName)}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {conv.coachName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.coachName} numberOfLines={1}>
                      {conv.coachName}
                    </Text>
                    <Text
                      style={[
                        styles.timeText,
                        hasUnread && styles.timeTextUnread,
                      ]}
                    >
                      {formatTime(conv.lastMessageAt)}
                    </Text>
                  </View>

                  <View style={styles.messageRow}>
                    <Text
                      style={[
                        styles.lastMessage,
                        hasUnread && styles.lastMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {conv.lastMessage}
                    </Text>
                    {hasUnread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#334155"
                  style={styles.chevron}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  conversationCard: {
    backgroundColor: "#131C2E",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1C2638",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#111726",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#38BDF8",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  coachName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F8FAFC",
    maxWidth: "75%",
  },
  timeText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "500",
  },
  timeTextUnread: {
    color: "#38BDF8",
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  lastMessage: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  lastMessageUnread: {
    color: "#F8FAFC",
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: "#38BDF8",
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    color: "#090D16",
    fontSize: 10,
    fontWeight: "800",
  },
  chevron: {
    marginLeft: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#131C2E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1C2638",
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
});
