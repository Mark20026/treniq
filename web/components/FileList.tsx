"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  FileText,
  Video,
  Image,
  File,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { toast } from "sonner";

interface ClientFile {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string;
  uploaded_by: string;
  created_at: string;
}

interface FileListProps {
  clientId: string;
  category?: string;
}

export default function FileList({ clientId, category }: FileListProps) {
  const t = useTranslations("FileList");
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [clientId, category]);

  async function fetchFiles() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("client_files")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (!error && data) {
      setFiles(await Promise.all(data.map(async file => {
        const { data: signed } = await supabase.storage.from("client-files").createSignedUrl(file.file_path, 3600);
        return { ...file, file_url: signed?.signedUrl ?? "" };
      })));
    }
    setLoading(false);
  }

  async function handleDelete(fileId: string, filePath: string) {
    if (!confirm(t("deleteConfirm"))) return;

    await supabase.storage.from("client-files").remove([filePath]);

    const { error } = await supabase
      .from("client_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      toast.error(t("deleteError"));
    } else {
      toast.success(t("deleteSuccess"));
      fetchFiles();
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("video/"))
      return <Video className="h-5 w-5 text-indigo-500" />;
    if (fileType.startsWith("image/"))
      return <Image className="h-5 w-5 text-emerald-500" />;
    if (fileType === "application/pdf")
      return <FileText className="h-5 w-5 text-rose-500" />;
    return <File className="h-5 w-5 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12 pt-16 sm:pt-0">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 pt-16 sm:pt-0 px-4">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="font-semibold text-slate-700 text-sm">{t("noFiles")}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {t("noFilesDescription")}
        </p>
      </div>
    );
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "workout_plan":
        return t("categoryWorkoutPlan");
      case "nutrition":
        return t("categoryNutrition");
      case "progress_photo":
        return t("categoryProgressPhoto");
      case "video_tutorial":
        return t("categoryVideo");
      case "other":
        return t("categoryOther");
      default:
        return category;
    }
  };

  return (
    <div className="space-y-3 pt-16 sm:pt-0 p-1 sm:p-0">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all gap-3 sm:gap-4"
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="p-2 bg-slate-50 rounded-lg shrink-0">
              {getFileIcon(file.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 text-sm sm:text-base truncate">
                {file.file_name}
              </p>
              <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 flex-wrap">
                <span className="shrink-0">
                  {formatFileSize(file.file_size)}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {format(new Date(file.created_at), "MMM dd, yyyy", {
                    locale: hu,
                  })}
                </span>
                <span className="capitalize px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium tracking-wide">
                  {getCategoryLabel(file.category)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 border-t border-slate-50 sm:border-none pt-2 sm:pt-0 shrink-0">
            <a
              href={file.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors active:scale-95"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={() => handleDelete(file.id, file.file_path)}
              className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
