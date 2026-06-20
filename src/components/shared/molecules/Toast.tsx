"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, TriangleAlert, X } from "lucide-react";

type ToastType = "error" | "success" | "warning" | "info";

type ToastProps = {
  open: boolean;
  message: string;
  type?: ToastType;
  title?: string;
  actionLabel?: string;
  durationMs?: number;
  onClose: () => void;
};

const toneStyles: Record<
  ToastType,
  {
    iconWrap: string;
    icon: ReactNode;
    title: string;
    actionLabel: string;
    actionClass: string;
  }
> = {
  error: {
    iconWrap:
      "bg-red-500/10 text-red-500 dark:bg-red-900/35 dark:text-red-400",
    icon: <AlertCircle size={20} />,
    title: "Ocurrio un error",
    actionLabel: "Cerrar",
    actionClass:
      "bg-[#eb2626] text-white hover:bg-[#d81f1f] dark:bg-[#f03030] dark:hover:bg-[#e22a2a]",
  },
  success: {
    iconWrap:
      "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-900/35 dark:text-emerald-400",
    icon: <CheckCircle2 size={20} />,
    title: "Todo salio bien",
    actionLabel: "Continuar",
    actionClass:
      "bg-[#1eae4b] text-white hover:bg-[#179240] dark:bg-[#20b34d] dark:hover:bg-[#1aa244]",
  },
  warning: {
    iconWrap:
      "bg-amber-500/12 text-amber-600 dark:bg-amber-900/35 dark:text-amber-400",
    icon: <TriangleAlert size={20} />,
    title: "Atencion requerida",
    actionLabel: "Entendido",
    actionClass:
      "bg-[#e48707] text-white hover:bg-[#cb7606] dark:bg-[#ea8d0d] dark:hover:bg-[#d5800a]",
  },
  info: {
    iconWrap:
      "bg-sky-500/12 text-sky-600 dark:bg-sky-900/35 dark:text-sky-400",
    icon: <AlertCircle size={20} />,
    title: "Atencion requerida",
    actionLabel: "Entendido",
    actionClass:
      "bg-(--color-accent) text-(--color-accent-contrast) hover:bg-(--color-accent-strong)",
  },
};

export function Toast({
  open,
  message,
  type = "info",
  title,
  actionLabel,
  durationMs,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open || !durationMs || durationMs <= 0) {
      return;
    }

    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) {
    return null;
  }

  const tone = toneStyles[type];
  const resolvedTitle = title ?? tone.title;
  const resolvedActionLabel = actionLabel ?? tone.actionLabel;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-[420px] rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-[0_26px_64px_rgba(0,0,0,0.32)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${tone.iconWrap}`}
          >
            {tone.icon}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar mensaje"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-(--color-surface-2) text-(--color-muted) transition-colors hover:bg-(--color-border) hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="mt-4 text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.1rem]">
          {resolvedTitle}
        </h3>

        <p className="mt-2 text-[1.15rem] leading-[1.5] text-(--color-muted) sm:text-[1.3rem]">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          title={resolvedActionLabel}
          className={`mt-6 inline-flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl text-[1.35rem] font-semibold transition-colors sm:text-[1.5rem] ${tone.actionClass}`}
        >
          {resolvedActionLabel}
        </button>
      </div>
    </div>
  );
}
