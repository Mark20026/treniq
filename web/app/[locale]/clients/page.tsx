"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Search,
  Edit,
  Mail,
  Phone,
  Calendar,
  UserPlus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AddClientDialog from "@/components/clientsUi/AddClientDialog";
import EditClientDialog from "@/components/clientsUi/EditClientDialog";

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

export default function ClientsPage() {
  const t = useTranslations("Clients");
  const router = useRouter();
  const pathname = usePathname();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [locale, setLocale] = useState("hu");

  useEffect(() => {
    const currentLocale = pathname?.split("/")[1] || "hu";
    setLocale(currentLocale);
  }, [pathname]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(
      (client) =>
        client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  async function fetchClients() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    setClients(data || []);
    setFilteredClients(data || []);
    setLoading(false);
  }

  const handleRowClick = (clientId: string) => {
    router.push(`/${locale}/clients/${clientId}`);
  };

  const handleViewDetails = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    router.push(`/${locale}/clients/${clientId}`);
  };

  const handleEditClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        {/* Itt is eltávolítottuk a felesleges md:ml-64-et */}
        <div className="flex-1 flex flex-col justify-center items-center gap-4 p-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50">
      <Sidebar />

      {/* A "md:ml-64" és "w-full" törlésre került, mert az új Sidebar Spacer-je
        már automatikusan kezeli a helyet asztali és mobil nézetben is!
      */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Címsor rész - Mobilon egymás alá rendeződik, jobb margók igazítása */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                {t("clientList")}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {t("clientListDescription")}
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <AddClientDialog onClientAdded={fetchClients} />
            </div>
          </div>

          <Card className="border-none shadow-[0_0_15px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-white/50 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-base md:text-lg">
                    {t("allClients")}
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {filteredClients.length} {t("registeredClients")}
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    className="pl-10 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all text-sm h-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12 md:py-20 px-4">
                  <div className="bg-slate-50 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="h-6 w-6 md:h-8 md:w-8 text-slate-300" />
                  </div>
                  <h3 className="text-base md:text-lg font-medium text-slate-900">
                    {t("noClients")}
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto mt-1">
                    {searchTerm
                      ? t("noSearchResults")
                      : t("noClientsDescription")}
                  </p>
                </div>
              ) : (
                <>
                  {/* MOBIL NÉZET: Kártyás elrendezés (asztali méreten elrejtve) */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-4 hover:bg-slate-50/50 active:bg-slate-50 transition-colors cursor-pointer space-y-3"
                        onClick={() => handleRowClick(client.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 shadow-sm">
                              {client.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="font-semibold text-sm text-slate-900">
                              {client.full_name}
                            </span>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              client.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1 w-1 rounded-full ${client.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}
                            />
                            {client.status === "active"
                              ? t("active")
                              : t("inactive")}
                          </span>
                        </div>

                        <div className="space-y-1 pl-10 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {client.email || t("notSpecified")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{client.phone || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1 text-slate-400">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {new Date(client.created_at).toLocaleDateString(
                                `${locale}-HU`,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 pl-10">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5 bg-white shadow-sm border-slate-200"
                            onClick={(e) => handleViewDetails(e, client.id)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            {t("details")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5 bg-white shadow-sm border-slate-200"
                            onClick={(e) => handleEditClick(e, client)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            {t("edit")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ASZTALI NÉZET: Hagyományos táblázat (mobilon elrejtve) */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className="w-[280px] lg:w-[320px] font-semibold text-slate-700">
                            {t("name")}
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            {t("contact")}
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            {t("status")}
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            {t("created")}
                          </TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">
                            {t("actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow
                            key={client.id}
                            className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                            onClick={() => handleRowClick(client.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-200 shadow-sm shrink-0">
                                  {client.full_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                  {client.full_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center text-sm text-slate-600 gap-2">
                                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[180px] lg:max-w-xs">
                                    {client.email || t("notSpecified")}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-slate-600 gap-2">
                                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>{client.phone || "-"}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  client.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${client.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}
                                />
                                {client.status === "active"
                                  ? t("active")
                                  : t("inactive")}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {new Date(
                                    client.created_at,
                                  ).toLocaleDateString(`${locale}-HU`)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell
                              className="text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 h-8"
                                  onClick={(e) =>
                                    handleViewDetails(e, client.id)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1 text-slate-500" />
                                  {t("details")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 h-8"
                                  onClick={(e) => handleEditClick(e, client)}
                                >
                                  <Edit className="h-4 w-4 mr-1 text-slate-500" />
                                  {t("edit")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {selectedClient && (
        <EditClientDialog
          client={selectedClient}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onClientUpdated={() => {
            fetchClients();
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
}
