import "server-only";

import { Query } from "appwrite";
import type {
  AiAttributionBreakdown,
  AiDailyUsage,
  AiFunctionUsage,
  AiModelUsage,
  AiSourceState,
  AiTopUser,
  AiUsageComparisonPeriod,
  AiUsageRange,
  AiUsageResponse,
} from "./types";

type OpenAiUsageResult = {
  input_tokens?: number;
  output_tokens?: number;
  input_cached_tokens?: number;
  num_model_requests?: number;
};

type OpenAiTranscriptionUsageResult = {
  num_model_requests?: number;
  input_tokens?: number;
  output_tokens?: number;
  input_cached_tokens?: number;
};

type OpenAiCostResult = {
  amount?: {
    value?: number;
    currency?: string;
  };
};

type OpenAiBucket<TResult> = {
  start_time: number;
  end_time: number;
  results: TResult[];
};

type OpenAiPage<TResult> = {
  data?: Array<OpenAiBucket<TResult>>;
  has_more?: boolean;
  next_page?: string | null;
};

type AiTelemetryDocument = {
  $id: string;
  userId: string;
  functionName: string;
  operation: string;
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  audioSeconds: number;
  estimatedCostUsd: number;
  pricingVersion: string;
  providerRequestId: string;
  occurredAt: string;
};

type AppwriteDocumentPage = {
  documents?: AiTelemetryDocument[];
  total?: number;
};

type AppwriteUser = {
  $id: string;
  name?: string;
  email?: string;
};

type ProviderResult<T> =
  | { success: true; value: T; state?: AiSourceState }
  | { success: false; state: AiSourceState };

type TelemetryAggregation = {
  daily: Map<string, AiAttributionBreakdown>;
  byModel: AiModelUsage[];
  byFunction: AiFunctionUsage[];
  users: Array<AiAttributionBreakdown & { userId: string }>;
  total: AiAttributionBreakdown & { audioSeconds: number };
};

const OPENAI_API_BASE_URL = "https://api.openai.com/v1";
const MAX_APPWRITE_TELEMETRY_DOCUMENTS = 5000;
const APPWRITE_PAGE_SIZE = 100;
const TOP_USERS_LIMIT = 10;

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function round(value: number, precision = 2) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function getUnixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function getOpenAiDailyBucketEnd(date: Date) {
  const isUtcDayBoundary =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (isUtcDayBoundary) {
    return date;
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  );
}

function getCurrentMonth(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export function parseAiUsageMonth(
  value: string | null,
  now = new Date(),
): string | null {
  if (!value) {
    return getCurrentMonth(now);
  }

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  if (value > getCurrentMonth(now)) {
    return null;
  }

  return value;
}

export function buildAiUsageRange(
  month: string,
  now = new Date(),
): AiUsageRange {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1));
  const end =
    month === getCurrentMonth(now) && now < nextMonth ? now : nextMonth;
  const label = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);

  return {
    month,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getOpenAiConfig() {
  const adminKey = process.env.OPENAI_ADMIN_KEY;
  const projectId = process.env.OPENAI_PROJECT_ID;

  if (!adminKey || !projectId) {
    return null;
  }

  return { adminKey, projectId };
}

function appendArrayParameter(
  searchParams: URLSearchParams,
  key: string,
  values: string[],
) {
  values.forEach((value) => searchParams.append(key, value));
}

async function fetchOpenAiPages<TResult>(
  pathname: string,
  searchParams: URLSearchParams,
  adminKey: string,
) {
  const buckets: Array<OpenAiBucket<TResult>> = [];
  let page: string | null = null;

  do {
    const pageParams = new URLSearchParams(searchParams);
    if (page) {
      pageParams.set("page", page);
    }

    const response = await fetch(
      `${OPENAI_API_BASE_URL}${pathname}?${pageParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as OpenAiPage<TResult>;
    buckets.push(...(payload.data ?? []));
    page = payload.has_more ? (payload.next_page ?? null) : null;
  } while (page);

  return buckets;
}

async function fetchOpenAiUsage(
  range: AiUsageRange,
): Promise<ProviderResult<Array<OpenAiBucket<OpenAiUsageResult>>>> {
  const config = getOpenAiConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "El consumo de IA aun no esta conectado.",
      },
    };
  }

  const searchParams = new URLSearchParams({
    start_time: String(getUnixSeconds(new Date(range.start))),
    end_time: String(getUnixSeconds(getOpenAiDailyBucketEnd(new Date(range.end)))),
    bucket_width: "1d",
    limit: "31",
  });
  appendArrayParameter(searchParams, "project_ids", [config.projectId]);

  try {
    return {
      success: true,
      value: await fetchOpenAiPages<OpenAiUsageResult>(
        "/organization/usage/completions",
        searchParams,
        config.adminKey,
      ),
    };
  } catch {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "OpenAI Usage no respondio para el mes solicitado.",
      },
    };
  }
}

async function fetchOpenAiTranscriptions(
  range: AiUsageRange,
): Promise<
  ProviderResult<Array<OpenAiBucket<OpenAiTranscriptionUsageResult>>>
> {
  const config = getOpenAiConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "El consumo de audio aun no esta conectado.",
      },
    };
  }

  const searchParams = new URLSearchParams({
    start_time: String(getUnixSeconds(new Date(range.start))),
    end_time: String(getUnixSeconds(new Date(range.end))),
    bucket_width: "1d",
    limit: "31",
  });
  appendArrayParameter(searchParams, "project_ids", [config.projectId]);

  try {
    return {
      success: true,
      value: await fetchOpenAiPages<OpenAiTranscriptionUsageResult>(
        "/organization/usage/audio_transcriptions",
        searchParams,
        config.adminKey,
      ),
    };
  } catch {
    return {
      success: false,
      state: {
        status: "unavailable",
        message:
          "OpenAI Audio Transcriptions no respondio para el mes solicitado.",
      },
    };
  }
}

async function fetchOpenAiCosts(
  range: AiUsageRange,
): Promise<ProviderResult<Array<OpenAiBucket<OpenAiCostResult>>>> {
  const config = getOpenAiConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "Los costos de IA aun no estan conectados.",
      },
    };
  }

  const searchParams = new URLSearchParams({
    start_time: String(getUnixSeconds(new Date(range.start))),
    end_time: String(getUnixSeconds(new Date(range.end))),
    bucket_width: "1d",
    limit: "31",
  });
  appendArrayParameter(searchParams, "project_ids", [config.projectId]);

  try {
    return {
      success: true,
      value: await fetchOpenAiPages<OpenAiCostResult>(
        "/organization/costs",
        searchParams,
        config.adminKey,
      ),
    };
  } catch {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "OpenAI Costs no respondio para el mes solicitado.",
      },
    };
  }
}

function getAppwriteAdminConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    return null;
  }

  return { endpoint, projectId, apiKey };
}

function getAppwriteTelemetryConfig() {
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

function createAppwriteHeaders(config: {
  projectId: string;
  apiKey: string;
}) {
  return {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-Key": config.apiKey,
    "Content-Type": "application/json",
  };
}

function createTelemetryDocumentsUrl(config: {
  endpoint: string;
  databaseId: string;
  collectionId: string;
}) {
  return new URL(
    `${config.endpoint.replace(/\/$/, "")}/databases/${encodeURIComponent(
      config.databaseId,
    )}/collections/${encodeURIComponent(config.collectionId)}/documents`,
  );
}

async function fetchTelemetryStartedAt() {
  const config = getAppwriteTelemetryConfig();
  if (!config) {
    return null;
  }

  const url = createTelemetryDocumentsUrl(config);
  [Query.orderAsc("occurredAt"), Query.limit(1)].forEach((query) =>
    url.searchParams.append("queries[]", query),
  );

  const response = await fetch(url, {
    headers: createAppwriteHeaders(config),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Appwrite telemetry start request failed with status ${response.status}`,
    );
  }

  const payload = (await response.json()) as AppwriteDocumentPage;
  return payload.documents?.[0]?.occurredAt ?? null;
}

async function fetchTelemetryDocuments(
  range: AiUsageRange,
): Promise<
  ProviderResult<{
    documents: AiTelemetryDocument[];
    telemetryStartedAt: string | null;
  }>
> {
  const config = getAppwriteTelemetryConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "La atribucion interna aun no esta conectada.",
      },
    };
  }

  const documents: AiTelemetryDocument[] = [];
  let offset = 0;
  let telemetryStartedAt: string | null = null;
  let startLookupFailed = false;

  try {
    try {
      telemetryStartedAt = await fetchTelemetryStartedAt();
    } catch {
      startLookupFailed = true;
    }

    while (documents.length < MAX_APPWRITE_TELEMETRY_DOCUMENTS) {
      const url = createTelemetryDocumentsUrl(config);
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
        throw new Error(
          `Appwrite telemetry request failed with status ${response.status}`,
        );
      }

      const payload = (await response.json()) as AppwriteDocumentPage;
      const pageDocuments = payload.documents ?? [];
      documents.push(...pageDocuments);

      if (
        pageDocuments.length < APPWRITE_PAGE_SIZE ||
        documents.length >= (payload.total ?? 0)
      ) {
        break;
      }

      offset += APPWRITE_PAGE_SIZE;
    }

    const messages: string[] = [];
    if (documents.length >= MAX_APPWRITE_TELEMETRY_DOCUMENTS) {
      messages.push(
        `La atribucion se limito a ${MAX_APPWRITE_TELEMETRY_DOCUMENTS} eventos.`,
      );
    }
    if (startLookupFailed) {
      messages.push("No se pudo determinar el inicio historico de telemetria.");
    }

    return {
      success: true,
      value: { documents, telemetryStartedAt },
      state:
        messages.length > 0
          ? { status: "partial", message: messages.join(" ") }
          : { status: "ok" },
    };
  } catch {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "La telemetria privada de Appwrite no esta disponible.",
      },
    };
  }
}

async function fetchAppwriteUsers(
  userIds: string[],
): Promise<ProviderResult<Map<string, AppwriteUser>>> {
  if (userIds.length === 0) {
    return {
      success: true,
      value: new Map(),
      state: { status: "ok", message: "Sin usuarios atribuibles en el mes." },
    };
  }

  const config = getAppwriteAdminConfig();
  if (!config) {
    return {
      success: false,
      state: {
        status: "unavailable",
        message: "Los perfiles de usuario no estan disponibles.",
      },
    };
  }

  const users = new Map<string, AppwriteUser>();
  let failedLookups = 0;

  await Promise.all(
    userIds.map(async (userId) => {
      const url = `${config.endpoint.replace(
        /\/$/,
        "",
      )}/users/${encodeURIComponent(userId)}`;

      try {
        const response = await fetch(url, {
          headers: createAppwriteHeaders(config),
          cache: "no-store",
        });

        if (!response.ok) {
          failedLookups += 1;
          return;
        }

        const user = (await response.json()) as AppwriteUser;
        users.set(userId, user);
      } catch {
        failedLookups += 1;
      }
    }),
  );

  return {
    success: true,
    value: users,
    state:
      failedLookups > 0
        ? {
            status: "partial",
            message: `No se pudieron resolver ${failedLookups} perfiles del ranking.`,
          }
        : { status: "ok" },
  };
}

function createBreakdown(): AiAttributionBreakdown {
  return { calls: 0, tokens: 0, estimatedCostUsd: 0 };
}

function addTelemetryToBreakdown(
  breakdown: AiAttributionBreakdown,
  document: AiTelemetryDocument,
) {
  breakdown.calls += 1;
  breakdown.tokens += toFiniteNumber(document.totalTokens);
  breakdown.estimatedCostUsd += toFiniteNumber(document.estimatedCostUsd);
}

function aggregateTelemetry(
  documents: AiTelemetryDocument[],
): TelemetryAggregation {
  const daily = new Map<string, AiAttributionBreakdown>();
  const modelGroups = new Map<string, AiAttributionBreakdown>();
  const functionGroups = new Map<string, AiAttributionBreakdown>();
  const userGroups = new Map<string, AiAttributionBreakdown>();
  const total = { ...createBreakdown(), audioSeconds: 0 };

  documents.forEach((document) => {
    const date = document.occurredAt.slice(0, 10);
    const model = document.model.trim() || "Sin modelo";
    const functionName = document.functionName.trim() || "Sin funcion";
    const userId = document.userId.trim();

    const dailyBreakdown = daily.get(date) ?? createBreakdown();
    const modelBreakdown = modelGroups.get(model) ?? createBreakdown();
    const functionBreakdown =
      functionGroups.get(functionName) ?? createBreakdown();

    addTelemetryToBreakdown(dailyBreakdown, document);
    addTelemetryToBreakdown(modelBreakdown, document);
    addTelemetryToBreakdown(functionBreakdown, document);
    addTelemetryToBreakdown(total, document);
    total.audioSeconds += toFiniteNumber(document.audioSeconds);

    daily.set(date, dailyBreakdown);
    modelGroups.set(model, modelBreakdown);
    functionGroups.set(functionName, functionBreakdown);

    if (userId) {
      const userBreakdown = userGroups.get(userId) ?? createBreakdown();
      addTelemetryToBreakdown(userBreakdown, document);
      userGroups.set(userId, userBreakdown);
    }
  });

  const normalizeBreakdown = <T extends AiAttributionBreakdown>(item: T) => ({
    ...item,
    estimatedCostUsd: round(item.estimatedCostUsd, 6),
  });

  return {
    daily,
    byModel: Array.from(modelGroups.entries())
      .map(([model, item]) => normalizeBreakdown({ model, ...item }))
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd),
    byFunction: Array.from(functionGroups.entries())
      .map(([functionName, item]) =>
        normalizeBreakdown({ functionName, ...item }),
      )
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd),
    users: Array.from(userGroups.entries())
      .map(([userId, item]) => normalizeBreakdown({ userId, ...item }))
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd),
    total: {
      ...normalizeBreakdown(total),
      audioSeconds: round(total.audioSeconds, 2),
    },
  };
}

function aggregateOpenAiUsage(
  buckets: Array<OpenAiBucket<OpenAiUsageResult>>,
) {
  const daily = new Map<
    string,
    {
      calls: number;
      inputTokens: number;
      cachedInputTokens: number;
      outputTokens: number;
    }
  >();

  buckets.forEach((bucket) => {
    const date = new Date(bucket.start_time * 1000)
      .toISOString()
      .slice(0, 10);
    const day = daily.get(date) ?? {
      calls: 0,
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
    };

    bucket.results.forEach((result) => {
      day.calls += toFiniteNumber(result.num_model_requests);
      day.inputTokens += toFiniteNumber(result.input_tokens);
      day.cachedInputTokens += toFiniteNumber(result.input_cached_tokens);
      day.outputTokens += toFiniteNumber(result.output_tokens);
    });

    daily.set(date, day);
  });

  return daily;
}

function aggregateOpenAiCosts(
  buckets: Array<OpenAiBucket<OpenAiCostResult>>,
) {
  const daily = new Map<string, number>();

  buckets.forEach((bucket) => {
    const date = new Date(bucket.start_time * 1000)
      .toISOString()
      .slice(0, 10);
    const cost = bucket.results.reduce((total, result) => {
      if (result.amount?.currency && result.amount.currency !== "usd") {
        return total;
      }

      return total + toFiniteNumber(result.amount?.value);
    }, 0);

    daily.set(date, round((daily.get(date) ?? 0) + cost, 6));
  });

  return daily;
}

function mergeDailyData(
  completions: ReturnType<typeof aggregateOpenAiUsage>,
  transcriptions: ReturnType<typeof aggregateOpenAiUsage>,
  costs: Map<string, number>,
  telemetry: Map<string, AiAttributionBreakdown>,
) {
  const dates = new Set([
    ...Array.from(completions.keys()),
    ...Array.from(transcriptions.keys()),
    ...Array.from(costs.keys()),
    ...Array.from(telemetry.keys()),
  ]);

  return Array.from(dates)
    .sort()
    .map((date): AiDailyUsage => {
      const completionUsage = completions.get(date);
      const transcriptionUsage = transcriptions.get(date);
      const attributed = telemetry.get(date);

      return {
        date,
        officialCalls:
          (completionUsage?.calls ?? 0) + (transcriptionUsage?.calls ?? 0),
        officialCompletionCalls: completionUsage?.calls ?? 0,
        officialTranscriptionCalls: transcriptionUsage?.calls ?? 0,
        officialInputTokens:
          (completionUsage?.inputTokens ?? 0) +
          (transcriptionUsage?.inputTokens ?? 0),
        officialCachedInputTokens:
          (completionUsage?.cachedInputTokens ?? 0) +
          (transcriptionUsage?.cachedInputTokens ?? 0),
        officialOutputTokens:
          (completionUsage?.outputTokens ?? 0) +
          (transcriptionUsage?.outputTokens ?? 0),
        officialTokens:
          (completionUsage?.inputTokens ?? 0) +
          (completionUsage?.outputTokens ?? 0) +
          (transcriptionUsage?.inputTokens ?? 0) +
          (transcriptionUsage?.outputTokens ?? 0),
        officialCostUsd: costs.get(date) ?? 0,
        attributedCalls: attributed?.calls ?? 0,
        attributedTokens: attributed?.tokens ?? 0,
        estimatedCostUsd: round(attributed?.estimatedCostUsd ?? 0, 6),
      };
    });
}

function parseMonthlyBudget() {
  const budget = toFiniteNumber(process.env.OPENAI_MONTHLY_BUDGET_USD);
  return budget > 0 ? budget : null;
}

function calculateCoverage(numerator: number, denominator: number) {
  return denominator > 0 ? round((numerator / denominator) * 100, 1) : null;
}

async function getAdminAiUsageBase(
  month: string,
  now: Date,
): Promise<Omit<AiUsageResponse, "comparison">> {
  const range = buildAiUsageRange(month, now);
  const [
    completionsResult,
    transcriptionsResult,
    costsResult,
    telemetryResult,
  ] = await Promise.all([
    fetchOpenAiUsage(range),
    fetchOpenAiTranscriptions(range),
    fetchOpenAiCosts(range),
    fetchTelemetryDocuments(range),
  ]);

  const completionUsage = completionsResult.success
    ? aggregateOpenAiUsage(completionsResult.value)
    : new Map();
  const transcriptionUsage = transcriptionsResult.success
    ? aggregateOpenAiUsage(transcriptionsResult.value)
    : new Map();
  const officialCosts = costsResult.success
    ? aggregateOpenAiCosts(costsResult.value)
    : new Map<string, number>();
  const telemetry = telemetryResult.success
    ? aggregateTelemetry(telemetryResult.value.documents)
    : aggregateTelemetry([]);
  const topUserAggregates = telemetry.users.slice(0, TOP_USERS_LIMIT);
  const usersResult = await fetchAppwriteUsers(
    topUserAggregates.map((item) => item.userId),
  );
  const users = usersResult.success ? usersResult.value : new Map();

  const topUsers: AiTopUser[] = topUserAggregates.map((item) => {
    const user = users.get(item.userId);
    return {
      ...item,
      name: user?.name?.trim() || "Sin nombre",
      email: user?.email?.trim() || "",
    };
  });
  const daily = mergeDailyData(
    completionUsage,
    transcriptionUsage,
    officialCosts,
    telemetry.daily,
  );
  const officialCalls = daily.reduce(
    (total, day) => total + day.officialCalls,
    0,
  );
  const officialCompletionCalls = daily.reduce(
    (total, day) => total + day.officialCompletionCalls,
    0,
  );
  const officialTranscriptionCalls = daily.reduce(
    (total, day) => total + day.officialTranscriptionCalls,
    0,
  );
  const allOfficialUsage = [
    ...Array.from(completionUsage.values()),
    ...Array.from(transcriptionUsage.values()),
  ];
  const officialInputTokens = allOfficialUsage.reduce(
    (total, day) => total + day.inputTokens,
    0,
  );
  const officialCachedInputTokens = allOfficialUsage.reduce(
    (total, day) => total + day.cachedInputTokens,
    0,
  );
  const officialOutputTokens = allOfficialUsage.reduce(
    (total, day) => total + day.outputTokens,
    0,
  );
  const officialTotalTokens = officialInputTokens + officialOutputTokens;
  const officialCostUsd = round(
    Array.from(officialCosts.values()).reduce(
      (total, cost) => total + cost,
      0,
    ),
    6,
  );
  const budgetLimit = parseMonthlyBudget();
  const warnings = [
    !completionsResult.success ? completionsResult.state.message : null,
    !transcriptionsResult.success
      ? transcriptionsResult.state.message
      : null,
    !costsResult.success ? costsResult.state.message : null,
    !telemetryResult.success ? telemetryResult.state.message : null,
    telemetryResult.success && telemetryResult.state?.status === "partial"
      ? telemetryResult.state.message
      : null,
    !usersResult.success ? usersResult.state.message : null,
    usersResult.success && usersResult.state?.status === "partial"
      ? usersResult.state.message
      : null,
  ].filter((message): message is string => Boolean(message));

  return {
    success: true,
    generatedAt: now.toISOString(),
    range,
    summary: {
      officialCalls,
      officialCompletionCalls,
      officialTranscriptionCalls,
      officialInputTokens,
      officialCachedInputTokens,
      officialOutputTokens,
      officialTotalTokens,
      officialCostUsd,
      attributedCalls: telemetry.total.calls,
      attributedTokens: telemetry.total.tokens,
      estimatedAttributedCostUsd: telemetry.total.estimatedCostUsd,
      attributedAudioSeconds: telemetry.total.audioSeconds,
    },
    budget: {
      limitUsd: budgetLimit,
      spentUsd: officialCostUsd,
      remainingUsd:
        budgetLimit === null
          ? null
          : round(Math.max(0, budgetLimit - officialCostUsd), 2),
      usedPercent:
        budgetLimit === null
          ? null
          : round((officialCostUsd / budgetLimit) * 100, 1),
      exceeded: budgetLimit !== null && officialCostUsd > budgetLimit,
    },
    daily,
    byModel: telemetry.byModel,
    byFunction: telemetry.byFunction,
    topUsers,
    attributionCoverage: {
      callsPercent: calculateCoverage(telemetry.total.calls, officialCalls),
      tokensPercent: calculateCoverage(
        telemetry.total.tokens,
        officialTotalTokens,
      ),
      costPercent: calculateCoverage(
        telemetry.total.estimatedCostUsd,
        officialCostUsd,
      ),
      attributedCalls: telemetry.total.calls,
      officialCalls,
      attributedTokens: telemetry.total.tokens,
      officialTokens: officialTotalTokens,
      estimatedCostUsd: telemetry.total.estimatedCostUsd,
      officialCostUsd,
    },
    telemetryStartedAt: telemetryResult.success
      ? telemetryResult.value.telemetryStartedAt
      : null,
    sources: {
      openaiCompletions: completionsResult.success
        ? { status: "ok" }
        : completionsResult.state,
      openaiTranscriptions: transcriptionsResult.success
        ? { status: "ok" }
        : transcriptionsResult.state,
      openaiCosts: costsResult.success
        ? { status: "ok" }
        : costsResult.state,
      appwriteTelemetry: telemetryResult.success
        ? telemetryResult.state ?? { status: "ok" }
        : telemetryResult.state,
      appwriteUsers: usersResult.success
        ? usersResult.state ?? { status: "ok" }
        : usersResult.state,
    },
    warnings,
  };
}

function toComparisonPeriod(
  data: Omit<AiUsageResponse, "comparison">,
): AiUsageComparisonPeriod {
  return {
    range: data.range,
    summary: {
      officialCalls: data.summary.officialCalls,
      officialInputTokens: data.summary.officialInputTokens,
      officialOutputTokens: data.summary.officialOutputTokens,
      officialTotalTokens: data.summary.officialTotalTokens,
      officialCostUsd: data.summary.officialCostUsd,
      estimatedAttributedCostUsd: data.summary.estimatedAttributedCostUsd,
    },
    daily: data.daily,
  };
}

export async function getAdminAiUsage(
  month: string,
): Promise<AiUsageResponse> {
  const now = new Date();
  const [current, previous] = await Promise.all([
    getAdminAiUsageBase(month, now),
    getAdminAiUsageBase(getPreviousMonth(month), now),
  ]);

  return {
    ...current,
    comparison: {
      previousMonth: toComparisonPeriod(previous),
    },
  };
}

function escapeCsvValue(value: string | number | null) {
  const normalizedValue = value === null ? "" : String(value);
  return `"${normalizedValue.replaceAll('"', '""')}"`;
}

export function createAdminAiUsageCsv(data: AiUsageResponse) {
  const headers = [
    "tipo",
    "fecha_mes",
    "identificador",
    "nombre",
    "email",
    "calls",
    "completion_calls",
    "transcription_calls",
    "input_tokens",
    "cached_input_tokens",
    "output_tokens",
    "tokens",
    "official_cost_usd",
    "estimated_cost_usd",
  ];
  const rows: Array<Array<string | number | null>> = [
    ...data.daily.map((day) => [
      "daily",
      day.date,
      "",
      "",
      "",
      day.officialCalls,
      day.officialCompletionCalls,
      day.officialTranscriptionCalls,
      day.officialInputTokens,
      day.officialCachedInputTokens,
      day.officialOutputTokens,
      day.officialTokens,
      day.officialCostUsd,
      day.estimatedCostUsd,
    ]),
    ...data.byModel.map((item) => [
      "model",
      data.range.month,
      item.model,
      item.model,
      "",
      item.calls,
      null,
      null,
      null,
      null,
      null,
      item.tokens,
      null,
      item.estimatedCostUsd,
    ]),
    ...data.byFunction.map((item) => [
      "function",
      data.range.month,
      item.functionName,
      item.functionName,
      "",
      item.calls,
      null,
      null,
      null,
      null,
      null,
      item.tokens,
      null,
      item.estimatedCostUsd,
    ]),
    ...data.topUsers.map((item) => [
      "user",
      data.range.month,
      item.userId,
      item.name,
      item.email,
      item.calls,
      null,
      null,
      null,
      null,
      null,
      item.tokens,
      null,
      item.estimatedCostUsd,
    ]),
  ];

  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");
}
