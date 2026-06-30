"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, BrainCircuit, ChartNoAxesCombined, RefreshCw, TrendingUp, UserCheck, Users, WalletCards } from "lucide-react";
import type { AdminDashboardBar, AdminDashboardSummary } from "@/src/lib/admin-dashboard/types";
import { getAdminDashboard } from "@/src/lib/appwrite/admin-dashboard";
import {
  isAdminCacheFresh,
  readAdminCache,
  writeAdminCache,
} from "@/src/lib/admin-cache/client";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { AdminFinanceSection } from "./AdminFinanceSection";
import { useAdminHeaderActions } from "../templates/AdminShell";

const integer = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const DASHBOARD_CACHE_STALE_MS = 60 * 1000;
type DashboardPanelFilter = {
  group: "growth" | "ai" | "funnel" | "finance";
  value: string;
  label: string;
} | null;
const DASHBOARD_BAR_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-orange-500",
  "bg-sky-500",
];

function getDashboardCacheKey(weeks: number) {
  return `admin:dashboard:${weeks}`;
}

function Kpi({ title, value, hint, icon: Icon, tone = "accent" }: { title: string; value: string; hint: string; icon: typeof Users; tone?: "accent" | "blue" | "amber" | "green" }) {
  const colors = { accent: "bg-(--color-accent-soft) text-(--color-accent)", blue: "bg-blue-500/15 text-blue-300", amber: "bg-amber-500/15 text-amber-300", green: "bg-emerald-500/15 text-emerald-300" }[tone];
  return <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm text-(--color-muted)">{title}</p><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors}`}><Icon size={17} /></span></div><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-(--color-muted)">{hint}</p></article>;
}

function Bars({ items, animated, money = false, selectedKey = null, onSelect }: { items: AdminDashboardBar[]; animated: boolean; money?: boolean; selectedKey?: string | null; onSelect?: (item: AdminDashboardBar) => void }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const labelInterval = items.length >= 24 ? 3 : items.length >= 12 ? 2 : 1;
  if (items.length === 0) return <p className="mt-6 rounded-lg border border-dashed border-(--color-border) p-6 text-sm text-(--color-muted)">No hay datos disponibles para este periodo.</p>;
  return <div className="mt-4 h-56 min-w-0 border-b border-(--color-border) px-1 pt-10"><div className="flex h-full items-end gap-1.5 sm:gap-2">{items.map((item, index) => { const height = Math.max(6, (item.value / max) * 100); const isSelected = selectedKey === item.label; const isDimmed = selectedKey !== null && !isSelected; const color = index === items.length - 1 ? "bg-(--color-accent)" : "bg-[#2a3a55]"; return <button key={item.label} type="button" onClick={() => onSelect?.(item)} className={`group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-end gap-2 text-left transition-opacity focus:outline-none ${isDimmed ? "opacity-35" : "opacity-100"}`}><span className="pointer-events-none absolute top-0 left-1/2 z-20 w-max max-w-40 -translate-x-1/2 rounded-md border border-(--color-border) bg-[#101a2d] px-2 py-1 text-center text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{item.label}: {money ? usd.format(item.value) : integer.format(item.value)}</span><div className="flex flex-1 items-end"><div className={`w-full rounded-t-md transition-[height] duration-700 ease-out ${color} ${isSelected ? "ring-2 ring-white/60" : ""}`} style={{ height: animated ? `${height}%` : "0%", transitionDelay: `${index * 55}ms` }} /></div><span className="h-3 truncate text-center text-[10px] text-(--color-muted)">{index % labelInterval === 0 ? item.label : ""}</span></button>; })}</div></div>;
}

function HorizontalBars({ items, animated, selectedKey = null, onSelect }: { items: AdminDashboardBar[]; animated: boolean; selectedKey?: string | null; onSelect?: (item: AdminDashboardBar) => void }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (items.length === 0) return <p className="mt-6 rounded-lg border border-dashed border-(--color-border) p-6 text-sm text-(--color-muted)">Sin telemetria de IA para este periodo.</p>;
  return <div className="mt-6 space-y-4">{items.map((item, index) => { const isSelected = selectedKey === item.label; const isDimmed = selectedKey !== null && !isSelected; const color = DASHBOARD_BAR_COLORS[index % DASHBOARD_BAR_COLORS.length]; return <button key={item.label} type="button" onClick={() => onSelect?.(item)} className={`group relative block w-full cursor-pointer text-left transition-opacity focus:outline-none ${isDimmed ? "opacity-35" : "opacity-100"}`}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="truncate font-mono text-xs font-semibold">{item.label}</span><span className="text-xs text-(--color-muted)">{integer.format(item.value)}</span></div><span className="pointer-events-none absolute right-0 bottom-[-27px] z-20 rounded-md border border-(--color-border) bg-[#101a2d] px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{integer.format(item.value)} llamadas atribuidas</span><div className="h-2 overflow-hidden rounded-full bg-(--color-surface-2)"><div className={`h-full rounded-full transition-[width] duration-700 ${color} ${isSelected ? "ring-2 ring-white/60" : ""}`} style={{ width: animated ? `${Math.max(3, item.value / max * 100)}%` : "0%", transitionDelay: `${index * 70}ms` }} /></div></button>; })}</div>;
}

export function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [weeks, setWeeks] = useState<8 | 12 | 24>(8);
  const [loading, setLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [error, setError] = useState("");
  const [showFinance, setShowFinance] = useState(false);
  const [dashboardFilter, setDashboardFilter] =
    useState<DashboardPanelFilter>(null);

  const toggleDashboardFilter = useCallback(
    (group: NonNullable<DashboardPanelFilter>["group"], value: string, label: string) => {
      setDashboardFilter((current) =>
        current?.group === group && current.value === value
          ? null
          : { group, value, label },
      );
    },
    [],
  );

  useEffect(() => {
    let active = true;
    const cacheKey = getDashboardCacheKey(weeks);
    const cached = readAdminCache<AdminDashboardSummary>(cacheKey);

    if (cached) {
      const isFresh = isAdminCacheFresh(cacheKey, DASHBOARD_CACHE_STALE_MS);
      queueMicrotask(() => {
        if (!active) return;
        setAnimated(false);
        setData(cached.data);
        requestAnimationFrame(() => setAnimated(true));
        setRangeLoading(!isFresh);
      });

      if (isFresh) {
        queueMicrotask(() => {
          if (active) setLoading(false);
        });
        return () => { active = false; };
      }
    } else {
      queueMicrotask(() => {
        if (!active) return;
        setRangeLoading(true);
        setLoading(true);
      });
    }

    void getAdminDashboard(weeks).then((result) => {
      if (!active) return;
      if (!result.success) {
        if (result.code === "NO_SESSION") router.replace(buildLoginHref("/admin"));
        else if (result.code === "FORBIDDEN") router.replace(`${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin")}`);
        else setError(result.message);
      } else {
        writeAdminCache(cacheKey, result.data);
        setAnimated(false);
        setData(result.data);
        requestAnimationFrame(() => setAnimated(true));
      }
      setLoading(false);
      setRangeLoading(false);
    });
    return () => { active = false; };
  }, [router, weeks]);

  const refresh = useCallback(async () => {
    setRefreshing(true); setError("");
    const result = await getAdminDashboard(weeks, true);
    if (result.success) { writeAdminCache(getDashboardCacheKey(weeks), result.data); setAnimated(false); setData(result.data); requestAnimationFrame(() => setAnimated(true)); }
    else setError(result.message);
    setRefreshing(false);
  }, [weeks]);

  const headerActions = useMemo(() => (
    <button type="button" title="Actualizar datos" onClick={() => void refresh()} disabled={refreshing} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-(--color-surface-2) px-3 text-sm font-semibold hover:bg-[#243653] disabled:cursor-wait"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /><span className="hidden sm:inline">Actualizar</span></button>
  ), [refresh, refreshing]);
  useAdminHeaderActions(headerActions);

  const funnel = useMemo(() => !data ? [] : [["Cuentas creadas", data.activation.created], ["Correo verificado", data.activation.verified], ["Onboarding completo", data.activation.onboardingComplete], ["Primera comida", data.activation.firstMealLogged]] as const, [data]);
  if (loading && !data) return <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-36 rounded-lg border border-(--color-border) bg-(--color-surface)" />)}</div>;
  if (!data) return <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">{error || "No se pudo cargar el dashboard."}</div>;
  const base = Math.max(1, data.activation.created);

  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) pb-4"><p className="text-sm text-(--color-muted)">Resumen operativo - {data.month}</p></div>
    {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}{data.warnings.length ? <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Datos parciales: {data.warnings.join(" ")}</p> : null}{dashboardFilter ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm"><span className="text-(--color-muted)">Filtro activo: <strong className="text-foreground">{dashboardFilter.label}</strong></span><button type="button" onClick={() => setDashboardFilter(null)} className="cursor-pointer font-semibold text-(--color-accent) hover:text-(--color-accent-strong)">Limpiar filtro</button></div> : null}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><Kpi title="Usuarios totales" value={integer.format(data.summary.totalUsers)} hint="proyeccion actual" icon={Users} tone="blue" /><Kpi title="Activos hoy" value={integer.format(data.summary.activeToday)} hint={`${integer.format(data.retention.active7Days)} en 7 dias`} icon={Activity} /><Kpi title="Premium" value={integer.format(data.summary.premiumUsers)} hint="acceso Premium activo" icon={UserCheck} tone="green" /><Kpi title="MRR estimado" value={usd.format(data.summary.estimatedMrrUsd)} hint="sin cobro Stripe" icon={WalletCards} tone="green" /><Kpi title="Llamadas IA" value={data.summary.aiCalls === null ? "Sin dato" : integer.format(data.summary.aiCalls)} hint="telemetria atribuida" icon={BrainCircuit} tone="amber" /><Kpi title="Costo IA" value={data.summary.aiCostUsd === null ? "Sin dato" : usd.format(data.summary.aiCostUsd)} hint="estimado este mes" icon={ChartNoAxesCombined} tone="amber" /></section>
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)]"><article className="min-w-0 rounded-lg border border-(--color-border) bg-(--color-surface) p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">Crecimiento de usuarios</h2><p className="mt-1 text-xs text-(--color-muted)">Nuevos registros por semana</p>{rangeLoading ? <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-(--color-accent)"><RefreshCw size={13} className="animate-spin" />Cargando rango...</p> : null}</div><div className="flex rounded-lg bg-(--color-surface-2) p-1">{([8, 12, 24] as const).map((value) => <button key={value} type="button" onClick={() => { if (value !== weeks) { setRangeLoading(true); setLoading(!readAdminCache<AdminDashboardSummary>(getDashboardCacheKey(value))); setWeeks(value); } }} className={`h-7 cursor-pointer rounded-md px-2 text-xs ${weeks === value ? "bg-(--color-accent) font-bold text-(--color-accent-contrast)" : "text-(--color-muted)"}`}>{value} sem.</button>)}</div></div><Bars items={data.growth} animated={animated} selectedKey={dashboardFilter?.group === "growth" ? dashboardFilter.value : null} onSelect={(item) => toggleDashboardFilter("growth", item.label, `Semana ${item.label}`)} /></article><article className="min-w-0 rounded-lg border border-(--color-border) bg-(--color-surface) p-5"><div className="flex items-start justify-between"><div><h2 className="font-bold">Uso de IA</h2><p className="mt-1 text-xs text-(--color-muted)">Llamadas por Function</p></div><BrainCircuit size={19} className="text-(--color-accent)" /></div><HorizontalBars items={data.aiByFunction} animated={animated} selectedKey={dashboardFilter?.group === "ai" ? dashboardFilter.value : null} onSelect={(item) => toggleDashboardFilter("ai", item.label, `Funcion ${item.label}`)} /></article></section>
    <section className="grid gap-4 xl:grid-cols-2">
      <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="font-bold">Embudo de activacion</h2>
            <p className="mt-1 text-xs text-(--color-muted)">
              De registro a primera comida
            </p>
          </div>
          <UserCheck size={19} className="text-(--color-accent)" />
        </div>
        <div className="mt-6 space-y-4">
          {funnel.map(([label, value], index) => {
            const isSelected =
              dashboardFilter?.group === "funnel" &&
              dashboardFilter.value === label;
            const isDimmed = dashboardFilter?.group === "funnel" && !isSelected;
            const color = DASHBOARD_BAR_COLORS[index % DASHBOARD_BAR_COLORS.length];
            return (
              <button
                key={label}
                type="button"
                onClick={() =>
                  toggleDashboardFilter("funnel", label, `Embudo ${label}`)
                }
                className={`group relative block w-full cursor-pointer text-left transition-opacity focus:outline-none ${
                  isDimmed ? "opacity-35" : "opacity-100"
                }`}
              >
                <div className="mb-2 flex justify-between text-sm">
                  <span>{label}</span>
                  <strong>
                    {integer.format(value)} - {Math.round((value / base) * 100)}
                    %
                  </strong>
                </div>
                <span className="pointer-events-none absolute right-0 bottom-[-27px] z-20 rounded-md border border-(--color-border) bg-[#101a2d] px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {integer.format(value)} usuarios en esta etapa
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-(--color-surface-2)">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${color} ${
                      isSelected ? "ring-2 ring-white/60" : ""
                    }`}
                    style={{
                      width: animated
                        ? `${Math.max(value ? 3 : 0, (value / base) * 100)}%`
                        : "0%",
                      transitionDelay: `${index * 70}ms`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </article>
      <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
        <div className="flex justify-between gap-3">
          <div>
            <h2 className="font-bold">Costos y retencion</h2>
            <p className="mt-1 text-xs text-(--color-muted)">
              Uso recurrente y costo financiero
            </p>
          </div>
          <TrendingUp size={19} className="text-(--color-accent)" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="group relative rounded-lg bg-(--color-surface-2) p-4">
            <p className="text-xs text-(--color-muted)">Activos 7 dias</p>
            <p className="mt-2 text-2xl font-bold">
              {integer.format(data.retention.active7Days)}
            </p>
            <span className="pointer-events-none absolute top-[-30px] left-2 rounded bg-[#101a2d] px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100">
              Usuarios con acceso reciente
            </span>
          </div>
          <div className="group relative rounded-lg bg-(--color-surface-2) p-4">
            <p className="text-xs text-(--color-muted)">Activos 30 dias</p>
            <p className="mt-2 text-2xl font-bold">
              {integer.format(data.retention.active30Days)}
            </p>
            <span className="pointer-events-none absolute top-[-30px] right-2 rounded bg-[#101a2d] px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100">
              Usuarios con acceso en el mes
            </span>
          </div>
        </div>
        <Bars
          items={data.finance.history}
          animated={animated}
          money
          selectedKey={
            dashboardFilter?.group === "finance" ? dashboardFilter.value : null
          }
          onSelect={(item) =>
            toggleDashboardFilter("finance", item.label, `Finanzas ${item.label}`)
          }
        />
        <button
          type="button"
          onClick={() => setShowFinance((value) => !value)}
          className="mt-5 cursor-pointer text-sm font-semibold text-(--color-accent)"
        >
          {showFinance
            ? "Ocultar gestion financiera"
            : "Gestionar snapshots financieros"}
        </button>
      </article>
    </section>
    <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><article className="rounded-lg border border-(--color-border) bg-(--color-surface)"><div className="border-b border-(--color-border) p-5"><h2 className="font-bold">Actividad reciente</h2><p className="mt-1 text-xs text-(--color-muted)">Eventos administrativos y ejecuciones normalizadas</p></div>{data.recentActivity.length ? <div>{data.recentActivity.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-(--color-border) px-5 py-4 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-(--color-muted)">{item.source}</p></div><time className="shrink-0 text-xs text-(--color-muted)">{item.occurredAt ? new Date(item.occurredAt).toLocaleString("es-CO") : "Sin fecha"}</time></div>)}</div> : <p className="p-6 text-sm text-(--color-muted)">Aun no hay actividad normalizada para mostrar.</p>}</article><article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5"><h2 className="font-bold">Soporte activo</h2><p className="mt-1 text-xs text-(--color-muted)">Tickets y conversaciones pendientes</p><div className="mt-6 rounded-lg border border-dashed border-(--color-border) p-5"><p className="text-sm font-semibold">Sin fuente conectada</p><p className="mt-2 text-sm text-(--color-muted)">Cuando se integre el canal de soporte, este panel mostrara tickets abiertos, prioridad y tiempo de respuesta.</p></div></article></section>
    {showFinance ? <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5"><AdminFinanceSection /></section> : null}
  </div>;
}
