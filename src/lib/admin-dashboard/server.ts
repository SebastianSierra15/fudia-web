import "server-only";

import { Query } from "appwrite";
import type {
  AdminDashboardBar,
  AdminDashboardSummary,
} from "./types";

type AppwriteDocument = Record<string, unknown> & { $id: string };
type AppwritePage = { documents?: AppwriteDocument[]; total?: number };

const DASHBOARD_CACHE_MS = 60_000;
const MAX_DOCUMENTS = 10_000;
const PAGE_SIZE = 100;
const PREMIUM_PRICE_USD = 9.99;

const cachedSummaries = new Map<number, { expiresAt: number; value: AdminDashboardSummary }>();
const inFlightSummaries = new Map<number, Promise<AdminDashboardSummary>>();

function getConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId =
    process.env.APPWRITE_DATABASE_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const metricsCollectionId =
    process.env.APPWRITE_ADMIN_USER_METRICS_COLLECTION_ID ??
    "admin_user_metrics";

  if (!endpoint || !projectId || !apiKey || !databaseId) return null;

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    projectId,
    apiKey,
    databaseId,
    metricsCollectionId,
    telemetryCollectionId:
      process.env.APPWRITE_AI_USAGE_COLLECTION_ID ?? "ai_usage_events",
    financeCollectionId:
      process.env.APPWRITE_FINANCE_COLLECTION_ID ??
      process.env.NEXT_PUBLIC_APPWRITE_FINANCE_COLLECTION_ID ??
      null,
    systemLogsCollectionId:
      process.env.APPWRITE_SYSTEM_LOGS_COLLECTION_ID ??
      process.env.SYSTEM_LOGS_COLLECTION_ID ??
      "system_logs",
  };
}

function getHeaders(config: NonNullable<ReturnType<typeof getConfig>>) {
  return {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-Key": config.apiKey,
  };
}

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isOnOrAfter(value: unknown, threshold: number) {
  const time = Date.parse(toString(value));
  return Number.isFinite(time) && time >= threshold;
}

function getCurrentMonth(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { month: getCurrentMonth(now), start: start.toISOString(), end: now.toISOString() };
}

function getMonthRangeFromMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { month, start: start.toISOString(), end: end.toISOString() };
}

function calculateComparison(current: number | null, previous: number | null, label: string) {
  if (current === null || previous === null || previous <= 0) {
    return { percent: null, current, previous, label };
  }

  return {
    percent: Math.round(((current - previous) / previous) * 1000) / 10,
    current,
    previous,
    label,
  };
}

function documentPath(
  config: NonNullable<ReturnType<typeof getConfig>>,
  collectionId: string,
) {
  return `/databases/${encodeURIComponent(config.databaseId)}/collections/${encodeURIComponent(collectionId)}/documents`;
}

async function listDocuments(
  config: NonNullable<ReturnType<typeof getConfig>>,
  collectionId: string,
  queries: string[],
  maxDocuments = MAX_DOCUMENTS,
) {
  const documents: AppwriteDocument[] = [];
  let offset = 0;

  while (documents.length < maxDocuments) {
    const url = new URL(`${config.endpoint}${documentPath(config, collectionId)}`);
    [...queries, Query.limit(Math.min(PAGE_SIZE, maxDocuments - documents.length)), Query.offset(offset)].forEach((query) =>
      url.searchParams.append("queries[]", query),
    );
    const response = await fetch(url, {
      headers: getHeaders(config),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Appwrite dashboard query failed: ${response.status}`);
    const page = (await response.json()) as AppwritePage;
    const next = page.documents ?? [];
    documents.push(...next);
    if (next.length < PAGE_SIZE || documents.length >= maxDocuments || documents.length >= (page.total ?? 0)) break;
    offset += next.length;
  }

  return documents;
}

function buildGrowth(users: AppwriteDocument[], now: Date, numberOfWeeks: number): AdminDashboardBar[] {
  const weeks = Array.from({ length: numberOfWeeks }, (_, index) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (numberOfWeeks - 1 - index) * 7));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { start, end, label: new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" }).format(start) };
  });

  return weeks.map((week) => ({
    label: week.label,
    value: users.filter((user) => {
      const createdAt = Date.parse(toString(user.userCreatedAt));
      return Number.isFinite(createdAt) && createdAt >= week.start.getTime() && createdAt < week.end.getTime();
    }).length,
  }));
}

function sortBars(values: Map<string, number>) {
  return [...values.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

async function buildSummary(growthWeeks: number) {
  const config = getConfig();
  if (!config) throw new Error("Missing admin dashboard configuration");

  const now = new Date();
  const range = getMonthRange(now);
  const previousMonth = getPreviousMonth(range.month);
  const previousRange = getMonthRangeFromMonth(previousMonth);
  const warnings: string[] = [];
  let users: AppwriteDocument[] = [];
  let previousUsers: AppwriteDocument[] = [];
  let usersSource: "ok" | "unavailable" = "ok";

  try {
    [users, previousUsers] = await Promise.all([
      listDocuments(config, config.metricsCollectionId, [
        Query.equal("metricsMonth", range.month),
      ]),
      listDocuments(config, config.metricsCollectionId, [
        Query.equal("metricsMonth", previousMonth),
      ]),
    ]);
  } catch {
    usersSource = "unavailable";
    warnings.push("No fue posible consultar la proyeccion de usuarios.");
  }

  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const activeUsers = users.filter((user) => user.accountStatus !== "suspended");
  const premiumUsers = activeUsers.filter((user) => user.plan === "premium").length;
  const previousActiveUsers = previousUsers.filter((user) => user.accountStatus !== "suspended");
  const previousPremiumUsers = previousActiveUsers.filter((user) => user.plan === "premium").length;
  const activation = {
    created: users.length,
    verified: users.filter((user) => user.emailVerified === true).length,
    onboardingComplete: users.filter((user) => user.onboardingStatus === "complete").length,
    firstMealLogged: users.filter((user) => user.firstMealLogged === true).length,
  };

  let telemetrySource: "ok" | "unavailable" = "ok";
  let aiCalls: number | null = 0;
  let aiCostUsd: number | null = 0;
  let previousAiCalls: number | null = 0;
  let previousAiCostUsd: number | null = 0;
  let aiByFunction: AdminDashboardBar[] = [];
  try {
    const [telemetry, previousTelemetry] = await Promise.all([
      listDocuments(config, config.telemetryCollectionId, [
        Query.greaterThanEqual("occurredAt", range.start),
        Query.lessThan("occurredAt", range.end),
      ]),
      listDocuments(config, config.telemetryCollectionId, [
        Query.greaterThanEqual("occurredAt", previousRange.start),
        Query.lessThan("occurredAt", previousRange.end),
      ]),
    ]);
    const byFunction = new Map<string, number>();
    telemetry.forEach((event) => {
      const functionName = toString(event.functionName) || "Sin clasificar";
      byFunction.set(functionName, (byFunction.get(functionName) ?? 0) + 1);
      aiCostUsd = (aiCostUsd ?? 0) + toNumber(event.estimatedCostUsd);
    });
    previousTelemetry.forEach((event) => {
      previousAiCostUsd = (previousAiCostUsd ?? 0) + toNumber(event.estimatedCostUsd);
    });
    aiCalls = telemetry.length;
    previousAiCalls = previousTelemetry.length;
    aiCostUsd = Math.round((aiCostUsd ?? 0) * 1_000_000) / 1_000_000;
    previousAiCostUsd = Math.round((previousAiCostUsd ?? 0) * 1_000_000) / 1_000_000;
    aiByFunction = sortBars(byFunction);
  } catch {
    telemetrySource = "unavailable";
    aiCalls = null;
    aiCostUsd = null;
    previousAiCalls = null;
    previousAiCostUsd = null;
    warnings.push("La telemetria de IA aun no esta disponible.");
  }

  let financeSource: "ok" | "unavailable" = "ok";
  let monthlyCostUsd: number | null = null;
  let snapshotPeriod: string | null = null;
  let financeHistory: AdminDashboardBar[] = [];
  if (config.financeCollectionId) {
    try {
      const snapshots = await listDocuments(config, config.financeCollectionId, [
        Query.orderDesc("period"),
      ], 6);
      const latest = snapshots[0];
      if (latest) {
        monthlyCostUsd = toNumber(latest.totalCostUsd);
        snapshotPeriod = toString(latest.period) || null;
      }
      const history = snapshots
        .slice(0, 6)
        .reverse()
        .map((snapshot) => ({
          label: toString(snapshot.period) || "Sin periodo",
          value: toNumber(snapshot.totalCostUsd),
        }));
      financeHistory = history;
    } catch {
      financeSource = "unavailable";
      warnings.push("No fue posible consultar los snapshots financieros.");
    }
  } else {
    financeSource = "unavailable";
    warnings.push("Aun no hay una coleccion financiera configurada.");
  }

  let recentActivity: AdminDashboardSummary["recentActivity"] = [];
  try {
    const events = await listDocuments(config, config.systemLogsCollectionId, [
      Query.orderDesc("occurredAt"),
    ], 5);
    recentActivity = events.slice(0, 5).map((event) => ({
      id: event.$id,
      label: toString(event.eventName) || toString(event.functionName) || "Evento administrativo",
      source: toString(event.source) || "Appwrite",
      occurredAt: toString(event.occurredAt) || toString(event.$createdAt),
    }));
  } catch {
    warnings.push("La actividad reciente aun no esta disponible.");
  }

  const estimatedMrrUsd = Math.round(premiumUsers * PREMIUM_PRICE_USD * 100) / 100;
  const previousEstimatedMrrUsd = Math.round(previousPremiumUsers * PREMIUM_PRICE_USD * 100) / 100;
  const summary: AdminDashboardSummary = {
    success: true,
    generatedAt: now.toISOString(),
    month: range.month,
    growthWeeks,
    summary: {
      totalUsers: users.length,
      activeToday: activeUsers.filter((user) => isOnOrAfter(user.lastAccessAt, todayStart)).length,
      premiumUsers,
      estimatedMrrUsd,
      aiCalls,
      aiCostUsd,
    },
    comparison: {
      totalUsers: calculateComparison(users.length, previousUsers.length, "vs mes anterior"),
      premiumUsers: calculateComparison(premiumUsers, previousPremiumUsers, "vs mes anterior"),
      estimatedMrrUsd: calculateComparison(estimatedMrrUsd, previousEstimatedMrrUsd, "vs mes anterior"),
      aiCalls: calculateComparison(aiCalls, previousAiCalls, "vs mes anterior"),
      aiCostUsd: calculateComparison(aiCostUsd, previousAiCostUsd, "vs mes anterior"),
    },
    growth: buildGrowth(users, now, growthWeeks),
    aiByFunction,
    activation,
    retention: {
      active7Days: activeUsers.filter((user) => isOnOrAfter(user.lastAccessAt, sevenDaysAgo)).length,
      active30Days: activeUsers.filter((user) => isOnOrAfter(user.lastAccessAt, thirtyDaysAgo)).length,
    },
    finance: {
      monthlyCostUsd,
      estimatedMarginUsd:
        monthlyCostUsd === null ? null : Math.round((estimatedMrrUsd - monthlyCostUsd) * 100) / 100,
      snapshotPeriod,
      history: financeHistory,
    },
    recentActivity,
    sources: { users: usersSource, telemetry: telemetrySource, finance: financeSource },
    warnings,
  };
  return summary;
}

export async function getAdminDashboardSummary(
  growthWeeks = 8,
  forceRefresh = false,
) {
  const supportedWeeks = [8, 12, 24].includes(growthWeeks) ? growthWeeks : 8;
  const cached = cachedSummaries.get(supportedWeeks);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const inFlight = inFlightSummaries.get(supportedWeeks);
  if (!forceRefresh && inFlight) return inFlight;

  const request = buildSummary(supportedWeeks);
  inFlightSummaries.set(supportedWeeks, request);
  try {
    const value = await request;
    cachedSummaries.set(supportedWeeks, { value, expiresAt: Date.now() + DASHBOARD_CACHE_MS });
    return value;
  } finally {
    inFlightSummaries.delete(supportedWeeks);
  }
}
