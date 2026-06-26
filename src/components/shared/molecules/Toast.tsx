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
  durationMs?: number;
  onClose: () => void;
};

const toneStyles: Record<
  ToastType,
  {
    wrap: string;
    iconClass: string;
    icon: ReactNode;
    title: string;
  }
> = {
  error: {
    wrap: "border-red-400/35 bg-[#2a1218] text-red-100 shadow-red-950/30",
    iconClass: "text-red-300",
    icon: <AlertCircle size={20} />,
    title: "Ocurrio un error",
  },
  success: {
    wrap:
      "border-emerald-400/35 bg-[#10291f] text-emerald-100 shadow-emerald-950/30",
    iconClass: "text-emerald-300",
    icon: <CheckCircle2 size={20} />,
    title: "Todo salio bien",
  },
  warning: {
    wrap:
      "border-amber-400/35 bg-[#2b2111] text-amber-100 shadow-amber-950/30",
    iconClass: "text-amber-300",
    icon: <TriangleAlert size={20} />,
    title: "Atencion requerida",
  },
  info: {
    wrap: "border-blue-400/35 bg-[#111f35] text-blue-100 shadow-blue-950/30",
    iconClass: "text-blue-300",
    icon: <AlertCircle size={20} />,
    title: "Atencion requerida",
  },
};

export function Toast({
  open,
  message,
  type = "info",
  title,
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

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[130] w-[min(420px,calc(100vw-2rem))]">
      <div
        role="status"
        className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)] ${tone.wrap}`}
      >
        <span className={`mt-0.5 shrink-0 ${tone.iconClass}`}>
          {tone.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-5">{resolvedTitle}</p>
          <p className="mt-0.5 text-sm font-medium leading-5 opacity-90">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar mensaje"
          className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-75 transition-colors hover:bg-white/10 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
