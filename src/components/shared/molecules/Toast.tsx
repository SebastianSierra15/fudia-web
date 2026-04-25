"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "error" | "success" | "info";

type ToastProps = {
  open: boolean;
  message: string;
  type?: ToastType;
  durationMs?: number;
  onClose: () => void;
};

const toneStyles: Record<ToastType, { container: string; icon: ReactNode }> = {
  error: {
    container:
      "border-red-500/40 bg-red-500/12 text-red-100",
    icon: <AlertCircle size={18} className="text-red-300" />,
  },
  success: {
    container:
      "border-emerald-500/40 bg-emerald-500/12 text-emerald-100",
    icon: <CheckCircle2 size={18} className="text-emerald-300" />,
  },
  info: {
    container:
      "border-sky-500/40 bg-sky-500/12 text-sky-100",
    icon: <Info size={18} className="text-sky-300" />,
  },
};

export function Toast({
  open,
  message,
  type = "info",
  durationMs = 5500,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) {
    return null;
  }

  const tone = toneStyles[type];

  return (
    <div className="pointer-events-none fixed top-5 right-5 z-[120] w-[min(92vw,460px)]">
      <div
        role="alert"
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm ${tone.container}`}
      >
        <div className="mt-0.5">{tone.icon}</div>
        <p className="flex-1 text-sm leading-5">{message}</p>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar mensaje"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
