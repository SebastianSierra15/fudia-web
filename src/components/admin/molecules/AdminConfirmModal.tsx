"use client";

import { AlertTriangle, X } from "lucide-react";

type AdminConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
};

export function AdminConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  onCancel,
  onConfirm,
}: AdminConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        className="w-full max-w-md rounded-lg border border-(--color-border) bg-(--color-surface) p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
            <AlertTriangle size={20} />
          </span>
          <button
            type="button"
            title="Cerrar confirmacion"
            onClick={onCancel}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-(--color-muted) hover:bg-(--color-surface-2) hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="admin-confirm-title" className="mt-4 text-lg font-bold">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">
          {description}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) text-sm font-semibold text-(--color-muted) hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-10 cursor-pointer rounded-lg text-sm font-bold ${
              tone === "danger"
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-(--color-accent) text-(--color-accent-contrast) hover:bg-(--color-accent-strong)"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
