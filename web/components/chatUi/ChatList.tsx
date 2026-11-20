"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { MessageCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";

interface Conversation {
  clientId: string;
  clientName: string;
  clientEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function ChatList() {
  const t = useTranslations("ChatList");
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    fetchCoachAndConversations();
  }, []);

  async function fetchCoachAndConversations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    setCoachId(user.id);
    await fetchConversations(user.id);
  }

  async function fetchConversations(coachId: string) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, full_name, email")
      .eq("coach_id", coachId);

    if (!clients || clients.length === 0) {
      setLoading(false);
      return;
    }

    const conversationsData: Conversation[] = [];

    for (const client of clients) {
      const { data: messages } = await supabase
        .from("messages")
        .select("message, created_at, is_read, sender_id")
        .or(
          `and(sender_id.eq.${coachId},receiver_id.eq.${client.id}),and(sender_id.eq.${client.id},receiver_id.eq.${coachId})`,
        )
        .order("created_at", { ascending: false })
        .limit(1);

      if (messages && messages.length > 0) {
        const lastMessage = messages[0];

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", client.id)
          .eq("receiver_id", coachId)
          .eq("is_read", false);

        conversationsData.push({
          clientId: client.id,
          clientName: client.full_name,
          clientEmail: client.email || "",
          lastMessage: lastMessage.message,
          lastMessageAt: lastMessage.created_at,
          unreadCount: unreadCount || 0,
        });
      } else {
        conversationsData.push({
          clientId: client.id,
          clientName: client.full_name,
          clientEmail: client.email || "",
          lastMessage: t("noMessages"),
          lastMessageAt: new Date(0).toISOString(),
          unreadCount: 0,
        });
      }
    }

    conversationsData.sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );

    setConversations(conversationsData);
    setLoading(false);
  }

  const openChat = (clientId: string) => {
    router.push(`/${locale}/chat/${clientId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 pt-24 sm:pt-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      /* 🔥 MEGOLDVA: pt-20 mobilon a fix navbar elkerülésére */
      <div className="text-center py-16 px-5 pt-20 sm:pt-16 border-2 border-dashed border-slate-100 rounded-3xl bg-white">
        <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <MessageCircle className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-700">
          {t("noConversations")}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
          {t("noConversationsDescription")}
        </p>
      </div>
    );
  }

  return (
    /* 🔥 MEGOLDVA: pt-16 mobilon, hogy a rögzített menüsor ne takarja ki a listát */
    <div className="space-y-4 pt-16 sm:pt-0">
      {/* Lista fejléc */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <MessageCircle className="h-5 w-5 text-indigo-500" />
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          {t("messages")}
        </h2>
      </div>

      {/* Beszélgetések listája */}
      <div className="space-y-2.5">
        {conversations.map((conv) => {
          const hasMessages = new Date(conv.lastMessageAt).getTime() > 0;

          return (
            <Card
              key={conv.clientId}
              className="cursor-pointer border-slate-100 hover:shadow-md transition-all active:scale-[0.99] hover:border-indigo-100 rounded-2xl overflow-hidden bg-white"
              onClick={() => openChat(conv.clientId)}
            >
              <CardContent className="p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Profil avatar */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                        {conv.clientName.charAt(0).toUpperCase()}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Szövegek elrendezése */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <h3 className="font-bold text-sm sm:text-base text-slate-800 truncate">
                          {conv.clientName}
                        </h3>

                        {hasMessages && (
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 shrink-0">
                            {format(
                              new Date(conv.lastMessageAt),
                              "MMM dd, HH:mm",
                              {
                                locale: hu,
                              },
                            )}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs sm:text-sm truncate ${conv.unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-500 font-medium"}`}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>

                  {/* Nyíl ikon */}
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
