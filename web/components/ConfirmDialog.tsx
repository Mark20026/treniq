"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "destructive",
}: ConfirmDialogProps) {
  const t = useTranslations("ConfirmDialog");

  const defaultConfirmText =
    variant === "destructive" ? t("delete") : t("confirm");

  const defaultCancelText = t("cancel");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full sm:h-auto max-w-full sm:max-w-[425px] max-h-screen sm:max-h-[90vh] p-0 pt-16 sm:pt-0 border-none shadow-2xl sm:rounded-2xl flex flex-col bg-white overflow-hidden">
        {/* Tartalom belső margóinak igazítása mobilon */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full shrink-0 ${
                  variant === "destructive"
                    ? "bg-rose-50 text-rose-500"
                    : "bg-amber-50 text-amber-500"
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                {title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 text-sm font-medium leading-relaxed pt-1">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Lábléc gombjai reszponzív flexboxszal, mobilon egymás mellett/alatt kitöltve */}
        <DialogFooter className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-row sm:flex-row gap-3 justify-end shrink-0 mt-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-initial h-11 rounded-xl text-sm font-semibold border-slate-200 text-slate-600"
          >
            {cancelText || defaultCancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            className={`flex-1 sm:flex-initial h-11 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-transform ${
              variant !== "destructive"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : ""
            }`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText || defaultConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
