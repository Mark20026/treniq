"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Send, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatProps {
  clientId: string;
  clientName: string;
  coachId: string;
  coachName: string;
}

export default function Chat({
  clientId,
  clientName,
  coachId,
  coachName,
}: ChatProps) {
  const t = useTranslations("Chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
      subscribeToMessages();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [currentUserId, clientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function fetchMessages() {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${clientId}),and(sender_id.eq.${clientId},receiver_id.eq.${currentUserId})`,
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Hiba az üzenetek lekérésekor:", error);
      toast.error(t("loadError"));
    } else if (data) {
      setMessages(data);

      const unreadMessages = data.filter(
        (m) => m.sender_id === clientId && !m.is_read,
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in(
            "id",
            unreadMessages.map((m) => m.id),
          );
      }
    }
    setLoading(false);
  }

  function subscribeToMessages() {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`chat-${clientId}-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (!prev.some((m) => m.id === payload.new.id)) {
              return [...prev, payload.new as Message];
            }
            return prev;
          });
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
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (!prev.some((m) => m.id === newMsg.id)) {
              return [...prev, newMsg];
            }
            return prev;
          });
        },
      )
      .subscribe();

    subscriptionRef.current = channel;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !currentUserId) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: clientId,
      message: newMessage.trim(),
      is_read: false,
    });

    if (error) {
      toast.error(t("sendError") + error.message);
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    /* 🔥 MEGOLDVA: Levettük a pt-16-ot, mert a szülő oldal (Page) már eltolja a komponenst! */
    <div className="w-full">
      <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[580px] bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {/* Chat partner fejléce */}
        <div className="flex items-center gap-3 p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/40 shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm sm:text-base shadow-sm shrink-0">
            {clientName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-slate-800 truncate">
              {clientName}
            </h3>
            <p className="text-[10px] sm:text-xs font-medium text-slate-400">
              {messages.length} {t("messages")}
            </p>
          </div>
        </div>

        {/* Üzenetek belsőleg görgethető listája */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/10">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-slate-400 px-4">
              <User className="h-10 w-10 mx-auto mb-3 opacity-25 text-indigo-500" />
              <p className="text-sm font-bold text-slate-600">
                {t("noMessages")}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t("startConversation")}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in fade-in-50 duration-200`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm text-sm ${
                      isOwn
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                    }`}
                  >
                    <p className="leading-relaxed break-words whitespace-pre-wrap font-medium">
                      {message.message}
                    </p>
                    <div
                      className={`text-[9px] font-bold mt-1 flex items-center justify-end gap-1 ${
                        isOwn ? "text-indigo-200" : "text-slate-400"
                      }`}
                    >
                      <span>
                        {format(
                          new Date(message.created_at),
                          "HH:mm • MMM dd",
                          {
                            locale: hu,
                          },
                        )}
                      </span>
                      {isOwn && (
                        <span
                          className={`text-[11px] font-black ${message.is_read ? "text-emerald-300" : "opacity-40"}`}
                        >
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Üzenetküldő form - Mindig a doboz aljára tapad a flex-col + flex-1 elrendezés miatt */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 border-t border-slate-100 bg-white shrink-0"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 h-11 px-4 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="h-11 w-11 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-100 disabled:text-indigo-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-md active:scale-95 shrink-0"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
