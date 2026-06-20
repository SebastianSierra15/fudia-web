"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Database,
  Download,
  RefreshCw,
  Users,
  WalletCards,
} from "lucide-react";
import type {
  AiAttributionBreakdown,
  AiUsageResponse,
} from "@/src/lib/admin-ai/types";
import {
  getAdminAiUsage,
  getAdminAiUsageCsv,
} from "@/src/lib/appwrite/admin-ai";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { AdminSourceBadge } from "../atoms/AdminSourceBadge";

type LoadingState = "idle" | "loading" | "refreshing";

const integerFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const shortDateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

function getCurrentUtcMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
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

function formatPercent(value: number | null) {
  return value === null ? "Sin dato" : `${value.toFixed(1)}%`;
}

function getBudgetState(usedPercent: number | null) {
  if (usedPercent === null) {
    return {
      label: "Sin presupuesto configurado",
      barClassName: "bg-(--color-muted)",
    };
  }

  if (usedPercent >= 100) {
    return {
      label: "Presupuesto agotado",
      barClassName: "bg-red-500",
    };
  }

  if (usedPercent >= 90) {
    return {
      label: "Alerta critica: 90% consumido",
      barClassName: "bg-orange-500",
    };
  }

  if (usedPercent >= 70) {
    return {
      label: "Alerta preventiva: 70% consumido",
      barClassName: "bg-amber-500",
    };
  }

  return {
    label: "Consumo dentro del presupuesto",
    barClassName: "bg-emerald-500",
  };
}

function getSourceDescription(status: AiUsageResponse["sources"][keyof AiUsageResponse["sources"]]["status"]) {
  if (status === "ok") {
    return "Datos disponibles";
  }

  if (status === "partial") {
    return "Informacion parcial";
  }

  return "Pendiente de conexion";
}

type CostBarListProps<T extends AiAttributionBreakdown> = {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  emptyLabel: string;
};

function CostBarList<T extends AiAttributionBreakdown>({
  items,
  getKey,
  getLabel,
  emptyLabel,
}: CostBarListProps<T>) {
  const maxCost = Math.max(
    0.000001,
    ...items.map((item) => item.estimatedCostUsd),
  );

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--color-border) p-5 text-sm text-(--color-muted)">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={getKey(item)}>
          <div className="mb-2 flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-semibold">
                {getLabel(item)}
              </p>
              <p className="mt-1 text-xs text-(--color-muted)">
                {integerFormatter.format(item.calls)} llamadas ·{" "}
                {integerFormatter.format(item.tokens)} tokens
              </p>
            </div>
            <span className="shrink-0 font-semibold">
              {usdFormatter.format(item.estimatedCostUsd)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-(--color-surface-2)">
            <div
              className="h-full rounded-full bg-(--color-accent-strong)"
              style={{
                width: `${Math.max(
                  2,
                  (item.estimatedCostUsd / maxCost) * 100,
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminAiDashboard() {
  const router = useRouter();
  const [currentMonth] = useState(getCurrentUtcMonth);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<AiUsageResponse | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAuthorizationError = useCallback(
    (code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR") => {
      if (code === "NO_SESSION") {
        router.replace(buildLoginHref("/admin/ia"));
        return true;
      }

      if (code === "FORBIDDEN") {
        router.replace(
          `${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin/ia")}`,
        );
        return true;
      }

      return false;
    },
    [router],
  );

  useEffect(() => {
    let isActive = true;

    void getAdminAiUsage(month).then((result) => {
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
  }, [handleAuthorizationError, month]);

  const handleMonthChange = (nextMonth: string) => {
    if (!nextMonth || nextMonth > currentMonth || nextMonth === month) {
      return;
    }

    setErrorMessage("");
    setLoadingState("loading");
    setMonth(nextMonth);
  };

  const handleRefresh = async () => {
    setLoadingState("refreshing");
    setErrorMessage("");

    const result = await getAdminAiUsage(month);
    if (!result.success) {
      if (!handleAuthorizationError(result.code)) {
        setErrorMessage(result.message);
        setLoadingState("idle");
      }
      return;
    }

    setData(result.data);
    setLoadingState("idle");
  };

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setErrorMessage("");
    const result = await getAdminAiUsageCsv(month);

    if (!result.success) {
      if (!handleAuthorizationError(result.code)) {
        setErrorMessage(result.message);
      }
      setIsExporting(false);
      return;
    }

    downloadBlob(result.blob, result.filename);
    setIsExporting(false);
  };

  const maxDailyCost = useMemo(
    () =>
      Math.max(
        0.000001,
        ...(data?.daily.map((day) => day.officialCostUsd) ?? []),
      ),
    [data],
  );
  const budgetWidth = Math.min(
    100,
    Math.max(0, data?.budget.usedPercent ?? 0),
  );
  const budgetState = getBudgetState(data?.budget.usedPercent ?? null);

  if (loadingState === "loading" && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-lg border border-(--color-border) bg-(--color-surface)"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 border-b border-(--color-border) pb-6 md:flex-row md:items-end md:justify-between">
        <label className="flex w-full max-w-xs flex-col gap-2 text-xs font-semibold uppercase text-(--color-muted)">
          Mes
          <input
            type="month"
            value={month}
            max={currentMonth}
            onChange={(event) => handleMonthChange(event.target.value)}
            className="h-11 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm font-semibold text-foreground"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            title="Actualizar datos"
            onClick={() => void handleRefresh()}
            disabled={loadingState !== "idle"}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 text-sm font-semibold transition-colors hover:bg-(--color-surface-2) disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loadingState === "refreshing" ? "animate-spin" : ""}
            />
            Actualizar
          </button>
          <button
            type="button"
            title="Descargar CSV"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-(--color-accent) px-4 text-sm font-semibold text-(--color-accent-contrast) transition-colors hover:bg-(--color-accent-strong) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            CSV
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      {data?.warnings.length ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          Algunos datos aun no estan disponibles. El resto del panel puede
          seguir utilizandose normalmente.
        </div>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "OpenAI Completions",
                state: data.sources.openaiCompletions,
                icon: BrainCircuit,
              },
              {
                label: "OpenAI Whisper",
                state: data.sources.openaiTranscriptions,
                icon: BrainCircuit,
              },
              {
                label: "OpenAI Costs",
                state: data.sources.openaiCosts,
                icon: WalletCards,
              },
              {
                label: "Appwrite Usage",
                state: data.sources.appwriteTelemetry,
                icon: Database,
              },
            ].map((source) => {
              const Icon = source.icon;
              return (
                <article
                  key={source.label}
                  className="flex min-h-24 items-center justify-between gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon size={18} className="shrink-0 text-(--color-muted)" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {source.label}
                      </p>
                      <p className="mt-1 truncate text-xs text-(--color-muted)">
                        {getSourceDescription(source.state.status)}
                      </p>
                    </div>
                  </div>
                  <AdminSourceBadge status={source.state.status} />
                </article>
              );
            })}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Costo oficial",
                value: usdFormatter.format(data.summary.officialCostUsd),
                hint: "OpenAI Costs",
                icon: WalletCards,
              },
              {
                label: "Llamadas oficiales",
                value: integerFormatter.format(data.summary.officialCalls),
                hint: `${integerFormatter.format(
                  data.summary.officialCompletionCalls,
                )} completions · ${integerFormatter.format(
                  data.summary.officialTranscriptionCalls,
                )} Whisper`,
                icon: BrainCircuit,
              },
              {
                label: "Tokens de entrada",
                value: integerFormatter.format(
                  data.summary.officialInputTokens,
                ),
                hint: "Uso oficial de OpenAI",
                icon: Database,
              },
              {
                label: "Tokens en cache",
                value: integerFormatter.format(
                  data.summary.officialCachedInputTokens,
                ),
                hint: "Incluidos en tokens de entrada",
                icon: Database,
              },
              {
                label: "Tokens de salida",
                value: integerFormatter.format(
                  data.summary.officialOutputTokens,
                ),
                hint: "Uso oficial de OpenAI",
                icon: Database,
              },
              {
                label: "Costo atribuido",
                value: usdFormatter.format(
                  data.summary.estimatedAttributedCostUsd,
                ),
                hint: "Estimado desde telemetria",
                icon: Users,
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <article
                  key={metric.label}
                  className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase text-(--color-muted)">
                      {metric.label}
                    </p>
                    <Icon size={18} className="text-(--color-muted)" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
                  <p className="mt-1 text-xs text-(--color-muted)">
                    {metric.hint}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 border-y border-(--color-border) py-7 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Cobertura de atribucion
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Oficial vs estimado
              </h2>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <dt className="text-xs text-(--color-muted)">Llamadas</dt>
                  <dd className="mt-1 font-semibold">
                    {formatPercent(data.attributionCoverage.callsPercent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-muted)">Tokens</dt>
                  <dd className="mt-1 font-semibold">
                    {formatPercent(data.attributionCoverage.tokensPercent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-(--color-muted)">Costo</dt>
                  <dd className="mt-1 font-semibold">
                    {formatPercent(data.attributionCoverage.costPercent)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-(--color-muted)">
                Telemetria desde:{" "}
                {data.telemetryStartedAt
                  ? new Date(data.telemetryStartedAt).toLocaleDateString(
                      "es-CO",
                    )
                  : "sin fecha disponible"}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-(--color-muted)">
                    Presupuesto mensual
                  </p>
                  <p className="mt-2 font-semibold">
                    {usdFormatter.format(data.budget.spentUsd)} gastados
                  </p>
                </div>
                <span className="text-(--color-muted)">
                  {data.budget.limitUsd === null
                    ? "Sin configurar"
                    : `${formatPercent(data.budget.usedPercent)} de ${usdFormatter.format(
                        data.budget.limitUsd,
                      )}`}
                </span>
              </div>
              {data.budget.limitUsd === null ? (
                <p className="mt-4 rounded-lg border border-dashed border-(--color-border) p-4 text-sm text-(--color-muted)">
                  Define un presupuesto mensual para activar el seguimiento.
                </p>
              ) : (
                <>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-(--color-surface-2)">
                    <div
                      className={`h-full rounded-full ${budgetState.barClassName}`}
                      style={{ width: `${budgetWidth}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                    <span
                      className={
                        data.budget.usedPercent !== null &&
                        data.budget.usedPercent >= 90
                          ? "font-semibold text-orange-300"
                          : "text-(--color-muted)"
                      }
                    >
                      {budgetState.label}
                    </span>
                    <span className="text-(--color-muted)">
                      {usdFormatter.format(data.budget.remainingUsd ?? 0)}{" "}
                      disponibles
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase text-(--color-muted)">
              Gasto oficial diario
            </p>
            <h2 className="mt-2 text-xl font-semibold">{data.range.label}</h2>
            {data.daily.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-(--color-border) p-5 text-sm text-(--color-muted)">
                Sin datos diarios para este mes.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <div
                  className="grid min-w-[720px] items-end gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${data.daily.length}, minmax(28px, 1fr))`,
                  }}
                >
                  {data.daily.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-col items-center gap-2"
                      title={`${day.date}: ${usdFormatter.format(
                        day.officialCostUsd,
                      )} oficial`}
                    >
                      <span className="text-[10px] text-(--color-muted)">
                        {usdFormatter.format(day.officialCostUsd)}
                      </span>
                      <div className="flex h-36 w-full items-end justify-center rounded-sm bg-(--color-surface-2)">
                        <div
                          className="w-full max-w-8 rounded-t-sm bg-emerald-500"
                          style={{
                            height: `${Math.max(
                              2,
                              (day.officialCostUsd / maxDailyCost) * 144,
                            )}px`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-(--color-muted)">
                        {shortDateFormatter.format(
                          new Date(`${day.date}T00:00:00Z`),
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-8 border-t border-(--color-border) pt-8 xl:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Atribucion estimada
              </p>
              <h2 className="mt-2 text-xl font-semibold">Gasto por modelo</h2>
              <div className="mt-5">
                <CostBarList
                  items={data.byModel}
                  getKey={(item) => item.model}
                  getLabel={(item) => item.model}
                  emptyLabel="Sin atribucion por modelo."
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Atribucion estimada
              </p>
              <h2 className="mt-2 text-xl font-semibold">Gasto por funcion</h2>
              <div className="mt-5">
                <CostBarList
                  items={data.byFunction}
                  getKey={(item) => item.functionName}
                  getLabel={(item) => item.functionName}
                  emptyLabel="Sin atribucion por funcion."
                />
              </div>
            </div>
          </section>

          <section className="border-t border-(--color-border) pt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-(--color-muted)">
                  Usuarios
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Mayor costo estimado
                </h2>
              </div>
              <AdminSourceBadge status={data.sources.appwriteUsers.status} />
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border border-(--color-border)">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-(--color-surface-2)">
                  <tr>
                    {[
                      "Usuario",
                      "User ID",
                      "Llamadas",
                      "Tokens",
                      "Costo estimado",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-xs font-semibold text-(--color-muted)"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-sm text-(--color-muted)"
                      >
                        Sin usuarios atribuibles en el mes.
                      </td>
                    </tr>
                  ) : (
                    data.topUsers.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-t border-(--color-border)"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold">{user.name}</p>
                          <p className="mt-1 text-xs text-(--color-muted)">
                            {user.email || "Email no disponible"}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {user.userId}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(user.calls)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(user.tokens)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {usdFormatter.format(user.estimatedCostUsd)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border-t border-(--color-border) pt-8">
            <p className="text-xs font-semibold uppercase text-(--color-muted)">
              Detalle diario
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Oficial y atribuido
            </h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-(--color-border)">
              <table className="w-full min-w-[1120px] text-left">
                <thead className="bg-(--color-surface-2)">
                  <tr>
                    {[
                      "Fecha",
                      "Completions",
                      "Whisper",
                      "Tokens input",
                      "Tokens cache",
                      "Tokens output",
                      "Total tokens",
                      "Costo oficial",
                      "Calls atribuidas",
                      "Costo estimado",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-xs font-semibold text-(--color-muted)"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.daily.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-6 text-center text-sm text-(--color-muted)"
                      >
                        Sin datos diarios.
                      </td>
                    </tr>
                  ) : (
                    data.daily.map((day) => (
                      <tr
                        key={day.date}
                        className="border-t border-(--color-border)"
                      >
                        <td className="px-4 py-3 text-sm">{day.date}</td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(
                            day.officialCompletionCalls,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(
                            day.officialTranscriptionCalls,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(day.officialInputTokens)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(
                            day.officialCachedInputTokens,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(day.officialOutputTokens)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(day.officialTokens)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {usdFormatter.format(day.officialCostUsd)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {integerFormatter.format(day.attributedCalls)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          {usdFormatter.format(day.estimatedCostUsd)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
