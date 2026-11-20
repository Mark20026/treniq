"use client";

import Sidebar from "@/components/Navbar";
import ChatList from "@/components/chatUi/ChatList";

export default function ChatListPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          <ChatList />
        </div>
      </main>
    </div>
  );
}
