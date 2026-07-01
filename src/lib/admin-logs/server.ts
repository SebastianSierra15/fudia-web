import "server-only";

import { Query } from "appwrite";
import type {
  AdminLogEntry,
  AdminLogLevel,
  AdminLogsFunctionSummary,
  AdminLogsResponse,
  AdminLogsSourceState,
} from "./types";
import { getAdminSentrySummary } from "./sentry";

type AppwriteFunction = {
  $id: string;
  name: string;
};

type AppwriteFunctionPage = {
  functions?: AppwriteFunction[];
};

type AppwriteExecution = {
  $id: string;
  $createdAt: string;
  $permissions?: string[];
  functionId: string;
  deploymentId?: string;
  status?: string;
  trigger?: string;
  requestMethod?: string;
  requestPath?: string;
  responseStatusCode?: number;
  duration?: number;
  errors?: string;
};

type AppwriteExecutionPage = {
  executions?: AppwriteExecution[];
  total?: number;
};

type AiTelemetryDocument = {
  estimatedCostUsd?: number;
  occurredAt: string;
};

type AiTelemetryPage = {
  documents?: AiTelemetryDocument[];
  total?: number;
};

type AppwriteUser = {
  $id: string;
  name?: string;
  email?: string;
};

type SystemLogDocument = {
  $id: string;
  level?: string;
  source?: string;
  functionName?: string;
  eventName?: string;
  userId?: string;
  device?: string;
  executionId?: string;
  statusCode?: number;
  durationMs?: number;
  aiCostUsd?: number;
  sentryEventId?: string;
  message?: string;
  occurredAt?: string;
};

type SystemLogPage = {
  documents?: SystemLogDocument[];
  total?: number;
};

type ProviderResult<T> =
  | { success: true; value: T; state?: AdminLogsSourceState }
  | { success: false; state: AdminLogsSourceState };

const APPWRITE_PAGE_SIZE = 100;
const MAX_EXECUTIONS_PER_FUNCTION = 100;
const MAX_TELEMETRY_DOCUMENTS = 5000;

function getCurrentUtcDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function parseLogsDate(value: string | null, now = new Date()) {
  if (!value) {
    return getCurrentUtcDate(now);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || value > getCurrentUtcDate(now)) {
    return null;
  }

  return value;
}

function buildLogsRange(date: string) {
  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const label = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);

  return {
    date,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getPreviousDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
}

function compareLogKpi(current: number, previous: number) {
  return {
    percent:
      previous > 0
        ? Math.round(((current - previous) / previous) * 1000) / 10
        : null,
    current,
    previous,
    label: "vs dia anterior",
  };
}

function getAppwriteAdminConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    return null;
  }

  return { endpoint: endpoint.replace(/\/$/, ""), projectId, apiKey };
}

function createAppwriteHeaders(config: { projectId: string; apiKey: string }) {
  return {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-Key": config.apiKey,
    "Content-Type": "application/json",
  };
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function round(value: number, precision = 2) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function getExecutionUserId(execution: AppwriteExecution) {
  const permissions = execution.$permissions ?? [];

  for (const permission of permissions) {
    const match = permission.match(/user:([^")]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function formatUserFallback(userId: string) {
  return userId ? "Email no disponible" : "server/appwrite";
}

function formatUserLabel(user: AppwriteUser | undefined, userId: string) {
  if (!user) {
    return formatUserFallback(userId);
  }

  const name = user.name?.trim();
  const email = user.email?.trim();

  return email || name || formatUserFallback(userId);
}

async function fetchAppwriteFunctions(): Promise<
  ProviderResult<AppwriteFunction[]>
> {
  const config = getAppwriteAdminConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "Appwrite no esta configurado para logs.",
      },
    };
  }

  try {
    const response = await fetch(`${config.endpoint}/functions?limit=100`, {
      headers: createAppwriteHeaders(config),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Appwrite functions failed with ${response.status}`);
    }

    const payload = (await response.json()) as AppwriteFunctionPage;
    return {
      success: true,
      value: payload.functions ?? [],
      state: { status: "ok" },
    };
  } catch {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "No se pudieron consultar las functions.",
      },
    };
  }
}

async function fetchFunctionExecutions(
  appwriteFunction: AppwriteFunction,
  range: ReturnType<typeof buildLogsRange>,
) {
  const config = getAppwriteAdminConfig();
  if (!config) {
    return [];
  }

  const url = new URL(
    `${config.endpoint}/functions/${encodeURIComponent(
      appwriteFunction.$id,
    )}/executions`,
  );

  [
    Query.greaterThanEqual("$createdAt", range.start),
    Query.lessThan("$createdAt", range.end),
    Query.orderDesc("$createdAt"),
    Query.limit(MAX_EXECUTIONS_PER_FUNCTION),
  ].forEach((query) => url.searchParams.append("queries[]", query));

  const response = await fetch(url, {
    headers: createAppwriteHeaders(config),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Appwrite executions failed with ${response.status}`);
  }

  const payload = (await response.json()) as AppwriteExecutionPage;
  return (payload.executions ?? []).map((execution) =>
    mapExecutionToEntry(execution, appwriteFunction),
  );
}

async function fetchAppwriteExecutionEntries(
  range: ReturnType<typeof buildLogsRange>,
): Promise<ProviderResult<AdminLogEntry[]>> {
  const functionsResult = await fetchAppwriteFunctions();
  if (!functionsResult.success) {
    return functionsResult;
  }

  let failedFunctions = 0;
  const entries: AdminLogEntry[] = [];

  await Promise.all(
    functionsResult.value.map(async (appwriteFunction) => {
      try {
        const functionEntries = await fetchFunctionExecutions(
          appwriteFunction,
          range,
        );
        entries.push(...functionEntries);
      } catch {
        failedFunctions += 1;
      }
    }),
  );

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    success: true,
    value: entries,
    state:
      failedFunctions > 0
        ? {
            status: "partial",
            message: `${failedFunctions} functions no entregaron ejecuciones.`,
          }
        : { status: "ok" },
  };
}

async function fetchAppwriteUsers(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  const users = new Map<string, AppwriteUser>();

  if (uniqueUserIds.length === 0) {
    return users;
  }

  const config = getAppwriteAdminConfig();
  if (!config) {
    return users;
  }

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const response = await fetch(
          `${config.endpoint}/users/${encodeURIComponent(userId)}`,
          {
            headers: createAppwriteHeaders(config),
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return;
        }

        users.set(userId, (await response.json()) as AppwriteUser);
      } catch {
        return;
      }
    }),
  );

  return users;
}

async function resolveEntryUserLabels(entries: AdminLogEntry[]) {
  const userIds = entries
    .map((entry) => entry.userId ?? "")
    .filter((userId) => userId.trim().length > 0);

  const users = await fetchAppwriteUsers(userIds);

  return entries.map((entry) => {
    if (!entry.userId) {
      return entry;
    }

    return {
      ...entry,
      userLabel: formatUserLabel(users.get(entry.userId), entry.userId),
    };
  });
}

function getExecutionLevel(execution: AppwriteExecution): AdminLogLevel {
  const statusCode = toFiniteNumber(execution.responseStatusCode);
  if (execution.status === "failed" || statusCode >= 500) {
    return "error";
  }

  if (statusCode >= 400) {
    return "warn";
  }

  return "info";
}

function getExecutionMessage(execution: AppwriteExecution) {
  const statusCode = toFiniteNumber(execution.responseStatusCode);
  if (execution.status === "failed" || statusCode >= 500) {
    return "Ejecucion fallida";
  }

  if (statusCode >= 400) {
    return "Respuesta con advertencia";
  }

  return "Ejecucion completada";
}

function mapExecutionToEntry(
  execution: AppwriteExecution,
  appwriteFunction: AppwriteFunction,
): AdminLogEntry {
  const method = execution.requestMethod || "POST";
  const path = execution.requestPath || "/";
  const userId = getExecutionUserId(execution);

  return {
    id: execution.$id,
    timestamp: execution.$createdAt,
    level: getExecutionLevel(execution),
    source: "appwrite",
    functionName: appwriteFunction.name,
    eventName: `${method} ${path}`,
    userId: userId || undefined,
    userLabel: formatUserFallback(userId),
    device: null,
    executionId: execution.$id,
    statusCode:
      execution.responseStatusCode === undefined
        ? null
        : toFiniteNumber(execution.responseStatusCode),
    durationMs:
      execution.duration === undefined
        ? null
        : Math.round(toFiniteNumber(execution.duration)),
    aiCostUsd: null,
    sentryEventId: null,
    sentryUrl: null,
    message: getExecutionMessage(execution),
  };
}

function getTelemetryConfig() {
  const adminConfig = getAppwriteAdminConfig();
  const databaseId =
    process.env.APPWRITE_DATABASE_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_AI_USAGE_COLLECTION_ID;

  if (!adminConfig || !databaseId || !collectionId) {
    return null;
  }

  return { ...adminConfig, databaseId, collectionId };
}

function getSystemLogsConfig() {
  const adminConfig = getAppwriteAdminConfig();
  const databaseId =
    process.env.APPWRITE_DATABASE_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId =
    process.env.APPWRITE_SYSTEM_LOGS_COLLECTION_ID ??
    process.env.SYSTEM_LOGS_COLLECTION_ID ??
    "system_logs";

  if (!adminConfig || !databaseId || !collectionId) {
    return null;
  }

  return { ...adminConfig, databaseId, collectionId };
}

function normalizeLogLevel(value: string | undefined): AdminLogLevel {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
}

function normalizeLogSource(value: string | undefined): AdminLogEntry["source"] {
  if (value === "appwrite" || value === "react-native" || value === "web" || value === "sentry") {
    return value;
  }

  return "appwrite";
}

function getSentryEventUrl(eventId: string | undefined) {
  const organization = process.env.SENTRY_ORG_SLUG;
  if (!eventId || !organization) return null;
  return `https://sentry.io/organizations/${encodeURIComponent(organization)}/issues/?query=${encodeURIComponent(eventId)}`;
}

function mapSystemLogToEntry(document: SystemLogDocument): AdminLogEntry {
  const userLabel =
    document.userId ? formatUserFallback(document.userId) : document.device || "sin usuario";

  return {
    id: document.$id,
    timestamp: document.occurredAt || new Date(0).toISOString(),
    level: normalizeLogLevel(document.level),
    source: normalizeLogSource(document.source),
    functionName: document.functionName || "sistema",
    eventName: document.eventName || "evento",
    userId: document.userId || undefined,
    userLabel,
    device: document.device || null,
    executionId: document.executionId || "-",
    statusCode:
      document.statusCode === undefined
        ? null
        : toFiniteNumber(document.statusCode),
    durationMs:
      document.durationMs === undefined
        ? null
        : Math.round(toFiniteNumber(document.durationMs)),
    aiCostUsd:
      document.aiCostUsd === undefined
        ? null
        : round(toFiniteNumber(document.aiCostUsd), 6),
    sentryEventId: document.sentryEventId || null,
    sentryUrl: getSentryEventUrl(document.sentryEventId),
    message: document.message || "Evento registrado",
  };
}

async function fetchSystemLogEntries(
  range: ReturnType<typeof buildLogsRange>,
): Promise<ProviderResult<AdminLogEntry[]>> {
  const config = getSystemLogsConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "Logs normalizados pendientes.",
      },
    };
  }

  let offset = 0;
  const entries: AdminLogEntry[] = [];

  try {
    while (offset < MAX_TELEMETRY_DOCUMENTS) {
      const url = new URL(
        `${config.endpoint}/databases/${encodeURIComponent(
          config.databaseId,
        )}/collections/${encodeURIComponent(config.collectionId)}/documents`,
      );

      [
        Query.greaterThanEqual("occurredAt", range.start),
        Query.lessThan("occurredAt", range.end),
        Query.orderDesc("occurredAt"),
        Query.limit(APPWRITE_PAGE_SIZE),
        Query.offset(offset),
      ].forEach((query) => url.searchParams.append("queries[]", query));

      const response = await fetch(url, {
        headers: createAppwriteHeaders(config),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`System logs failed with ${response.status}`);
      }

      const payload = (await response.json()) as SystemLogPage;
      const documents = payload.documents ?? [];
      entries.push(...documents.map(mapSystemLogToEntry));

      if (
        documents.length < APPWRITE_PAGE_SIZE ||
        offset + documents.length >= (payload.total ?? 0)
      ) {
        break;
      }

      offset += APPWRITE_PAGE_SIZE;
    }

    return { success: true, value: entries, state: { status: "ok" } };
  } catch {
    return {
      success: false,
      state: {
        status: "partial",
        message: "Logs normalizados sin lectura disponible.",
      },
    };
  }
}

async function fetchAiCostForDay(
  range: ReturnType<typeof buildLogsRange>,
): Promise<ProviderResult<number>> {
  const config = getTelemetryConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "Costo IA aun no conectado.",
      },
    };
  }

  let offset = 0;
  let cost = 0;

  try {
    while (offset < MAX_TELEMETRY_DOCUMENTS) {
      const url = new URL(
        `${config.endpoint}/databases/${encodeURIComponent(
          config.databaseId,
        )}/collections/${encodeURIComponent(config.collectionId)}/documents`,
      );

      [
        Query.greaterThanEqual("occurredAt", range.start),
        Query.lessThan("occurredAt", range.end),
        Query.limit(APPWRITE_PAGE_SIZE),
        Query.offset(offset),
      ].forEach((query) => url.searchParams.append("queries[]", query));

      const response = await fetch(url, {
        headers: createAppwriteHeaders(config),
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`AI telemetry failed with ${response.status}`);
      }

      const payload = (await response.json()) as AiTelemetryPage;
      const documents = payload.documents ?? [];
      cost += documents.reduce(
        (sum, document) => sum + toFiniteNumber(document.estimatedCostUsd),
        0,
      );

      if (
        documents.length < APPWRITE_PAGE_SIZE ||
        offset + documents.length >= (payload.total ?? 0)
      ) {
        break;
      }

      offset += APPWRITE_PAGE_SIZE;
    }

    return { success: true, value: round(cost, 6), state: { status: "ok" } };
  } catch {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "No se pudo calcular el costo IA del dia.",
      },
    };
  }
}

function summarizeByFunction(entries: AdminLogEntry[]) {
  const byFunction = new Map<
    string,
    AdminLogsFunctionSummary & { durationTotal: number; durationCount: number }
  >();

  entries.forEach((entry) => {
    const current =
      byFunction.get(entry.functionName) ??
      ({
        functionId: entry.functionName,
        functionName: entry.functionName,
        total: 0,
        errors: 0,
        warnings: 0,
        avgDurationMs: null,
        durationTotal: 0,
        durationCount: 0,
      } satisfies AdminLogsFunctionSummary & {
        durationTotal: number;
        durationCount: number;
      });

    current.total += 1;
    if (entry.level === "error") {
      current.errors += 1;
    }
    if (entry.level === "warn") {
      current.warnings += 1;
    }
    if (entry.durationMs !== null) {
      current.durationTotal += entry.durationMs;
      current.durationCount += 1;
      current.avgDurationMs = Math.round(
        current.durationTotal / current.durationCount,
      );
    }

    byFunction.set(entry.functionName, current);
  });

  return Array.from(byFunction.values())
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      functionId: item.functionId,
      functionName: item.functionName,
      total: item.total,
      errors: item.errors,
      warnings: item.warnings,
      avgDurationMs: item.avgDurationMs,
    }));
}

export async function getAdminLogs(
  date: string,
  forceRefresh = false,
): Promise<AdminLogsResponse> {
  const range = buildLogsRange(date);
  const previousRange = buildLogsRange(getPreviousDate(date));
  const [
    executionResult,
    systemLogsResult,
    aiCostResult,
    previousExecutionResult,
    previousSystemLogsResult,
    previousAiCostResult,
    sentryResult,
  ] = await Promise.all([
    fetchAppwriteExecutionEntries(range),
    fetchSystemLogEntries(range),
    fetchAiCostForDay(range),
    fetchAppwriteExecutionEntries(previousRange),
    fetchSystemLogEntries(previousRange),
    fetchAiCostForDay(previousRange),
    getAdminSentrySummary(forceRefresh),
  ]);
  const executionEntries = executionResult.success ? executionResult.value : [];
  const systemEntries = systemLogsResult.success ? systemLogsResult.value : [];
  const entries = await resolveEntryUserLabels(
    [...systemEntries, ...executionEntries].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    ),
  );
  const warnings: string[] = [];

  if (executionResult.state?.status !== "ok" && executionResult.state?.message) {
    warnings.push(executionResult.state.message);
  }
  if (systemLogsResult.state?.status !== "ok" && systemLogsResult.state?.message) {
    warnings.push(systemLogsResult.state.message);
  }
  if (aiCostResult.state?.status !== "ok" && aiCostResult.state?.message) {
    warnings.push(aiCostResult.state.message);
  }
  if (sentryResult.state.status !== "ok" && sentryResult.state.message) {
    warnings.push(sentryResult.state.message);
  }

  const errors = entries.filter((entry) => entry.level === "error").length;
  const warnCount = entries.filter((entry) => entry.level === "warn").length;
  const functions = Array.from(
    new Set(entries.map((entry) => entry.functionName)),
  ).sort((a, b) => a.localeCompare(b));
  const previousEntries = [
    ...(previousExecutionResult.success ? previousExecutionResult.value : []),
    ...(previousSystemLogsResult.success ? previousSystemLogsResult.value : []),
  ];
  const previousErrors = previousEntries.filter(
    (entry) => entry.level === "error",
  ).length;
  const previousFunctions = Array.from(
    new Set(previousEntries.map((entry) => entry.functionName)),
  );
  const aiCostUsd = aiCostResult.success ? aiCostResult.value : 0;
  const previousAiCostUsd = previousAiCostResult.success
    ? previousAiCostResult.value
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    range,
    summary: {
      totalLogs: entries.length,
      errors,
      warnings: warnCount,
      appwriteExecutions: executionEntries.length,
      reactNativeLogs: systemEntries.filter(
        (entry) => entry.source === "react-native",
      ).length,
      webLogs: systemEntries.filter((entry) => entry.source === "web").length,
      functionsExecuted: functions.length,
      aiCostUsd,
    },
    comparison: {
      totalLogs: compareLogKpi(entries.length, previousEntries.length),
      errors: compareLogKpi(errors, previousErrors),
      functionsExecuted: compareLogKpi(
        functions.length,
        previousFunctions.length,
      ),
      aiCostUsd: compareLogKpi(aiCostUsd, previousAiCostUsd),
    },
    filters: {
      levels: ["debug", "info", "warn", "error"],
      sources: ["appwrite", "react-native", "web", "sentry"],
      functions,
    },
    sources: {
      appwriteExecutions: executionResult.state ?? { status: "ok" },
      systemLogs: systemLogsResult.state ?? { status: "ok" },
      sentry: sentryResult.state,
      aiTelemetry: aiCostResult.state ?? { status: "ok" },
    },
    entries,
    byFunction: summarizeByFunction(entries),
    sentrySummary: sentryResult.summary,
    warnings,
  };
}

function escapeCsv(value: string | number | null) {
  const stringValue = value === null ? "" : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function createAdminLogsCsv(data: AdminLogsResponse) {
  const header = [
    "timestamp",
    "level",
    "source",
    "functionName",
    "eventName",
    "userLabel",
    "executionId",
    "statusCode",
    "durationMs",
    "aiCostUsd",
    "message",
  ];

  const rows = data.entries.map((entry) =>
    [
      entry.timestamp,
      entry.level,
      entry.source,
      entry.functionName,
      entry.eventName,
      entry.userLabel,
      entry.executionId,
      entry.statusCode,
      entry.durationMs,
      entry.aiCostUsd,
      entry.message,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}
