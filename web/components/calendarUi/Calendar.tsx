"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Trash2,
  Users,
  Plus,
  LayoutGrid,
  MapPin,
  Video,
  FileText,
  AlertCircle,
  CalendarDays,
  Dumbbell,
  MessageCircle,
  Stethoscope,
  Briefcase,
} from "lucide-react";

interface AppointmentType {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function Calendar() {
  const t = useTranslations("Calendar");
  const pathname = usePathname();
  const calendarRef = useRef<FullCalendar>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(
    null,
  );

  const locale = pathname?.split("/")[1] || "hu";

  const [formData, setFormData] = useState({
    client_id: "",
    title: "",
    description: "",
    type: "consultation",
    start_time: "",
    end_time: "",
    location: "",
    meeting_link: "",
    notes: "",
  });

  const appointmentTypes: AppointmentType[] = [
    {
      value: "workout",
      label: t("typeWorkout"),
      icon: <Dumbbell className="h-4 w-4" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      value: "consultation",
      label: t("typeConsultation"),
      icon: <MessageCircle className="h-4 w-4" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      value: "measurement",
      label: t("typeMeasurement"),
      icon: <Stethoscope className="h-4 w-4" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      value: "other",
      label: t("typeOther"),
      icon: <Briefcase className="h-4 w-4" />,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
    },
  ];

  // A naptár ablakméret-változás követése és kényszerített újratöltése (updateSize)
  useEffect(() => {
    const handleResize = () => {
      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) return;

      if (window.innerWidth < 768) {
        if (calendarApi.view.type !== "timeGridDay") {
          calendarApi.changeView("timeGridDay");
        }
      } else {
        if (calendarApi.view.type !== "timeGridWeek") {
          calendarApi.changeView("timeGridWeek");
        }
      }
      // Kényszerítjük a FullCalendar-t, hogy számolja újra a belső szélességeket
      calendarApi.updateSize();
    };

    window.addEventListener("resize", handleResize);
    // Egy apró timeout-ot adunk az első rendereléshez, hogy a szülő konténer szélessége már biztosan fix legyen
    const timer = setTimeout(() => {
      handleResize();
    }, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const fetchAppointments = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("appointments")
      .select(`*, client:client_id (full_name, email)`)
      .eq("coach_id", user.id);
    if (!error && data) setAppointments(data);
  }, []);

  const fetchClients = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("clients")
      .select("id, full_name, email")
      .eq("coach_id", user.id)
      .eq("status", "active");
    if (!error && data) setClients(data);
  }, []);

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchClients()]).then(() =>
      setLoading(false),
    );
  }, [fetchAppointments, fetchClients]);

  const formatForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedAppointment(null);
    setShowConfirmDelete(false);
    setFormData({
      client_id: "",
      title: "",
      description: "",
      type: "consultation",
      start_time: formatForInput(selectInfo.startStr),
      end_time: formatForInput(selectInfo.endStr),
      location: "",
      meeting_link: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const app = appointments.find((a) => a.id === clickInfo.event.id);
    if (app) {
      setSelectedAppointment(app);
      setShowConfirmDelete(false);
      setFormData({
        client_id: app.client_id,
        title: app.title,
        description: app.description || "",
        type: app.type || "consultation",
        start_time: formatForInput(app.start_time),
        end_time: formatForInput(app.end_time),
        location: app.location || "",
        meeting_link: app.meeting_link || "",
        notes: app.notes || "",
      });
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      ...formData,
      coach_id: user.id,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
    };

    const { error } = selectedAppointment
      ? await supabase
          .from("appointments")
          .update(payload)
          .eq("id", selectedAppointment.id)
      : await supabase.from("appointments").insert([payload]);

    if (!error) {
      toast.success(t("saveSuccess"));
      setIsDialogOpen(false);
      fetchAppointments();
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", selectedAppointment.id);
    if (!error) {
      toast.success(t("deleteSuccess"));
      setIsDialogOpen(false);
      fetchAppointments();
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "workout":
        return { bg: "#ecfdf5", border: "#10b981", text: "#065f46" };
      case "consultation":
        return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" };
      case "measurement":
        return { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8" };
      default:
        return { bg: "#f8fafc", border: "#64748b", text: "#334155" };
    }
  };

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center animate-pulse text-slate-400 font-bold">
        {t("loading")}
      </div>
    );

  return (
    <div className="w-full max-w-[1400px] mx-auto p-2 md:p-6 space-y-4 font-sans Box-sizing-fix">
      <style jsx global>{`
        .fc {
          --fc-border-color: #f1f5f9;
          font-family: inherit;
          width: 100% !important; /* Kényszerített teljes szélesség */
          max-width: 100% !important;
        }
        /* Megoldja, hogy a belső asztalok ne nyúljanak túl a naptár szülőjén */
        .fc-view-harness,
        .fc-view {
          width: 100% !important;
        }
        .fc .fc-toolbar-title {
          font-size: 0.95rem !important;
          font-weight: 900;
          color: #0f172a;
        }
        .fc .fc-button {
          background: #fff !important;
          border: 1px solid #e2e8f0 !important;
          color: #64748b !important;
          border-radius: 8px !important;
          font-weight: 700 !important;
          font-size: 0.7rem !important;
          padding: 4px 8px !important;
          text-transform: capitalize !important;
        }
        @media (min-width: 768px) {
          .fc .fc-toolbar-title {
            font-size: 1.2rem !important;
          }
          .fc .fc-button {
            padding: 8px 14px !important;
            font-size: 0.8rem !important;
            border-radius: 12px !important;
          }
        }
        .fc .fc-button-active {
          background: #6366f1 !important;
          border-color: #6366f1 !important;
          color: #fff !important;
        }
        .fc-v-event {
          border-radius: 8px !important;
          border: none !important;
          transition: all 0.2s;
        }
        .event-inner {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          width: 100%;
          overflow: hidden;
          padding: 4px 6px;
        }
        .event-type-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .event-time-label {
          font-weight: 700 !important;
          font-size: 0.6rem !important;
          flex-shrink: 0;
        }
        .event-title-label {
          font-weight: 800 !important;
          font-size: 0.65rem !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 768px) {
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 0.6rem;
            align-items: center;
          }
          .fc .fc-header-toolbar {
            margin-bottom: 1rem !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between px-2 mt-4 lg:mt-0">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {t("title")}
        </h1>
        <Button
          onClick={() => {
            setSelectedAppointment(null);
            setShowConfirmDelete(false);
            setIsDialogOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl md:rounded-2xl shadow-lg shadow-indigo-100 font-bold px-3 py-4 md:px-6 md:py-6 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5 md:mr-2" />
          <span className="hidden md:inline text-white">
            {t("newAppointment")}
          </span>
        </Button>
      </div>

      {/* A naptár konténeréből kivettük az overflow-hidden-t és adtunk neki egy fix flexbox feszítést */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 shadow-2xl p-2 md:p-8 w-full block clearfix">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
          locale={locale}
          selectable={true}
          nowIndicator={true}
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          contentHeight="auto" // Kényszerített dinamikus magasság az auto helyett
          handleWindowResize={true} // Automatikus belső méretezés figyelés bekapcsolása
          expandRows={true}
          events={appointments.map((app) => {
            const colors = getEventColor(app.type);
            return {
              id: app.id,
              title: app.client?.full_name || app.title,
              start: app.start_time,
              end: app.end_time,
              backgroundColor: colors.bg,
              borderColor: colors.border,
              textColor: colors.text,
              extendedProps: {
                type: app.type,
              },
            };
          })}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={(arg) => {
            const type = arg.event.extendedProps.type || "consultation";
            const typeIcon =
              appointmentTypes.find((t) => t.value === type)?.icon ||
              appointmentTypes[3].icon;
            return (
              <div className="event-inner">
                <span className="event-type-icon">{typeIcon}</span>
                <span className="event-time-label">{arg.timeText}</span>
                <span className="event-title-label">{arg.event.title}</span>
              </div>
            );
          }}
        />
      </div>

      {/* Modals... */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[94%] sm:max-w-[550px] p-0 overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border-none shadow-2xl transition-all max-h-[90vh] flex flex-col">
          {showConfirmDelete ? (
            <div className="p-6 md:p-10 flex flex-col items-center text-center space-y-6 md:space-y-8 bg-white overflow-y-auto">
              <div className="h-16 w-16 md:h-24 md:w-24 bg-rose-50 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 md:h-12 md:w-12 text-rose-500" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {t("deleteConfirmTitle")}
                </h3>
                <p className="text-sm md:text-base text-slate-500 font-semibold px-2 md:px-4 leading-relaxed">
                  {t("deleteConfirmDescription")}
                </p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmDelete(false)}
                  className="w-full py-5 md:py-7 rounded-2xl font-black text-slate-400 h-auto"
                >
                  {t("deleteCancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  className="w-full py-5 md:py-7 rounded-2xl font-black bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-100 transition-all h-auto"
                >
                  {t("deleteConfirm")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-indigo-600 p-5 md:p-10 text-white relative flex-shrink-0">
                <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                  <CalendarDays className="w-16 h-16 md:w-24 md:h-24" />
                </div>
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-lg md:text-2xl font-black tracking-tight leading-tight">
                    {selectedAppointment
                      ? t("editAppointment")
                      : t("newAppointment")}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-4 md:p-8 space-y-5 md:space-y-6 bg-white overflow-y-auto flex-1"
              >
                <div className="space-y-4 md:space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">
                      {t("selectClient")}
                    </Label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                      <select
                        value={formData.client_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            client_id: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-11 md:pl-14 pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 border-slate-50 bg-slate-50 text-xs md:text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">{t("selectClientPlaceholder")}</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                    {appointmentTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, type: type.value })
                        }
                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center flex-col md:flex-row ${
                          formData.type === type.value
                            ? `${type.bgColor} border-indigo-300 shadow-md`
                            : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className={
                            formData.type === type.value
                              ? type.color
                              : "text-slate-400"
                          }
                        >
                          {type.icon}
                        </span>
                        <span
                          className={`text-xs font-bold ${formData.type === type.value ? type.color : "text-slate-600"}`}
                        >
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">
                      {t("eventTitle")}
                    </Label>
                    <div className="relative group">
                      <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder={t("eventTitlePlaceholder")}
                        required
                        className="pl-11 md:pl-14 py-5 md:py-6 rounded-xl md:rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-xs md:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">
                        {t("start")}
                      </Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_time: e.target.value,
                          })
                        }
                        className="rounded-xl md:rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold py-5 md:py-6 px-4 text-xs md:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">
                        {t("end")}
                      </Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) =>
                          setFormData({ ...formData, end_time: e.target.value })
                        }
                        className="rounded-xl md:rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold py-5 md:py-6 px-4 text-xs md:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder={t("location")}
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="pl-10 md:pl-11 rounded-xl border-2 border-slate-50 bg-slate-50 font-bold text-xs md:text-sm py-5 md:py-6"
                      />
                    </div>
                    <div className="relative group">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder={t("onlineLink")}
                        value={formData.meeting_link}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            meeting_link: e.target.value,
                          })
                        }
                        className="pl-10 md:pl-11 rounded-xl border-2 border-slate-50 bg-slate-50 font-bold text-xs md:text-sm py-5 md:py-6"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 ml-1">
                      {t("extraNotes")}
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-4 md:left-5 top-4 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                      <Textarea
                        placeholder={t("extraNotesPlaceholder")}
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="pl-11 md:pl-14 rounded-xl md:rounded-2xl border-2 border-slate-50 bg-slate-50 font-medium text-xs md:text-sm min-h-[70px] md:min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                  {selectedAppointment && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowConfirmDelete(true)}
                      className="text-rose-500 hover:bg-rose-50 rounded-xl h-12 w-full sm:w-12 p-0 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sm:hidden ml-2 font-black">
                        {t("delete")}
                      </span>
                    </Button>
                  )}
                  <div className="flex gap-3 w-full ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsDialogOpen(false)}
                      className="rounded-xl md:rounded-2xl font-black text-slate-400 flex-1 h-12"
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 rounded-xl md:rounded-2xl font-black text-white shadow-xl flex-[2] h-12 transition-all active:scale-95"
                    >
                      {t("save")}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
