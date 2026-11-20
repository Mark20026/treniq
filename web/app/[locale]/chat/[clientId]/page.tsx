"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Navbar";
import Chat from "@/components/chatUi/Chat";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ChatDetailPage() {
  const t = useTranslations("ChatDetail");
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [client, setClient] = useState<{
    id: string;
    full_name: string;
  } | null>(null);
  const [coach, setCoach] = useState<{ id: string; full_name: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const locale = pathname?.split("/")[1] || "hu";

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const { data: coachData } = await supabase
      .from("coach_profiles")
      .select("id, full_name")
      .eq("id", user.id)
      .single();

    if (coachData) {
      setCoach(coachData);
    }

    const { data: clientData } = await supabase
      .from("clients")
      .select("id, full_name")
      .eq("id", params.clientId)
      .single();

    if (clientData) {
      setClient(clientData);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        {/* 🔥 MEGOLDVA: pt-16 mobilon a loading állapotnál is, hogy ne takarja ki a navbar */}
        <div className="flex-1 lg:ml-64 flex justify-center items-center pt-16 sm:pt-0">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!client || !coach) return null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* 🔥 MEGOLDVA: pt-16 biztosítja, hogy mobilon a fix navbar alá kerüljön az egész tartalom */}
      <main className="flex-1 lg:ml-64 pt-16 sm:pt-0">
        {/* 🔥 MEGOLDVA: Mobilon kisebb padding (p-4), nagyobb kijelzőkön p-6 és lg:p-10 */}
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10">
          {/* Vissza gomb - most már tökéletesen látható lesz a navbar alatt */}
          <Link
            href={`/${locale}/chat`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4 sm:mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {t("backToMessages")}
          </Link>

          {/* Chat felület */}
          <Chat
            clientId={client.id}
            clientName={client.full_name}
            coachId={coach.id}
            coachName={coach.full_name}
          />
        </div>
      </main>
    </div>
  );
}
