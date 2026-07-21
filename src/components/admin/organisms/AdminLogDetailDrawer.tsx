"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import type { AdminLogEntry, AdminLogSource } from "@/src/lib/admin-logs/types";

type Props = {
  entry: AdminLogEntry | null;
  onClose: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "full",
  timeStyle: "medium",
  timeZone: "UTC",
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const sourceLabel: Record<AdminLogSource, string> = {
  appwrite: "Appwrite",
  "react-native": "React Native",
  web: "Web",
  sentry: "Sentry",
};

function getAttention(entry: AdminLogEntry) {
  if (entry.level === "error") {
    return {
      label: "Requiere revision",
      description: "Evento critico o inesperado. Revisar correlacion tecnica.",
      className: "border-red-400/35 bg-red-400/10 text-red-200",
      dotClassName: "bg-red-400",
    };
  }

  if (entry.level === "warn") {
    return {
      label: "Monitorear",
      description: "Evento esperado con advertencia. Validar recurrencia.",
      className: "border-orange-400/35 bg-orange-400/10 text-orange-200",
      dotClassName: "bg-orange-300",
    };
  }

  return {
    label: "Informativo",
    description: "Evento operativo normal. No requiere acción inmediata.",
    className: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
    dotClassName: "bg-emerald-300",
  };
}

function getOriginDescription(entry: AdminLogEntry) {
  if (entry.source === "react-native") {
    return "Evento generado desde la app movil y normalizado por backend.";
  }

  if (entry.source === "appwrite") {
    return "Ejecucion registrada por Appwrite Functions.";
  }

  if (entry.source === "web") {
    return "Evento generado desde la experiencia web/admin.";
  }

  return "Evento relacionado con diagnostico tecnico en Sentry.";
}

function formatStatus(statusCode: number | null) {
  if (statusCode === null) return "No disponible";
  return statusCode.toString();
}

function CopyField({
  label,
  value,
  copyValue,
  copiedKey,
  onCopy,
  tone = "default",
}: {
  label: string;
  value: string;
  copyValue?: string | null;
  copiedKey: string;
  onCopy: (key: string, value: string | null | undefined) => void;
  tone?: "default" | "accent" | "danger";
}) {
  const isCopied = copiedKey === label;
  const toneClass =
    tone === "accent"
      ? "border-emerald-400/25 bg-emerald-400/10"
      : tone === "danger"
        ? "border-red-400/25 bg-red-400/10"
        : "border-(--color-border) bg-(--color-surface-2)";

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-(--color-muted-2)">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-foreground">
            {value}
          </p>
        </div>
        <button
          type="button"
          title={`Copiar ${label}`}
          aria-label={`Copiar ${label}`}
          disabled={!copyValue}
          onClick={() => onCopy(label, copyValue)}
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-black/10 text-(--color-muted) transition-colors hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
        >
          {isCopied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

function LogDetailContent({
  entry,
  onClose,
}: {
  entry: AdminLogEntry;
  onClose: () => void;
}) {
  const [copiedKey, setCopiedKey] = useState("");
  const attention = useMemo(() => getAttention(entry), [entry]);
  const hasExecution = entry.executionId !== "-";
  const hasSentry = Boolean(entry.sentryEventId && entry.sentryUrl);

  const copyValue = async (key: string, value: string | null | undefined) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1800);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col bg-(--color-bg)">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-(--color-border) p-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted)">
            Detalle de log
          </p>
          <h2
            id="admin-log-detail-title"
            className="mt-1 break-words text-lg font-bold"
          >
            {entry.eventName}
          </h2>
        </div>
        <button
          type="button"
          title="Cerrar detalle"
          aria-label="Cerrar detalle"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-(--color-muted) transition-colors hover:bg-(--color-surface-2) hover:text-foreground"
        >
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <section className={`rounded-lg border p-4 ${attention.className}`}>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${attention.dotClassName}`}
            />
            <p className="text-sm font-bold">{attention.label}</p>
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">
            {entry.message}
          </p>
          <p className="mt-2 text-xs text-(--color-muted)">
            {attention.description}
          </p>
        </section>

        <section className="mt-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Contexto operativo
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <CopyField
              label="Fuente"
              value={sourceLabel[entry.source]}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={sourceLabel[entry.source]}
              tone="accent"
            />
            <CopyField
              label="Nivel"
              value={entry.level}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.level}
              tone={entry.level === "error" ? "danger" : "default"}
            />
            <CopyField
              label="Estado HTTP"
              value={formatStatus(entry.statusCode)}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.statusCode?.toString()}
            />
            <CopyField
              label="Duracion"
              value={
                entry.durationMs === null
                  ? "No disponible"
                  : `${entry.durationMs} ms`
              }
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.durationMs?.toString()}
            />
          </div>
          <p className="mt-3 rounded-lg bg-(--color-surface-2) p-3 text-xs text-(--color-muted)">
            {getOriginDescription(entry)}
          </p>
        </section>

        <section className="mt-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Correlacion
          </p>
          <div className="mt-3 space-y-2">
            <CopyField
              label="Log ID"
              value={entry.id}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.id}
            />
            <CopyField
              label="Ejecucion Appwrite"
              value={hasExecution ? entry.executionId : "Sin ejecucion"}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={hasExecution ? entry.executionId : null}
            />
            <CopyField
              label="Sentry Event ID"
              value={entry.sentryEventId ?? "Sin evento tecnico"}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.sentryEventId}
              tone={hasSentry ? "accent" : "default"}
            />
          </div>
          {entry.sentryUrl ? (
            <a
              href={entry.sentryUrl}
              target="_blank"
              rel="noreferrer"
              title="Abrir investigacion tecnica en Sentry"
              className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-(--color-accent)/40 bg-(--color-accent)/10 px-4 text-sm font-bold text-(--color-accent) transition-colors hover:bg-(--color-accent)/20"
            >
              Abrir en Sentry
              <ExternalLink size={16} />
            </a>
          ) : null}
        </section>

        <section className="mt-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Usuario y entorno
          </p>
          <div className="mt-3 space-y-2">
            <CopyField
              label="Usuario"
              value={entry.userLabel}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.userLabel}
            />
            <CopyField
              label="Usuario ID"
              value={entry.userId ?? "No disponible"}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.userId}
            />
            <CopyField
              label="Dispositivo"
              value={entry.device ?? "No disponible"}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.device}
            />
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Datos completos
          </p>
          <div className="mt-3 space-y-2">
            <CopyField
              label="Timestamp"
              value={`${dateFormatter.format(new Date(entry.timestamp))} UTC`}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.timestamp}
            />
            <CopyField
              label="Funcion"
              value={entry.functionName}
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.functionName}
            />
            <CopyField
              label="Costo IA"
              value={
                entry.aiCostUsd === null
                  ? "No disponible"
                  : usdFormatter.format(entry.aiCostUsd)
              }
              copiedKey={copiedKey}
              onCopy={copyValue}
              copyValue={entry.aiCostUsd?.toString()}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}

export function AdminLogDetailDrawer({ entry, onClose }: Props) {
  useEffect(() => {
    if (!entry) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entry, onClose]);

  if (!entry) return null;

  return (
    <>
      <aside
        role="dialog"
        aria-modal="false"
        aria-labelledby="admin-log-detail-title"
        className="fixed top-14 right-0 bottom-0 z-40 hidden w-[370px] overflow-y-auto border-l border-(--color-border) bg-(--color-bg) shadow-[-18px_0_50px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out xl:block"
      >
        <LogDetailContent entry={entry} onClose={onClose} />
      </aside>

      <button
        type="button"
        title="Cerrar detalle"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="fixed inset-0 z-50 cursor-pointer bg-black/55 transition-opacity xl:hidden"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-log-detail-title"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] animate-[slide-in-right_200ms_ease-out] overflow-y-auto border-l border-(--color-border) bg-(--color-bg) shadow-[-18px_0_50px_rgba(0,0,0,0.35)] xl:hidden"
      >
        <LogDetailContent entry={entry} onClose={onClose} />
      </aside>
    </>
  );
}
