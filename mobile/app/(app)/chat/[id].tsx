import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { supabase } from "../../../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  isSameDay,
  isToday,
  isYesterday,
  differenceInMinutes,
} from "date-fns";
import { hu, sk, enUS } from "date-fns/locale";
import {
  t,
  getCurrentLanguage,
  subscribeToLanguageChange,
} from "../../../services/i18n";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Üzenet típusa a dátummal együtt
interface MessageItem {
  id: string;
  type: "message"|"dateSeparator";
  message?: Message;
  date?: Date;
  dateText?: string;
}

export default function ChatDetailScreen() {
  const { id, name }=useLocalSearchParams<{ id: string; name: string }>();
  const [messages, setMessages]=useState<Message[]>([]);
  const [messageItems, setMessageItems]=useState<MessageItem[]>([]);
  const [newMessage, setNewMessage]=useState("");
  const [loading, setLoading]=useState(true);
  const [sending, setSending]=useState(false);
  const [currentUserId, setCurrentUserId]=useState<string|null>(null);
  const flatListRef=useRef<FlatList>(null);
  const subscriptionRef=useRef<any>(null);
  const [showScrollButton, setShowScrollButton]=useState(false);
  const [currentLang, setCurrentLang]=useState(getCurrentLanguage());

  const coachId=id;
  const coachName=decodeURIComponent(name||t("chat:coach"));

  // Dátum formázáshoz a megfelelő locale kiválasztása
  const getDateLocale=React.useCallback(() => {
    switch (currentLang) {
      case "hu":
        return hu;
      case "sk":
        return sk;
      default:
        return enUS;
    }
  }, [currentLang]);

  const buildMessageItems=React.useCallback((messagesList: Message[]) => {
    const items: MessageItem[]=[];
    let lastDate: Date|null=null;
    const locale=getDateLocale();

    messagesList.forEach((message) => {
      const messageDate=new Date(message.created_at);

      // Dátum elválasztó hozzáadása, ha új nap
      if (!lastDate||!isSameDay(lastDate, messageDate)) {
        let dateText="";
        if (isToday(messageDate)) {
          dateText=t("chat:today");
        } else if (isYesterday(messageDate)) {
          dateText=t("chat:yesterday");
        } else {
          dateText=format(messageDate, "yyyy. MMMM dd.", { locale });
        }

        items.push({
          id: `date-${messageDate.toISOString().split("T")[0]}`,
          type: "dateSeparator",
          date: messageDate,
          dateText,
        });
        lastDate=messageDate;
      }

      // Üzenet hozzáadása
      items.push({
        id: message.id,
        type: "message",
        message,
      });
    });

    return items;
  }, [getDateLocale]);

  const fetchCurrentUser=React.useCallback(async function() {
    return Promise.resolve(supabase.auth.getUser()).then(async (loaded) => {
      const {
        data: { user },
      }=loaded;

      if (user) {
        setCurrentUserId(user.id);
      }
      setLoading(false);

    });
  }, []);

  const fetchMessages=React.useCallback(async function() {
    if (!currentUserId||!coachId) return;

    return Promise.resolve(supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${coachId}),and(sender_id.eq.${coachId},receiver_id.eq.${currentUserId})`,
      )
      .order("created_at", { ascending: true })).then(async (loaded) => {
        const { data, error }=loaded;


        if (error) {
          console.error("Hiba az üzenetek lekérésekor:", error);
        } else if (data) {
          setMessages(data);
          setMessageItems(buildMessageItems(data));

          // Olvasottnak jelöljük az edzőtől kapott üzeneteket
          const unreadMessages=data.filter(
            (m) => m.sender_id===coachId&&!m.is_read,
          );

          if (unreadMessages.length>0) {
            await supabase
              .from("messages")
              .update({ is_read: true, read_at: new Date().toISOString() })
              .in(
                "id",
                unreadMessages.map((m) => m.id),
              );
          }

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }

      });
  }, [currentUserId, coachId, buildMessageItems]);

  const setupRealtimeSubscription=React.useCallback(function() {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const channel=supabase
      .channel(`chat-${currentUserId}-${coachId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg=payload.new as Message;
          setMessages((prev) => {
            const updated=[...prev, newMsg];
            setMessageItems(buildMessageItems(updated));
            return updated;
          });
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMsg=payload.new as Message;
          setMessages((prev) => {
            const updated=[...prev, newMsg];
            setMessageItems(buildMessageItems(updated));
            return updated;
          });
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            100,
          );
        },
      )
      .subscribe();

    subscriptionRef.current=channel;
  }, [currentUserId, coachId, buildMessageItems]);

  // Üzenetek + dátum elválasztók összeállítása

  async function handleSendMessage() {
    if (!newMessage.trim()||sending||!currentUserId) return;

    setSending(true);
    const messageText=newMessage.trim();

    const { error }=await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: coachId,
      message: messageText,
      is_read: false,
    });

    if (error) {
      console.error("Hiba üzenet küldésekor:", error);
    } else {
      setNewMessage("");
    }
    setSending(false);
  }

  // Üzenet időformázása
  const formatMessageTime=(date: Date) => {
    const now=new Date();
    const diffMinutes=differenceInMinutes(now, date);
    const locale=getDateLocale();

    if (diffMinutes<1) {
      return t("chat:justNow");
    } else if (diffMinutes<60) {
      return t("chat:minutesAgo", { count: diffMinutes });
    } else {
      return format(date, "HH:mm", { locale });
    }
  };

  // Üzenet megjelenítése
  const renderItem=({ item }: { item: MessageItem }) => {
    if (item.type==="dateSeparator") {
      return (
        <View style={styles.dateSeparatorContainer}>
          <View style={styles.dateSeparatorLine} />
          <Text style={styles.dateSeparatorText}>{item.dateText}</Text>
          <View style={styles.dateSeparatorLine} />
        </View>
      );
    }

    const message=item.message!;
    const isOwn=message.sender_id===currentUserId;
    const messageDate=new Date(message.created_at);
    const timeText=formatMessageTime(messageDate);

    return (
      <View
        style={[styles.messageRow, isOwn? styles.ownRow:styles.otherRow]}
      >
        {!isOwn&&(
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {coachName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isOwn? styles.ownBubble:styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwn? styles.ownText:styles.otherText,
            ]}
          >
            {message.message}
          </Text>
          <Text
            style={[styles.timeText, isOwn? styles.ownTime:styles.otherTime]}
          >
            {timeText}
            {isOwn&&message.is_read&&<Text> ✓✓</Text>}
          </Text>
        </View>
      </View>
    );
  };

  const scrollToBottom=() => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
  };

  const onScroll=(event: any) => {
    const offsetY=event.nativeEvent.contentOffset.y;
    const contentHeight=event.nativeEvent.contentSize.height;
    const layoutHeight=event.nativeEvent.layoutMeasurement.height;
    const isNearBottom=contentHeight-offsetY-layoutHeight<100;
    setShowScrollButton(!isNearBottom);
  };


  useEffect(() => {
    fetchCurrentUser();

    const unsubscribe=subscribeToLanguageChange((lang) => {
      setCurrentLang(lang);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      unsubscribe();
    };
  }, [fetchCurrentUser]);


  useEffect(() => {
    if (currentUserId&&coachId) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [currentUserId, coachId, fetchMessages, setupRealtimeSubscription]);

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
      <Stack.Screen
        options={{
          title: coachName,
          headerTitleStyle: { color: "#F8FAFC", fontWeight: "600" },
          headerStyle: { backgroundColor: "#090D16" },
          headerTintColor: "#38BDF8",
          headerBackTitle: t("common:back"),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS==="ios"? "padding":undefined}
        keyboardVerticalOffset={Platform.OS==="ios"? 90:0}
      >
        <FlatList
          ref={flatListRef}
          data={messageItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />

        {/* Gomb a legutolsó üzenethez görgetéshez */}
        {showScrollButton&&(
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={scrollToBottom}
          >
            <Ionicons name="arrow-down" size={20} color="#38BDF8" />
          </TouchableOpacity>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={t("chat:placeholder")}
              placeholderTextColor="#64748B"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim()||sending)&&styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()||sending}
            >
              <Ionicons
                name="send"
                size={20}
                color={newMessage.trim()? "#38BDF8":"#475569"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090D16",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  // Dátum elválasztó
  dateSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1E293B",
  },
  dateSeparatorText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginHorizontal: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#131C2E",
    borderRadius: 12,
    overflow: "hidden",
  },
  // Üzenet sorok
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  ownRow: {
    justifyContent: "flex-end",
  },
  otherRow: {
    justifyContent: "flex-start",
  },
  // Avatar hely (messenger stílus)
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#090D16",
  },
  // Buborékok
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: "#38BDF8",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#1E293B",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: "#090D16",
  },
  otherText: {
    color: "#F8FAFC",
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  ownTime: {
    color: "rgba(9, 13, 22, 0.6)",
    textAlign: "right",
  },
  otherTime: {
    color: "#64748B",
  },
  // Input rész
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
    backgroundColor: "#090D16",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#131C2E",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#F8FAFC",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  scrollButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#131C2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
