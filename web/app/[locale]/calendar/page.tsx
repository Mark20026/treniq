"use client";

import Sidebar from "@/components/Navbar";
import Calendar from "@/components/calendarUi/Calendar";

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          <div className="mb-8"></div>
          <Calendar />
        </div>
      </main>
    </div>
  );
}
