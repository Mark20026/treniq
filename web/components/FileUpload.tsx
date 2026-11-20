"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Video, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  clientId: string;
  clientName: string;
  onUploadComplete: () => void;
  category?:
    | "workout_plan"
    | "nutrition"
    | "progress_photo"
    | "video_tutorial"
    | "other";
}

export default function FileUpload({
  clientId,
  clientName,
  onUploadComplete,
  category = "other",
}: FileUploadProps) {
  const t = useTranslations("FileUpload");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("notLoggedIn"));
      setUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${clientId}/${category}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("client-files")
      .upload(filePath, file);

    if (uploadError) {
      toast.error(t("uploadError") + uploadError.message);
      setUploading(false);
      return;
    }



    const { error: dbError } = await supabase.from("client_files").insert({
      client_id: clientId,
      coach_id: user.id,
      file_name: file.name,
      file_url: filePath,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      category: category,
      description: "",
      uploaded_by: "coach",
    });

    if (dbError) {
      toast.error(t("dbError") + dbError.message);
    } else {
      toast.success(t("uploadSuccess", { fileName: file.name }));
      onUploadComplete();
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className="pt-16 sm:pt-0 space-y-4 w-full">
      <div
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-full">
            <Upload className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 text-sm sm:text-base">
              {t("dragDrop")}
            </p>
            <p className="text-xs text-slate-400 mt-1">{t("fileFormats")}</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleUpload(e.target.files[0]);
            }
          }}
          accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov"
        />
      </div>

      {uploading && (
        <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span className="text-sm text-slate-600">{t("uploading")}</span>
        </div>
      )}
    </div>
  );
}
