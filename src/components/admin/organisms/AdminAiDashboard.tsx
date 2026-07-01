"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  isAdminCacheFresh,
  readAdminCache,
  writeAdminCache,
} from "@/src/lib/admin-cache/client";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { useAdminFeedback } from "../molecules/AdminFeedbackProvider";
import { useAdminHeaderActions } from "../templates/AdminShell";

type LoadingState = "idle" | "loading" | "refreshing";
type AiPanelFilter = {
  scope: "date" | "model" | "function" | "user";
  value: string;
  label: string;
} | null;

type AiLinePoint = {
  key: string;
  label: string;
  values: Record<string, number | null>;
};

type AiLineSeries = {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
};

const AI_CACHE_STALE_MS = 5 * 60 * 1000;
const CHART_BAR_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-orange-500",
  "bg-sky-500",
];

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

function getAiCacheKey(month: string) {
  return `admin:ia:${month}`;
}

function getMonthDayCount(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function getDayOfMonth(date: string) {
  return Number(date.slice(8, 10));
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

function calculateKpiComparison(
  current: number | null,
  previous: number | null,
  label = "vs mes anterior",
  suffix?: string,
) {
  if (current === null || previous === null || previous <= 0) {
    return null;
  }

  const percent = Math.round(((current - previous) / previous) * 1000) / 10;
  const sign = percent > 0 ? "+" : "";
  return {
    primaryText: `${sign}${percent.toFixed(1)}% ${label}`,
    contextText: suffix ?? null,
    className: percent >= 0 ? "text-(--color-accent)" : "text-red-300",
  };
}

function roundCurrency(value: number) {
  return Math.round(value * 10000) / 10000;
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

type CostBarListProps<T extends AiAttributionBreakdown> = {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  emptyLabel: string;
  animated: boolean;
  selectedKey: string | null;
  onSelect: (key: string, label: string) => void;
};

function CostBarList<T extends AiAttributionBreakdown>({
  items,
  getKey,
  getLabel,
  emptyLabel,
  animated,
  selectedKey,
  onSelect,
}: CostBarListProps<T>) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
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
      {items.map((item, index) => {
        const itemKey = getKey(item);
        const width = Math.max(2, (item.estimatedCostUsd / maxCost) * 100);
        const isSelected = selectedKey === itemKey;
        const isDimmed = selectedKey !== null && !isSelected;
        const barColor = CHART_BAR_COLORS[index % CHART_BAR_COLORS.length];
        return (
          <div
            key={itemKey}
            className={`group relative transition-opacity ${
              isDimmed ? "opacity-35" : "opacity-100"
            }`}
          >
          <div className="mb-2 flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-semibold">
                {getLabel(item)}
              </p>
              <p className="mt-1 text-xs text-(--color-muted)">
                {integerFormatter.format(item.calls)} llamadas -{" "}
                {integerFormatter.format(item.tokens)} tokens
              </p>
            </div>
            <span className="shrink-0 font-semibold">
              {usdFormatter.format(item.estimatedCostUsd)}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              onSelect(itemKey, getLabel(item))
            }
            onFocus={() => setActiveKey(itemKey)}
            onBlur={() => setActiveKey(null)}
            className="relative block h-2 w-full cursor-pointer overflow-visible rounded-full bg-(--color-surface-2) text-left"
            aria-label={`${getLabel(item)}: ${usdFormatter.format(
              item.estimatedCostUsd,
            )}`}
          >
            <span
              className={`pointer-events-none absolute right-0 bottom-[calc(100%+8px)] z-20 rounded-md border border-(--color-border) bg-[#101a2d] px-2 py-1 text-[11px] font-semibold text-white shadow-lg transition-opacity ${
                activeKey === itemKey
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {usdFormatter.format(item.estimatedCostUsd)} estimados
            </span>
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
                style={{
                  width: animated ? `${width}%` : "0%",
                transitionDelay: `${index * 70}ms`,
              }}
            />
          </button>
          </div>
        );
      })}
    </div>
  );
}

function AiLineChart({
  points,
  series,
  valueFormatter,
  animated,
  emptyLabel,
  selectedKey = null,
  onSelect,
}: {
  points: AiLinePoint[];
  series: AiLineSeries[];
  valueFormatter: (value: number) => string;
  animated: boolean;
  emptyLabel: string;
  selectedKey?: string | null;
  onSelect?: (point: AiLinePoint) => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const width = 640;
  const height = 220;
  const padding = { top: 18, right: 18, bottom: 34, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = points.flatMap((point) =>
    series.map((item) => point.values[item.key] ?? 0),
  );
  const maxValue = Math.max(1, ...values);
  const activePoint =
    activeIndex === null ? null : (points[activeIndex] ?? null);

  if (points.length === 0) {
    return (
      <p className="mt-5 rounded-lg border border-dashed border-(--color-border) p-5 text-sm text-(--color-muted)">
        {emptyLabel}
      </p>
    );
  }

  const getX = (index: number) =>
    padding.left +
    (points.length === 1
      ? chartWidth / 2
      : (index / (points.length - 1)) * chartWidth);
  const getY = (value: number) =>
    padding.top + chartHeight - (value / maxValue) * chartHeight;
  const buildPath = (seriesKey: string) =>
    points
      .map((point, index) => {
        const value = point.values[seriesKey] ?? 0;
        return `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(value)}`;
      })
      .join(" ");

  return (
    <div className="relative mt-5 w-full min-w-0 max-w-full">
      {activePoint ? (
        <div className="pointer-events-none absolute top-2 left-1/2 z-20 w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-(--color-border) bg-[#101a2d] px-3 py-2 text-xs shadow-xl">
          <p className="font-semibold text-white">{activePoint.label}</p>
          <div className="mt-2 space-y-1">
            {series.map((item) => (
              <p
                key={item.key}
                className="flex items-center justify-between gap-4 text-(--color-muted)"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <strong className="text-foreground">
                  {valueFormatter(activePoint.values[item.key] ?? 0)}
                </strong>
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="w-full min-w-0 max-w-full overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-72 w-[560px] max-w-none overflow-visible sm:h-64 sm:w-full"
          role="img"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight - ratio * chartHeight;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(64,82,113,0.45)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[var(--color-muted)] text-[10px]"
                >
                  {valueFormatter(maxValue * ratio)}
                </text>
              </g>
            );
          })}

          {series.map((item) => (
            <path
              key={item.key}
              d={buildPath(item.key)}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={item.dashed ? "7 7" : "100"}
              strokeDashoffset={
                item.dashed ? undefined : animated ? "0" : "100"
              }
              pathLength={item.dashed ? undefined : 100}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          ))}

          {points.map((point, index) => {
            const isSelected = selectedKey === point.key;
            const isDimmed = selectedKey !== null && !isSelected;
            return (
              <g
                key={point.key}
                opacity={isDimmed ? 0.35 : 1}
                className="transition-opacity"
              >
                <rect
                  x={getX(index) - 12}
                  y={padding.top}
                  width={24}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`Filtrar ${point.label}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  onClick={() => {
                    setActiveIndex(index);
                    onSelect?.(point);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                      return;
                    }

                    event.preventDefault();
                    setActiveIndex(index);
                    onSelect?.(point);
                  }}
                />
                {series.map((item) => {
                  const value = point.values[item.key] ?? 0;
                  return (
                    <circle
                      key={item.key}
                      cx={getX(index)}
                      cy={getY(value)}
                      r={activeIndex === index || isSelected ? 5 : 3.5}
                      fill={item.color}
                      className={`pointer-events-none transition-[r] ${
                        isSelected ? "stroke-white/80 stroke-2" : ""
                      }`}
                    />
                  );
                })}
                {index % Math.max(1, Math.ceil(points.length / 8)) === 0 ? (
                  <text
                    x={getX(index)}
                    y={height - 9}
                    textAnchor="middle"
                    className="fill-[var(--color-muted)] text-[10px]"
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-(--color-muted)">
        {series.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2">
            <span
              className="h-2 w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminAiDashboard() {
  const router = useRouter();
  const { hideLoading, showLoading } = useAdminFeedback();
  const filterLoadingRef = useRef(false);
  const [currentMonth] = useState(getCurrentUtcMonth);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<AiUsageResponse | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [chartsAnimated, setChartsAnimated] = useState(false);
  const [activeDailyDate, setActiveDailyDate] = useState<string | null>(null);
  const [panelFilter, setPanelFilter] = useState<AiPanelFilter>(null);

  const togglePanelFilter = useCallback(
    (scope: NonNullable<AiPanelFilter>["scope"], value: string, label: string) => {
      setPanelFilter((current) =>
        current?.scope === scope && current.value === value
          ? null
          : { scope, value, label },
      );
    },
    [],
  );

  const finishFilterLoading = useCallback(() => {
    if (!filterLoadingRef.current) {
      return;
    }

    filterLoadingRef.current = false;
    hideLoading();
  }, [hideLoading]);

  useEffect(
    () => () => {
      filterLoadingRef.current = false;
      hideLoading();
    },
    [hideLoading],
  );

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
    const cacheKey = getAiCacheKey(month);
    const cached = readAdminCache<AiUsageResponse>(cacheKey);

    if (cached) {
      const isFresh = isAdminCacheFresh(cacheKey, AI_CACHE_STALE_MS);
      queueMicrotask(() => {
        if (!isActive) {
          return;
        }

        setData(cached.data);
        setErrorMessage("");
        setChartsAnimated(false);
        window.requestAnimationFrame(() => setChartsAnimated(true));
      });

      if (isFresh) {
        queueMicrotask(() => {
          if (isActive) {
            setLoadingState("idle");
            finishFilterLoading();
          }
        });
        return () => {
          isActive = false;
        };
      }

      queueMicrotask(() => {
        if (isActive) {
          setLoadingState("refreshing");
        }
      });
    } else {
      queueMicrotask(() => {
        if (!isActive) {
          return;
        }

        setLoadingState("loading");
      });
    }

    void getAdminAiUsage(month).then((result) => {
      if (!isActive) {
        return;
      }

      if (!result.success) {
        if (handleAuthorizationError(result.code)) {
          finishFilterLoading();
        } else {
          setErrorMessage(result.message);
          setLoadingState("idle");
          finishFilterLoading();
        }
        return;
      }

      writeAdminCache(cacheKey, result.data);
      setChartsAnimated(false);
      setData(result.data);
      window.requestAnimationFrame(() => setChartsAnimated(true));
      setLoadingState("idle");
      finishFilterLoading();
    });

    return () => {
      isActive = false;
    };
  }, [finishFilterLoading, handleAuthorizationError, month]);

  const handleMonthChange = (nextMonth: string) => {
    if (!nextMonth || nextMonth > currentMonth || nextMonth === month) {
      return;
    }

    setErrorMessage("");
    filterLoadingRef.current = true;
    showLoading("Cargando datos de IA...");
    setLoadingState(
      readAdminCache<AiUsageResponse>(getAiCacheKey(nextMonth))
        ? "refreshing"
        : "loading",
    );
    setMonth(nextMonth);
  };

  const handleRefresh = useCallback(async () => {
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

    writeAdminCache(getAiCacheKey(month), result.data);
    setChartsAnimated(false);
    setData(result.data);
    window.requestAnimationFrame(() => setChartsAnimated(true));
    setLoadingState("idle");
  }, [handleAuthorizationError, month]);

  const handleExport = useCallback(async () => {
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
  }, [handleAuthorizationError, isExporting, month]);

  const headerActions = useMemo(
    () => (
      <>
        <button
          type="button"
          title="Actualizar datos"
          onClick={() => void handleRefresh()}
          disabled={loadingState !== "idle"}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm font-semibold text-(--color-muted) transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={loadingState === "refreshing" ? "animate-spin" : ""}
          />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
        <button
          type="button"
          title="Descargar CSV"
          onClick={() => void handleExport()}
          disabled={isExporting}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-(--color-accent) px-3 text-sm font-semibold text-(--color-accent-contrast) transition-colors hover:bg-(--color-accent-strong) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
          CSV
        </button>
      </>
    ),
    [handleExport, handleRefresh, isExporting, loadingState],
  );
  useAdminHeaderActions(headerActions);

  const maxDailyCost = useMemo(
    () =>
      Math.max(
        0.000001,
        ...(data?.daily.map((day) => day.officialCostUsd) ?? []),
      ),
    [data],
  );
  const displayedDaily = useMemo(() => {
    if (!data || panelFilter?.scope !== "date") {
      return data?.daily ?? [];
    }

    return data.daily.filter((day) => day.date === panelFilter.value);
  }, [data, panelFilter]);
  const displayedModels = useMemo(() => {
    if (!data || panelFilter?.scope !== "model") {
      return data?.byModel ?? [];
    }

    return data.byModel.filter((item) => item.model === panelFilter.value);
  }, [data, panelFilter]);
  const displayedFunctions = useMemo(() => {
    if (!data || panelFilter?.scope !== "function") {
      return data?.byFunction ?? [];
    }

    return data.byFunction.filter(
      (item) => item.functionName === panelFilter.value,
    );
  }, [data, panelFilter]);
  const displayedTopUsers = useMemo(() => {
    if (!data || panelFilter?.scope !== "user") {
      return data?.topUsers ?? [];
    }

    return data.topUsers.filter((user) => user.userId === panelFilter.value);
  }, [data, panelFilter]);
  const displayedSummary = useMemo(() => {
    if (!data || panelFilter?.scope !== "date") {
      return data?.summary ?? null;
    }

    const day = data.daily.find((item) => item.date === panelFilter.value);
    if (!day) {
      return data.summary;
    }

    return {
      ...data.summary,
      officialCalls: day.officialCalls,
      officialCompletionCalls: day.officialCompletionCalls,
      officialTranscriptionCalls: day.officialTranscriptionCalls,
      officialInputTokens: day.officialInputTokens,
      officialCachedInputTokens: day.officialCachedInputTokens,
      officialOutputTokens: day.officialOutputTokens,
      officialTotalTokens: day.officialTokens,
      officialCostUsd: day.officialCostUsd,
      attributedCalls: day.attributedCalls,
      attributedTokens: day.attributedTokens,
      estimatedAttributedCostUsd: day.estimatedCostUsd,
    };
  }, [data, panelFilter]);
  const cumulativeCostPoints = useMemo<AiLinePoint[]>(() => {
    if (!data) {
      return [];
    }

    const monthDayCount = getMonthDayCount(data.range.month);
    let cumulativeCost = 0;
    return data.daily.map((day) => {
      cumulativeCost = roundCurrency(cumulativeCost + day.officialCostUsd);
      const dayOfMonth = getDayOfMonth(day.date);
      const expectedBudget =
        data.budget.limitUsd === null
          ? null
          : roundCurrency((data.budget.limitUsd * dayOfMonth) / monthDayCount);

      return {
        key: day.date,
        label: shortDateFormatter.format(new Date(`${day.date}T00:00:00Z`)),
        values: {
          cumulative: cumulativeCost,
          expected: expectedBudget,
        },
      };
    });
  }, [data]);
  const monthComparisonPoints = useMemo<AiLinePoint[]>(() => {
    if (!data) {
      return [];
    }

    const previousDailyByDay = new Map(
      data.comparison.previousMonth?.daily.map((day) => [
        getDayOfMonth(day.date),
        day,
      ]) ?? [],
    );
    return data.daily.map((day) => {
      const dayOfMonth = getDayOfMonth(day.date);
      const previousDay = previousDailyByDay.get(dayOfMonth);
      return {
        key: day.date,
        label: `Dia ${dayOfMonth}`,
        values: {
          current: day.officialCostUsd,
          previous: previousDay?.officialCostUsd ?? null,
        },
      };
    });
  }, [data]);
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
    <div className="min-w-0 space-y-8 overflow-x-hidden">
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

        {panelFilter ? (
          <div className="flex min-h-11 w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm md:w-auto md:min-w-[360px]">
            <span className="text-(--color-muted)">
              Filtro activo:{" "}
              <strong className="text-foreground">{panelFilter.label}</strong>
            </span>
            <button
              type="button"
              onClick={() => setPanelFilter(null)}
              className="cursor-pointer font-semibold text-(--color-accent) hover:text-(--color-accent-strong)"
            >
              Limpiar filtro
            </button>
          </div>
        ) : null}
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
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Costo oficial",
                value: usdFormatter.format(
                  displayedSummary?.officialCostUsd ?? 0,
                ),
                hint: "OpenAI Costs",
                icon: WalletCards,
                iconClassName: "bg-emerald-500/15 text-emerald-300",
                valueClassName: "text-emerald-200",
                comparison: panelFilter
                  ? null
                  : calculateKpiComparison(
                      displayedSummary?.officialCostUsd ?? 0,
                      data.comparison.previousMonth?.summary.officialCostUsd ??
                        null,
                      "vs mes anterior",
                      "OpenAI Costs",
                    ),
              },
              {
                label: "Llamadas oficiales",
                value: integerFormatter.format(
                  displayedSummary?.officialCalls ?? 0,
                ),
                hint: `${integerFormatter.format(
                  displayedSummary?.officialCompletionCalls ?? 0,
                )} completions - ${integerFormatter.format(
                  displayedSummary?.officialTranscriptionCalls ?? 0,
                )} Whisper`,
                icon: BrainCircuit,
                iconClassName: "bg-blue-500/15 text-blue-300",
                comparison: panelFilter
                  ? null
                  : calculateKpiComparison(
                      displayedSummary?.officialCalls ?? 0,
                      data.comparison.previousMonth?.summary.officialCalls ??
                        null,
                      "vs mes anterior",
                      `${integerFormatter.format(
                        displayedSummary?.officialCompletionCalls ?? 0,
                      )} completions - ${integerFormatter.format(
                        displayedSummary?.officialTranscriptionCalls ?? 0,
                      )} Whisper`,
                    ),
              },
              {
                label: "Tokens de entrada",
                value: integerFormatter.format(
                  displayedSummary?.officialInputTokens ?? 0,
                ),
                hint: "Uso oficial de OpenAI",
                icon: Database,
                iconClassName: "bg-cyan-500/15 text-cyan-300",
                comparison: panelFilter
                  ? null
                  : calculateKpiComparison(
                      displayedSummary?.officialInputTokens ?? 0,
                      data.comparison.previousMonth?.summary
                        .officialInputTokens ?? null,
                      "vs mes anterior",
                      "Uso oficial de OpenAI",
                    ),
              },
              {
                label: "Tokens en cache",
                value: integerFormatter.format(
                  displayedSummary?.officialCachedInputTokens ?? 0,
                ),
                hint: "Incluidos en tokens de entrada",
                icon: Database,
                iconClassName: "bg-violet-500/15 text-violet-300",
                comparison: null,
              },
              {
                label: "Tokens de salida",
                value: integerFormatter.format(
                  displayedSummary?.officialOutputTokens ?? 0,
                ),
                hint: "Uso oficial de OpenAI",
                icon: Database,
                iconClassName: "bg-amber-500/15 text-amber-300",
                comparison: panelFilter
                  ? null
                  : calculateKpiComparison(
                      displayedSummary?.officialOutputTokens ?? 0,
                      data.comparison.previousMonth?.summary
                        .officialOutputTokens ?? null,
                      "vs mes anterior",
                      "Uso oficial de OpenAI",
                    ),
              },
              {
                label: "Costo atribuido",
                value: usdFormatter.format(
                  displayedSummary?.estimatedAttributedCostUsd ?? 0,
                ),
                hint: "Estimado desde telemetria",
                icon: Users,
                iconClassName: "bg-lime-500/15 text-lime-300",
                valueClassName: "text-lime-200",
                comparison: panelFilter
                  ? null
                  : calculateKpiComparison(
                      displayedSummary?.estimatedAttributedCostUsd ?? 0,
                      data.comparison.previousMonth?.summary
                        .estimatedAttributedCostUsd ?? null,
                      "vs mes anterior",
                      "Estimado desde telemetria",
                    ),
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
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${metric.iconClassName}`}
                    >
                      <Icon size={18} />
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-2xl font-semibold ${metric.valueClassName ?? ""}`}
                  >
                    {metric.value}
                  </p>
                  {metric.comparison ? (
                    <p className="mt-1 truncate text-xs text-(--color-muted)">
                      <span
                        className={`font-semibold ${metric.comparison.className}`}
                      >
                        {metric.comparison.primaryText}
                      </span>
                      {metric.comparison.contextText ? (
                        <span> - {metric.comparison.contextText}</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 truncate text-xs text-(--color-muted)">
                      {metric.hint}
                    </p>
                  )}
                </article>
              );
            })}
          </section>

          <section className="grid gap-4 border-y border-(--color-border) py-7 xl:grid-cols-[1.05fr_1.25fr]">
            <article className="min-w-0 overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-(--color-muted)">
                    Cobertura de atribucion
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Oficial vs estimado
                  </h2>
                </div>
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">
                  Telemetria interna
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  {
                    label: "Llamadas",
                    percent: data.attributionCoverage.callsPercent,
                    value: integerFormatter.format(
                      data.attributionCoverage.attributedCalls,
                    ),
                    total: integerFormatter.format(
                      data.attributionCoverage.officialCalls,
                    ),
                    color: "#60a5fa",
                    textClassName: "text-blue-200",
                  },
                  {
                    label: "Tokens",
                    percent: data.attributionCoverage.tokensPercent,
                    value: integerFormatter.format(
                      data.attributionCoverage.attributedTokens,
                    ),
                    total: integerFormatter.format(
                      data.attributionCoverage.officialTokens,
                    ),
                    color: "#22d3ee",
                    textClassName: "text-cyan-200",
                  },
                  {
                    label: "Costo",
                    percent: data.attributionCoverage.costPercent,
                    value: usdFormatter.format(
                      data.attributionCoverage.estimatedCostUsd,
                    ),
                    total: usdFormatter.format(
                      data.attributionCoverage.officialCostUsd,
                    ),
                    color: "#a3e635",
                    textClassName: "text-lime-200",
                  },
                ].map((item) => {
                  const percent = Math.min(
                    100,
                    Math.max(0, item.percent ?? 0),
                  );
                  const radius = 34;
                  const circumference = 2 * Math.PI * radius;
                  const progressOffset =
                    circumference -
                    ((chartsAnimated ? percent : 0) / 100) * circumference;
                  return (
                    <div
                      key={item.label}
                      className="min-w-0 rounded-lg bg-(--color-surface-2) p-4"
                    >
                      <div className="flex min-w-0 flex-col items-center text-center">
                        <div className="relative h-24 w-24 shrink-0">
                          <svg
                            viewBox="0 0 88 88"
                            className="-rotate-90"
                            aria-hidden="true"
                          >
                            <circle
                              cx="44"
                              cy="44"
                              r={radius}
                              fill="none"
                              stroke="rgba(64, 82, 113, 0.42)"
                              strokeWidth="10"
                            />
                            <circle
                              cx="44"
                              cy="44"
                              r={radius}
                              fill="none"
                              stroke={item.color}
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={progressOffset}
                              className="transition-[stroke-dashoffset] duration-700 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 grid place-items-center">
                            <span
                              className={`text-sm font-bold ${item.textClassName}`}
                            >
                              {formatPercent(item.percent)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 min-w-0">
                          <p className="truncate text-xs font-semibold uppercase text-(--color-muted)">
                            {item.label}
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold">
                            {item.value}
                          </p>
                          <p className="mt-1 truncate text-xs text-(--color-muted)">
                            de {item.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </article>

            <article className="min-w-0 overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-(--color-muted)">
                    Presupuesto mensual
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Control de gasto IA
                  </h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    data.budget.usedPercent !== null &&
                    data.budget.usedPercent >= 90
                      ? "bg-orange-500/15 text-orange-200"
                      : "bg-emerald-500/15 text-emerald-200"
                  }`}
                >
                  {budgetState.label}
                </span>
              </div>

              {data.budget.limitUsd === null ? (
                <p className="mt-5 rounded-lg border border-dashed border-(--color-border) p-4 text-sm text-(--color-muted)">
                  Define un presupuesto mensual para activar el seguimiento.
                </p>
              ) : (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-(--color-surface-2) p-4">
                      <p className="text-xs text-(--color-muted)">Gastado</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-200">
                        {usdFormatter.format(data.budget.spentUsd)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-(--color-surface-2) p-4">
                      <p className="text-xs text-(--color-muted)">Disponible</p>
                      <p className="mt-2 text-2xl font-bold text-blue-200">
                        {usdFormatter.format(data.budget.remainingUsd ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-(--color-surface-2) p-4">
                      <p className="text-xs text-(--color-muted)">Limite</p>
                      <p className="mt-2 text-2xl font-bold">
                        {usdFormatter.format(data.budget.limitUsd)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-(--color-muted)">
                        Consumo
                      </span>
                      <span className="font-semibold">
                        {formatPercent(data.budget.usedPercent)}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-4 overflow-hidden rounded-full bg-(--color-surface-2)">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#10b981_0%,#84cc16_45%,#f59e0b_70%,#f97316_90%,#ef4444_100%)] transition-[width] duration-700 ease-out"
                          style={{
                            width: chartsAnimated ? `${budgetWidth}%` : "0%",
                          }}
                        />
                      </div>
                      {[
                        { label: "70%", left: "70%", className: "text-amber-300" },
                        { label: "90%", left: "90%", className: "text-orange-300" },
                        { label: "100%", left: "100%", className: "text-red-300" },
                      ].map((mark) => (
                        <span
                          key={mark.label}
                          className="pointer-events-none absolute top-[-4px] h-6 w-px bg-white/45"
                          style={{ left: mark.left }}
                        />
                      ))}
                    </div>
                    <div className="relative mt-2 h-5 text-[10px] font-semibold text-(--color-muted)">
                      {[
                        { label: "70%", left: "70%", className: "text-amber-300" },
                        { label: "90%", left: "90%", className: "text-orange-300" },
                        { label: "100%", left: "100%", className: "text-red-300" },
                      ].map((mark) => (
                        <span
                          key={mark.label}
                          className={`absolute -translate-x-1/2 ${mark.className}`}
                          style={{ left: mark.left }}
                        >
                          {mark.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </article>
          </section>

          <section className="grid w-full min-w-0 max-w-full gap-4 overflow-hidden xl:grid-cols-2">
            <article className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-(--color-muted)">
                    Tendencia de gasto
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Gasto acumulado
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {data.range.label}
                </span>
              </div>
              <AiLineChart
                points={cumulativeCostPoints}
                animated={chartsAnimated}
                selectedKey={
                  panelFilter?.scope === "date" ? panelFilter.value : null
                }
                onSelect={(point) =>
                  togglePanelFilter("date", point.key, `Fecha ${point.key}`)
                }
                valueFormatter={(value) => usdFormatter.format(value)}
                emptyLabel="Sin gasto acumulado para este mes."
                series={[
                  {
                    key: "cumulative",
                    label: "Gasto acumulado",
                    color: "#34d399",
                  },
                  {
                    key: "expected",
                    label: "Presupuesto esperado",
                    color: "#f59e0b",
                    dashed: true,
                  },
                ]}
              />
            </article>

            <article className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-(--color-muted)">
                    Comparativo mensual
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Actual vs mes anterior
                  </h2>
                </div>
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">
                  Por dia del mes
                </span>
              </div>
              <AiLineChart
                points={monthComparisonPoints}
                animated={chartsAnimated}
                selectedKey={
                  panelFilter?.scope === "date" ? panelFilter.value : null
                }
                onSelect={(point) =>
                  togglePanelFilter("date", point.key, `Fecha ${point.key}`)
                }
                valueFormatter={(value) => usdFormatter.format(value)}
                emptyLabel="Sin datos para comparar contra el mes anterior."
                series={[
                  {
                    key: "current",
                    label: data.range.label,
                    color: "#60a5fa",
                  },
                  {
                    key: "previous",
                    label:
                      data.comparison.previousMonth?.range.label ??
                      "Mes anterior",
                    color: "#a78bfa",
                  },
                ]}
              />
            </article>
          </section>

          <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
            <p className="text-xs font-semibold uppercase text-(--color-muted)">
              Gasto oficial diario
            </p>
            <h2 className="mt-2 text-xl font-semibold">{data.range.label}</h2>
            {data.daily.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-(--color-border) p-5 text-sm text-(--color-muted)">
                Sin datos diarios para este mes.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto pb-2">
                <div
                  className="grid min-w-[720px] items-end gap-2 pt-8"
                  style={{
                    gridTemplateColumns: `repeat(${data.daily.length}, minmax(28px, 1fr))`,
                  }}
                >
                  {data.daily.map((day) => {
                    const isSelected =
                      panelFilter?.scope === "date" &&
                      panelFilter.value === day.date;
                    const isDimmed =
                      panelFilter?.scope === "date" && !isSelected;
                    return (
                      <button
                        type="button"
                        key={day.date}
                        onClick={() => {
                          setActiveDailyDate(day.date);
                          togglePanelFilter(
                            "date",
                            day.date,
                            `Fecha ${day.date}`,
                          );
                        }}
                        onFocus={() => setActiveDailyDate(day.date)}
                        onBlur={() => setActiveDailyDate(null)}
                        className={`group relative flex cursor-pointer flex-col items-center gap-2 text-left transition-opacity ${
                          isDimmed ? "opacity-35" : "opacity-100"
                        }`}
                        aria-label={`${day.date}: ${usdFormatter.format(
                          day.officialCostUsd,
                        )} oficial`}
                      >
                        <span
                          className={`pointer-events-none absolute top-0 left-1/2 z-20 w-max max-w-44 -translate-x-1/2 rounded-md border border-(--color-border) bg-[#101a2d] px-2 py-1 text-center text-[11px] font-semibold text-white shadow-lg transition-opacity ${
                            activeDailyDate === day.date
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {shortDateFormatter.format(
                            new Date(`${day.date}T00:00:00Z`),
                          )}
                          : {usdFormatter.format(day.officialCostUsd)}
                        </span>
                        <div className="flex h-36 w-full items-end justify-center rounded-sm bg-(--color-surface-2)">
                          <div
                            className={`w-full max-w-8 rounded-t-sm bg-emerald-500 transition-[height] duration-700 ease-out ${
                              isSelected ? "ring-2 ring-white/60" : ""
                            }`}
                            style={{
                              height: chartsAnimated
                                ? `${Math.max(
                                    2,
                                    (day.officialCostUsd / maxDailyCost) *
                                      144,
                                  )}px`
                                : "0px",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-(--color-muted)">
                          {shortDateFormatter.format(
                            new Date(`${day.date}T00:00:00Z`),
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </article>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Atribucion estimada
              </p>
              <h2 className="mt-2 text-xl font-semibold">Gasto por modelo</h2>
              <div className="mt-5">
                <CostBarList
                  items={displayedModels}
                  getKey={(item) => item.model}
                  getLabel={(item) => item.model}
                  emptyLabel="Sin atribucion por modelo."
                  animated={chartsAnimated}
                  selectedKey={
                    panelFilter?.scope === "model" ? panelFilter.value : null
                  }
                  onSelect={(key, label) =>
                    togglePanelFilter("model", key, `Modelo ${label}`)
                  }
                />
              </div>
            </article>
            <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Atribucion estimada
              </p>
              <h2 className="mt-2 text-xl font-semibold">Gasto por funcion</h2>
              <div className="mt-5">
                <CostBarList
                  items={displayedFunctions}
                  getKey={(item) => item.functionName}
                  getLabel={(item) => item.functionName}
                  emptyLabel="Sin atribucion por funcion."
                  animated={chartsAnimated}
                  selectedKey={
                    panelFilter?.scope === "function"
                      ? panelFilter.value
                      : null
                  }
                  onSelect={(key, label) =>
                    togglePanelFilter("function", key, `Funcion ${label}`)
                  }
                />
              </div>
            </article>
          </section>

          <section className="border-t border-(--color-border) pt-8">
            <div>
              <p className="text-xs font-semibold uppercase text-(--color-muted)">
                Usuarios
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Mayor costo estimado
              </h2>
            </div>
            <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-(--color-border)">
              <table className="w-full min-w-[760px] text-left">
                <thead className="sticky top-0 z-10 bg-(--color-surface-2)">
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
                  {displayedTopUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-sm text-(--color-muted)"
                      >
                        Sin usuarios atribuibles en el mes.
                      </td>
                    </tr>
                  ) : (
                    displayedTopUsers.map((user) => (
                      <tr
                        key={user.userId}
                        onClick={() =>
                          togglePanelFilter("user", user.userId, user.email)
                        }
                        className="cursor-pointer border-t border-(--color-border) transition-colors hover:bg-(--color-surface-2)"
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
                        <td className="px-4 py-3 text-sm text-blue-200">
                          {integerFormatter.format(user.calls)}
                        </td>
                        <td className="px-4 py-3 text-sm text-cyan-200">
                          {integerFormatter.format(user.tokens)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-300">
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
            <div className="mt-4 max-h-[520px] overflow-auto rounded-lg border border-(--color-border)">
              <table className="w-full min-w-[1120px] text-left">
                <thead className="sticky top-0 z-10 bg-(--color-surface-2)">
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
                  {displayedDaily.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-6 text-center text-sm text-(--color-muted)"
                      >
                        Sin datos diarios.
                      </td>
                    </tr>
                  ) : (
                    displayedDaily.map((day) => (
                      <tr
                        key={day.date}
                        className="border-t border-(--color-border)"
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-blue-100">
                          {day.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-200">
                          {integerFormatter.format(
                            day.officialCompletionCalls,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-violet-200">
                          {integerFormatter.format(
                            day.officialTranscriptionCalls,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-cyan-200">
                          {integerFormatter.format(day.officialInputTokens)}
                        </td>
                        <td className="px-4 py-3 text-sm text-purple-200">
                          {integerFormatter.format(
                            day.officialCachedInputTokens,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-amber-200">
                          {integerFormatter.format(day.officialOutputTokens)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-sky-200">
                          {integerFormatter.format(day.officialTokens)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-emerald-300">
                          {usdFormatter.format(day.officialCostUsd)}
                        </td>
                        <td className="px-4 py-3 text-sm text-lime-200">
                          {integerFormatter.format(day.attributedCalls)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-lime-300">
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
