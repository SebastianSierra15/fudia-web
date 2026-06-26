"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Download,
  ExternalLink,
  MinusCircle,
  RefreshCw,
  Search,
  ServerCog,
  WalletCards,
} from "lucide-react";
import type {
  AdminLogEntry,
  AdminLogLevel,
  AdminLogSource,
  AdminLogsResponse,
} from "@/src/lib/admin-logs/types";
import {
  getAdminLogs,
  getAdminLogsCsv,
} from "@/src/lib/appwrite/admin-logs";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { AdminSourceBadge } from "../atoms/AdminSourceBadge";
import { AdminLogDetailDrawer } from "./AdminLogDetailDrawer";
import { useAdminHeaderActions } from "../templates/AdminShell";

type LoadingState = "idle" | "loading" | "refreshing";
type LevelFilter = "all" | AdminLogLevel;
type SourceFilter = "all" | AdminLogSource;

const integerFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
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

const levelLabel: Record<AdminLogLevel, string> = {
  debug: "Debug",
  info: "Info",
  warn: "Warn",
  error: "Error",
};

function getCurrentUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  });
}

function formatDuration(value: number | null) {
  return value === null ? "-" : `${integerFormatter.format(value)}ms`;
}

function getLevelClassName(level: AdminLogLevel) {
  if (level === "error") {
    return "bg-red-500/15 text-red-300";
  }

  if (level === "warn") {
    return "bg-orange-500/15 text-orange-300";
  }

  if (level === "debug") {
    return "bg-slate-500/15 text-slate-300";
  }

  return "bg-blue-500/15 text-blue-300";
}

function getStatusClassName(statusCode: number | null) {
  if (statusCode === null) {
    return "bg-(--color-surface-2) text-(--color-muted)";
  }

  if (statusCode >= 500) {
    return "bg-red-500/15 text-red-300";
  }

  if (statusCode >= 400) {
    return "bg-orange-500/15 text-orange-300";
  }

  return "bg-emerald-500/15 text-emerald-300";
}

function getPillStateClassName(status: "ok" | "partial" | "unavailable") {
  if (status === "ok") {
    return "border-emerald-400/35 bg-emerald-400/10 text-(--color-accent)";
  }

  if (status === "partial") {
    return "border-amber-400/35 bg-amber-400/10 text-amber-300";
  }

  return "border-red-400/35 bg-red-400/10 text-red-300";
}

function matchesSearch(entry: AdminLogEntry, search: string) {
  if (!search.trim()) {
    return true;
  }

  const normalized = search.trim().toLowerCase();
  return [
    entry.functionName,
    entry.eventName,
    entry.userLabel,
    entry.executionId,
    entry.message,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function getSourceDescription(status: AdminLogsResponse["sources"][keyof AdminLogsResponse["sources"]]["status"]) {
  if (status === "ok") {
    return "Datos disponibles";
  }

  if (status === "partial") {
    return "Informacion parcial";
  }

  return "Pendiente";
}

function AdminLogsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-8 animate-pulse rounded-lg border border-(--color-border) bg-(--color-surface)"
          />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-lg border border-(--color-border) bg-(--color-surface)"
          />
        ))}
      </div>
      <div className="rounded-lg border border-(--color-border) bg-(--color-surface)">
        <div className="grid gap-3 border-b border-(--color-border) p-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-10 animate-pulse rounded-lg bg-(--color-surface-2)"
            />
          ))}
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 9 }, (_, index) => (
            <div
              key={index}
              className="h-8 animate-pulse rounded bg-(--color-surface-2)"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminLogsDashboard({
  onDetailOpenChange,
}: {
  onDetailOpenChange: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const [currentDate] = useState(getCurrentUtcDate);
  const [date, setDate] = useState(currentDate);
  const [data, setData] = useState<AdminLogsResponse | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [functionFilter, setFunctionFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<AdminLogEntry | null>(null);

  const selectEntry = useCallback(
    (entry: AdminLogEntry) => {
      setSelectedEntry(entry);
      onDetailOpenChange(true);
    },
    [onDetailOpenChange],
  );

  const closeDetail = useCallback(() => {
    setSelectedEntry(null);
    onDetailOpenChange(false);
  }, [onDetailOpenChange]);

  const handleAuthorizationError = useCallback(
    (code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR") => {
      if (code === "NO_SESSION") {
        router.replace(buildLoginHref("/admin/logs"));
        return true;
      }

      if (code === "FORBIDDEN") {
        router.replace(
          `${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin/logs")}`,
        );
        return true;
      }

      return false;
    },
    [router],
  );

  useEffect(() => {
    let isActive = true;

    void getAdminLogs(date).then((result) => {
      if (!isActive) {
        return;
      }

      if (!result.success) {
        if (!handleAuthorizationError(result.code)) {
          setErrorMessage(result.message);
          setLoadingState("idle");
        }
        return;
      }

      setData(result.data);
      setLoadingState("idle");
    });

    return () => {
      isActive = false;
    };
  }, [date, handleAuthorizationError]);

  const filteredEntries = useMemo(() => {
    return (data?.entries ?? []).filter((entry) => {
      if (levelFilter !== "all" && entry.level !== levelFilter) {
        return false;
      }

      if (sourceFilter !== "all" && entry.source !== sourceFilter) {
        return false;
      }

      if (functionFilter !== "all" && entry.functionName !== functionFilter) {
        return false;
      }

      return matchesSearch(entry, search);
    });
  }, [data?.entries, functionFilter, levelFilter, search, sourceFilter]);

  const sourceCards = data
    ? [
        { label: "Ejecuciones", state: data.sources.appwriteExecutions },
        { label: "Logs internos", state: data.sources.systemLogs },
        { label: "Sentry", state: data.sources.sentry },
        { label: "Costo IA", state: data.sources.aiTelemetry },
      ]
    : [];

  const handleDateChange = (nextDate: string) => {
    if (!nextDate || nextDate > currentDate || nextDate === date) {
      return;
    }

    setErrorMessage("");
    setLoadingState("loading");
    setDate(nextDate);
  };

  const handleRefresh = useCallback(async () => {
    setErrorMessage("");
    setLoadingState("refreshing");

    const result = await getAdminLogs(date, true);
    if (!result.success) {
      if (!handleAuthorizationError(result.code)) {
        setErrorMessage(result.message);
        setLoadingState("idle");
      }
      return;
    }

    setData(result.data);
    setLoadingState("idle");
  }, [date, handleAuthorizationError]);

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setErrorMessage("");

    const result = await getAdminLogsCsv(date);
    if (!result.success) {
      if (!handleAuthorizationError(result.code)) {
        setErrorMessage(result.message);
      }
      setIsExporting(false);
      return;
    }

    downloadBlob(result.blob, result.filename);
    setIsExporting(false);
  }, [date, handleAuthorizationError, isExporting]);

  const headerActions = useMemo(
    () =>
      data ? (
        <>
          <div
            className={`hidden h-8 items-center justify-between gap-3 rounded-lg border px-4 text-sm font-semibold md:inline-flex ${getPillStateClassName(
              data.sources.appwriteExecutions.status,
            )}`}
          >
            <span>Appwrite</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
              {integerFormatter.format(data.summary.appwriteExecutions)}
            </span>
          </div>
          <div
            className={`hidden h-8 items-center justify-between gap-3 rounded-lg border px-4 text-sm font-semibold md:inline-flex ${getPillStateClassName(
              data.summary.reactNativeLogs > 0 ? "ok" : "partial",
            )}`}
          >
            <span>React Native</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
              {integerFormatter.format(data.summary.reactNativeLogs)}
            </span>
          </div>
          <div className="hidden h-8 items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-4 text-sm text-(--color-muted) lg:inline-flex">
            <span>Costo IA hoy</span>
            <strong className="text-(--color-accent)">
              {usdFormatter.format(data.summary.aiCostUsd)}
            </strong>
          </div>
          <button
            type="button"
            title="Actualizar datos"
            onClick={() => void handleRefresh()}
            disabled={loadingState !== "idle"}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm font-semibold text-(--color-muted) transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={loadingState === "refreshing" ? "animate-spin" : ""}
            />
          </button>
          <button
            type="button"
            title="Descargar CSV"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-4 text-sm font-semibold text-(--color-muted) transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            CSV
          </button>
        </>
      ) : null,
    [data, handleExport, handleRefresh, isExporting, loadingState],
  );
  useAdminHeaderActions(headerActions);

  if (loadingState === "loading" && !data) {
    return <AdminLogsSkeleton />;
  }

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      {data?.warnings.length ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300">
          Hay fuentes con datos parciales. El panel muestra la informacion
          disponible sin exponer detalles internos.
        </div>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Errores hoy",
                value: integerFormatter.format(data.summary.errors),
                hint: `${integerFormatter.format(data.summary.warnings)} advertencias`,
                icon: AlertTriangle,
                tone: data.summary.errors > 0 ? "text-red-400" : "text-foreground",
              },
              {
                label: "Costo IA hoy",
                value: usdFormatter.format(data.summary.aiCostUsd),
                hint: "acumulado del dia",
                icon: WalletCards,
                tone: "text-(--color-accent)",
              },
              {
                label: "Funciones ejecutadas",
                value: integerFormatter.format(data.summary.functionsExecuted),
                hint: "ejecuciones hoy",
                icon: ServerCog,
                tone: "text-foreground",
              },
              {
                label: "Total logs hoy",
                value: integerFormatter.format(data.summary.totalLogs),
                hint: "todos los niveles",
                icon: ClipboardList,
                tone: "text-foreground",
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.label}
                  className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-(--color-muted)">
                      {metric.label}
                    </p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--color-surface-2)">
                      <Icon size={18} className="text-(--color-muted)" />
                    </span>
                  </div>
                  <p className={`mt-4 text-3xl font-bold ${metric.tone}`}>
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-(--color-muted)">
                    {metric.hint}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="rounded-lg border border-(--color-border) bg-(--color-surface)">
            <div className="grid gap-3 border-b border-(--color-border) p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_0.65fr_0.7fr_0.8fr_0.9fr]">
              <label className="relative">
                <span className="sr-only">Buscar logs</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted)"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar funcion, usuario o ejecucion..."
                  className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-surface-2) pl-10 pr-3 text-sm outline-none transition-colors focus:border-(--color-accent-strong)"
                />
              </label>

              <input
                type="date"
                value={date}
                max={currentDate}
                onChange={(event) => handleDateChange(event.target.value)}
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm text-foreground"
              />

              <select
                value={levelFilter}
                onChange={(event) =>
                  setLevelFilter(event.target.value as LevelFilter)
                }
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm"
              >
                <option value="all">Todos los niveles</option>
                {data.filters.levels.map((level) => (
                  <option key={level} value={level}>
                    {levelLabel[level]}
                  </option>
                ))}
              </select>

              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as SourceFilter)
                }
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm"
              >
                <option value="all">Todas las fuentes</option>
                {data.filters.sources.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel[source]}
                  </option>
                ))}
              </select>

              <select
                value={functionFilter}
                onChange={(event) => setFunctionFilter(event.target.value)}
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm"
              >
                <option value="all">Todas las funciones</option>
                {data.filters.functions.map((functionName) => (
                  <option key={functionName} value={functionName}>
                    {functionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-h-[460px] max-h-[640px] overflow-auto overscroll-contain">
              <table className="w-full min-w-[1180px] text-left">
              <thead className="border-b border-(--color-border) bg-[#17233a]">
                  <tr>
                    {[
                      "Timestamp",
                      "Nivel",
                      "Fuente",
                      "Funcion / evento",
                      "Usuario / dispositivo",
                      "Ejecucion ID",
                      "Status",
                      "Duracion",
                      "Costo IA",
                    ].map((label) => (
                      <th
                        key={label}
                          className="sticky top-0 z-10 bg-[#17233a] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-(--color-muted-2)"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-(--color-muted)"
                      >
                        Sin logs para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr
                        key={`${entry.source}-${entry.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectEntry(entry)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectEntry(entry);
                          }
                        }}
                        className={`cursor-pointer border-b border-(--color-border) transition-colors hover:bg-white/4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-accent) ${
                          entry.level === "error"
                            ? "bg-red-500/7"
                            : "bg-transparent"
                        }`}
                      >
                        <td className="px-5 py-2.5 font-mono text-xs text-(--color-muted)">
                          {formatTime(entry.timestamp)}
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold uppercase ${getLevelClassName(
                              entry.level,
                            )}`}
                          >
                            {levelLabel[entry.level]}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-sm">
                          {sourceLabel[entry.source]}
                        </td>
                        <td className="px-5 py-2.5">
                          <p className="font-mono text-xs font-semibold">
                            {entry.functionName}
                          </p>
                          <p className="mt-1 text-xs text-(--color-muted)">
                            {entry.eventName}
                          </p>
                        </td>
                        <td className="px-5 py-2.5 text-sm text-(--color-muted)">
                          {entry.userLabel}
                        </td>
                        <td className="px-5 py-2.5 font-mono text-xs text-(--color-muted-2)">
                          {entry.executionId}
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`inline-flex h-7 items-center rounded-full px-2.5 font-mono text-[11px] font-bold ${getStatusClassName(
                              entry.statusCode,
                            )}`}
                          >
                            {entry.statusCode ?? "-"}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-sm">
                          {formatDuration(entry.durationMs)}
                        </td>
                        <td className="px-5 py-2.5 text-sm font-semibold">
                          {entry.aiCostUsd === null
                            ? "-"
                            : usdFormatter.format(entry.aiCostUsd)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Resumen por funcion
              </p>
              <div className="mt-4 space-y-3">
                {data.byFunction.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-(--color-border) p-5 text-sm text-(--color-muted)">
                    Sin actividad por funcion en este dia.
                  </p>
                ) : (
                  data.byFunction.slice(0, 8).map((item) => (
                    <div
                      key={item.functionName}
                      className="grid gap-3 rounded-lg bg-(--color-surface-2) p-3 text-sm md:grid-cols-[1fr_auto_auto_auto]"
                    >
                      <span className="font-mono text-xs font-semibold">
                        {item.functionName}
                      </span>
                      <span>{integerFormatter.format(item.total)} logs</span>
                      <span className="text-red-500">
                        {integerFormatter.format(item.errors)} errores
                      </span>
                      <span className="text-(--color-muted)">
                        {formatDuration(item.avgDurationMs)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Fuentes
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {sourceCards.map((source) => (
                  <div
                    key={source.label}
                    className="flex items-center justify-between gap-3 rounded-lg bg-(--color-surface-2) p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {source.label}
                      </p>
                      <p className="mt-1 truncate text-xs text-(--color-muted)">
                        {getSourceDescription(source.state.status)}
                      </p>
                    </div>
                    {source.state.status === "unavailable" ? (
                      <MinusCircle size={16} className="text-red-300" />
                    ) : (
                      <AdminSourceBadge status={source.state.status} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-(--color-muted)">
                  Estado de Sentry
                </p>
                <p className="mt-1 text-sm text-(--color-muted)">
                  Issues no resueltos e investigacion tecnica.
                </p>
              </div>
              <AdminSourceBadge status={data.sources.sentry.status} />
            </div>
            {data.sentrySummary ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {data.sentrySummary.projects.map((project) => (
                  <div key={project.project} className="rounded-lg bg-(--color-surface-2) p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{project.project}</p>
                      <span className="text-xs text-(--color-muted)">
                        {project.unresolvedIssues} abiertos
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-(--color-muted)">
                      {project.recentIssues} vistos en 24 h · {project.newIssues} nuevos
                    </p>
                    <div className="mt-4 space-y-2">
                      {project.issues.length === 0 ? (
                        <p className="text-sm text-(--color-muted)">Sin Issues abiertos.</p>
                      ) : (
                        project.issues.map((issue) => (
                          <a
                            key={issue.id}
                            href={issue.url}
                            target="_blank"
                            rel="noreferrer"
                            title={`Abrir ${issue.title} en Sentry`}
                            className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-(--color-border) px-3 py-2 text-sm transition-colors hover:border-(--color-accent)/50"
                          >
                            <span className="min-w-0 truncate">{issue.title}</span>
                            <ExternalLink size={14} className="shrink-0 text-(--color-muted)" />
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-lg border border-dashed border-(--color-border) p-4 text-sm text-(--color-muted)">
                Sentry no esta disponible para lectura desde el panel.
              </p>
            )}
          </section>
        </>
      ) : null}
      <AdminLogDetailDrawer
        entry={selectedEntry}
        onClose={closeDetail}
      />
    </div>
  );
}
