"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Phone, Mail } from "lucide-react";
import EditClientDialog from "./EditClientDialog";

interface ClientTableProps {
  clients: any[];
  onClientUpdated: () => void;
}

export default function ClientTable({
  clients,
  onClientUpdated,
}: ClientTableProps) {
  const t = useTranslations("ClientTable");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsEditOpen(true);
  };

  return (
    <div className="pt-16 sm:pt-0">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm w-full">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <Table className="min-w-[600px] sm:min-w-full">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">{t("name")}</TableHead>
                <TableHead className="font-bold">{t("status")}</TableHead>
                <TableHead className="font-bold hidden md:table-cell">
                  {t("contact")}
                </TableHead>
                <TableHead className="font-bold hidden lg:table-cell">
                  {t("goals")}
                </TableHead>
                <TableHead className="text-right font-bold">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                    {client.full_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "active" ? "default" : "secondary"
                      }
                      className={
                        client.status === "active"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-slate-200 text-slate-600"
                      }
                    >
                      {client.status === "active" ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col text-xs text-slate-500 gap-1">
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-slate-500 text-sm">
                    {client.goals || "-"}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 active:scale-[0.98] transition-transform"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      {t("edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <EditClientDialog
        client={selectedClient}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onClientUpdated={onClientUpdated}
      />
    </div>
  );
}
