import "server-only";

import { Query } from "appwrite";
import type {
  AdminUserAction,
  AdminUser,
  AdminUserAccountStatus,
  AdminUserPlan,
  AdminUsersQuery,
  AdminUsersResponse,
} from "./types";
import {
  APPWRITE_ADMIN_TEAM_ID,
  APPWRITE_PREMIUM_TEAM_ID,
} from "@/src/lib/auth/admin";
import { writeAdminWebLog } from "@/src/lib/admin-logs/web-logger";

type AppwriteDocument = Record<string, unknown> & { $id: string };
type DocumentPage = { documents?: AppwriteDocument[]; total?: number };
type Membership = { $id: string; userId?: string };
type MembershipPage = { memberships?: Membership[] };

const MAX_SUMMARY_DOCUMENTS = 10000;
const PAGE_SIZE = 100;

function getMonth(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function compareKpi(current: number, previous: number) {
  return {
    percent:
      previous > 0
        ? Math.round(((current - previous) / previous) * 1000) / 10
        : null,
    current,
    previous,
    label: "vs mes anterior",
  };
}

function getConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId =
    process.env.APPWRITE_DATABASE_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId =
    process.env.APPWRITE_ADMIN_USER_METRICS_COLLECTION_ID ??
    "admin_user_metrics";
  const freeTeamId =
    process.env.APPWRITE_FREE_TEAM_ID ?? process.env.FREE_TEAM_ID;
  const premiumTeamId =
    process.env.APPWRITE_PREMIUM_TEAM_ID ?? APPWRITE_PREMIUM_TEAM_ID;
  const userActionsFunctionId =
    process.env.APPWRITE_ADMIN_USER_ACTIONS_FUNCTION_ID ?? "admin-user-actions";
  if (
    !endpoint ||
    !projectId ||
    !apiKey ||
    !databaseId ||
    !freeTeamId ||
    !premiumTeamId
  )
    return null;
  return {
    endpoint: endpoint.replace(/\/$/, ""),
    projectId,
    apiKey,
    databaseId,
    collectionId,
    freeTeamId,
    premiumTeamId,
    userActionsFunctionId,
  };
}

function headers(config: NonNullable<ReturnType<typeof getConfig>>) {
  return {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-Key": config.apiKey,
    "Content-Type": "application/json",
  };
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function dateValue(value: unknown) {
  const valueAsString = stringValue(value);
  return valueAsString || null;
}

function mapUser(document: AppwriteDocument): AdminUser {
  const plan = document.plan === "premium" ? "premium" : "free";
  const accountStatus =
    document.accountStatus === "suspended" ? "suspended" : "active";
  const onboardingStatus =
    document.onboardingStatus === "complete" ? "complete" : "incomplete";
  return {
    id: document.$id,
    userId: stringValue(document.userId),
    name: stringValue(document.displayName) || "Sin nombre",
    email: stringValue(document.email),
    phone: stringValue(document.phone),
    plan,
    accountStatus,
    onboardingStatus,
    emailVerified: document.emailVerified === true,
    firstMealLogged: document.firstMealLogged === true,
    notificationsEnabled: document.notificationsEnabled === true,
    recordsCount: numberValue(document.recordsCount),
    aiCostUsd: numberValue(document.aiCostUsd),
    userCreatedAt: dateValue(document.userCreatedAt),
    lastAccessAt: dateValue(document.lastAccessAt),
    syncedAt: stringValue(document.syncedAt),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin user configuration");
  const response = await fetch(`${config.endpoint}${path}`, {
    ...init,
    headers: { ...headers(config), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Appwrite request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

function documentPath(config: NonNullable<ReturnType<typeof getConfig>>) {
  return `/databases/${encodeURIComponent(config.databaseId)}/collections/${encodeURIComponent(config.collectionId)}/documents`;
}

function createMetricsQueries(query: AdminUsersQuery, includePaging: boolean) {
  const queries = [Query.equal("metricsMonth", getMonth())];
  if (query.plan !== "all") queries.push(Query.equal("plan", query.plan));
  if (query.status !== "all")
    queries.push(Query.equal("accountStatus", query.status));
  if (query.onboarding !== "all")
    queries.push(Query.equal("onboardingStatus", query.onboarding));
  if (query.search)
    queries.push(
      Query.search("searchText", query.search.slice(0, 120).toLowerCase()),
    );
  if (query.sort === "records_desc")
    queries.push(Query.orderDesc("recordsCount"));
  else if (query.sort === "cost_desc")
    queries.push(Query.orderDesc("aiCostUsd"));
  else if (query.sort === "last_access_desc")
    queries.push(Query.orderDesc("lastAccessAt"));
  else if (query.sort === "created_asc")
    queries.push(Query.orderAsc("userCreatedAt"));
  else queries.push(Query.orderDesc("userCreatedAt"));
  if (includePaging) {
    queries.push(
      Query.limit(query.pageSize),
      Query.offset((query.page - 1) * query.pageSize),
    );
  }
  return queries;
}

async function listMetricDocuments(query: AdminUsersQuery) {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin user configuration");
  const url = new URL(`${config.endpoint}${documentPath(config)}`);
  createMetricsQueries(query, true).forEach((item) =>
    url.searchParams.append("queries[]", item),
  );
  const response = await fetch(url, {
    headers: headers(config),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Metrics query failed with ${response.status}`);
  return response.json() as Promise<DocumentPage>;
}

async function listSummaryDocuments(month = getMonth()) {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin user configuration");
  const documents: AppwriteDocument[] = [];
  let offset = 0;
  while (offset < MAX_SUMMARY_DOCUMENTS) {
    const url = new URL(`${config.endpoint}${documentPath(config)}`);
    [
      Query.equal("metricsMonth", month),
      Query.limit(PAGE_SIZE),
      Query.offset(offset),
    ].forEach((item) => url.searchParams.append("queries[]", item));
    const response = await fetch(url, {
      headers: headers(config),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`Metrics summary failed with ${response.status}`);
    const page = (await response.json()) as DocumentPage;
    const next = page.documents ?? [];
    documents.push(...next);
    if (next.length < PAGE_SIZE || documents.length >= (page.total ?? 0)) break;
    offset += next.length;
  }
  return documents;
}

export function parseAdminUsersQuery(
  params: URLSearchParams,
): AdminUsersQuery | null {
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "20");
  const sort = params.get("sort") ?? "created_desc";
  const supportedSorts = [
    "created_desc",
    "created_asc",
    "records_desc",
    "cost_desc",
    "last_access_desc",
  ];
  const plan = params.get("plan") ?? "all";
  const status = params.get("status") ?? "all";
  const onboarding = params.get("onboarding") ?? "all";
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 10 ||
    pageSize > 100 ||
    !supportedSorts.includes(sort) ||
    !["all", "free", "premium"].includes(plan) ||
    !["all", "active", "suspended"].includes(status) ||
    !["all", "complete", "incomplete"].includes(onboarding)
  )
    return null;
  return {
    search: (params.get("search") ?? "").trim().slice(0, 120),
    plan: plan as AdminUsersQuery["plan"],
    status: status as AdminUsersQuery["status"],
    onboarding: onboarding as AdminUsersQuery["onboarding"],
    sort: sort as AdminUsersQuery["sort"],
    page,
    pageSize,
  };
}

export async function getAdminUsers(
  query: AdminUsersQuery,
): Promise<AdminUsersResponse> {
  const metricsMonth = getMonth();
  const previousMonth = getPreviousMonth(metricsMonth);
  const [page, summaryDocuments, previousSummaryDocuments] = await Promise.all([
    listMetricDocuments(query),
    listSummaryDocuments(metricsMonth),
    listSummaryDocuments(previousMonth),
  ]);
  const summaryUsers = summaryDocuments.map(mapUser);
  const previousSummaryUsers = previousSummaryDocuments.map(mapUser);
  const totalUsers = summaryUsers.length;
  const totalFilteredUsers = page.total ?? 0;
  const totalCost = summaryUsers.reduce(
    (total, user) => total + user.aiCostUsd,
    0,
  );
  const previousTotalCost = previousSummaryUsers.reduce(
    (total, user) => total + user.aiCostUsd,
    0,
  );
  const premiumUsers = summaryUsers.filter((user) => user.plan === "premium")
    .length;
  const averageAiCostUsd = summaryUsers.length
    ? totalCost / summaryUsers.length
    : 0;
  const incompleteOnboardingUsers = summaryUsers.filter(
    (user) => user.onboardingStatus === "incomplete",
  ).length;
  const previousPremiumUsers = previousSummaryUsers.filter(
    (user) => user.plan === "premium",
  ).length;
  const previousAverageAiCostUsd = previousSummaryUsers.length
    ? previousTotalCost / previousSummaryUsers.length
    : 0;
  const previousIncompleteOnboardingUsers = previousSummaryUsers.filter(
    (user) => user.onboardingStatus === "incomplete",
  ).length;
  const warning =
    summaryUsers.length === 0
      ? "La proyeccion de usuarios aun no tiene datos. Ejecuta la sincronizacion administrativa para poblarla."
      : summaryUsers.length >= MAX_SUMMARY_DOCUMENTS
        ? "El resumen contiene datos parciales mientras se completa la reconciliacion."
        : null;
  return {
    generatedAt: new Date().toISOString(),
    metricsMonth,
    summary: {
      totalUsers,
      premiumUsers,
      averageAiCostUsd,
      incompleteOnboardingUsers,
    },
    comparison: {
      totalUsers: compareKpi(totalUsers, previousSummaryUsers.length),
      premiumUsers: compareKpi(premiumUsers, previousPremiumUsers),
      averageAiCostUsd: compareKpi(averageAiCostUsd, previousAverageAiCostUsd),
      incompleteOnboardingUsers: compareKpi(
        incompleteOnboardingUsers,
        previousIncompleteOnboardingUsers,
      ),
    },
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: totalFilteredUsers,
      totalPages: Math.max(1, Math.ceil(totalFilteredUsers / query.pageSize)),
    },
    users: (page.documents ?? []).map(mapUser),
    filters: {
      plans: ["free", "premium"],
      statuses: ["active", "suspended"],
      onboarding: ["complete", "incomplete"],
      sorts: [
        "created_desc",
        "created_asc",
        "records_desc",
        "cost_desc",
        "last_access_desc",
      ],
    },
    warning,
  };
}

export function createAdminUsersCsv(data: AdminUsersResponse) {
  const escape = (value: string | number | null) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = data.users.map((user) => [
    user.name,
    user.email,
    user.phone,
    user.plan,
    user.accountStatus,
    user.recordsCount,
    user.aiCostUsd,
    user.onboardingStatus,
    user.lastAccessAt,
  ]);
  return [
    [
      "nombre",
      "email",
      "telefono",
      "plan",
      "estado",
      "registros_mes",
      "costo_ia_estimado_usd",
      "onboarding",
      "ultimo_acceso",
    ],
    ...rows,
  ]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}

async function getMembership(teamId: string, userId: string) {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin user configuration");
  const url = new URL(
    `${config.endpoint}/teams/${encodeURIComponent(teamId)}/memberships`,
  );
  [Query.equal("userId", userId), Query.limit(1)].forEach((item) =>
    url.searchParams.append("queries[]", item),
  );
  const response = await fetch(url, {
    headers: headers(config),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Membership query failed with ${response.status}`);
  const page = (await response.json()) as MembershipPage;
  return page.memberships?.[0] ?? null;
}

async function updateMetric(userId: string, data: Record<string, unknown>) {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin user configuration");
  const url = new URL(`${config.endpoint}${documentPath(config)}`);
  [Query.equal("userId", userId), Query.limit(1)].forEach((item) =>
    url.searchParams.append("queries[]", item),
  );
  const response = await fetch(url, {
    headers: headers(config),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Metric query failed with ${response.status}`);
  const page = (await response.json()) as DocumentPage;
  const document = page.documents?.[0];
  if (!document) return;
  await request(`${documentPath(config)}/${encodeURIComponent(document.$id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: { ...data, syncedAt: new Date().toISOString() },
    }),
  });
}

async function writeSystemLog(
  actorUserId: string,
  eventName: string,
  targetUserId: string,
  message: string,
) {
  await writeAdminWebLog({
    level: "info",
    functionName: "admin-users",
    eventName,
    userId: targetUserId,
    message,
    metadata: { actorUserId },
  });
}

async function assertMutableUser(userId: string, actorUserId: string) {
  if (userId === actorUserId) throw new Error("SELF_MUTATION");
  const adminMembership = await getMembership(APPWRITE_ADMIN_TEAM_ID, userId);
  if (adminMembership) throw new Error("ADMIN_MUTATION");
}

export async function changeAdminUserStatus(
  userId: string,
  accountStatus: AdminUserAccountStatus,
  actorUserId: string,
) {
  await assertMutableUser(userId, actorUserId);
  await request(`/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: accountStatus === "active" }),
  });

  const sideEffects: Promise<unknown>[] = [
    updateMetric(userId, { accountStatus }),
    writeSystemLog(
      actorUserId,
      "admin_user_status_changed",
      userId,
      accountStatus === "active"
        ? "Cuenta activada por administracion."
        : "Cuenta suspendida por administracion.",
    ),
  ];

  if (accountStatus === "suspended") {
    sideEffects.push(
      request(`/users/${encodeURIComponent(userId)}/sessions`, {
        method: "DELETE",
      }),
    );
  }

  await Promise.allSettled(sideEffects);
}

export async function changeAdminUserPlan(
  userId: string,
  plan: AdminUserPlan,
  actorUserId: string,
) {
  await assertMutableUser(userId, actorUserId);
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin user configuration");
  const [freeMembership, premiumMembership] = await Promise.all([
    getMembership(config.freeTeamId, userId),
    getMembership(config.premiumTeamId, userId),
  ]);
  const targetTeamId =
    plan === "premium" ? config.premiumTeamId : config.freeTeamId;
  const obsoleteTeamId =
    plan === "premium" ? config.freeTeamId : config.premiumTeamId;
  const obsolete = plan === "premium" ? freeMembership : premiumMembership;
  const target = plan === "premium" ? premiumMembership : freeMembership;
  if (!target)
    await request(`/teams/${encodeURIComponent(targetTeamId)}/memberships`, {
      method: "POST",
      body: JSON.stringify({ roles: [plan], userId }),
    });
  if (obsolete)
    await request(
      `/teams/${encodeURIComponent(obsoleteTeamId)}/memberships/${encodeURIComponent(obsolete.$id)}`,
      { method: "DELETE" },
    );
  await updateMetric(userId, { plan });
  await writeSystemLog(
    actorUserId,
    "admin_user_plan_changed",
    userId,
    `Plan cambiado manualmente a ${plan}.`,
  );
}

export async function runAdminUserAction(
  userId: string,
  action: AdminUserAction,
  actorUserId: string,
) {
  await assertMutableUser(userId, actorUserId);
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin user configuration");
  const response = await request<{
    responseStatusCode?: number;
    responseBody?: string;
  }>(
    `/functions/${encodeURIComponent(config.userActionsFunctionId)}/executions`,
    {
      method: "POST",
      body: JSON.stringify({
        body: JSON.stringify({ userId, action }),
        async: false,
      }),
    },
  );
  const payload = response.responseBody
    ? (JSON.parse(response.responseBody) as {
        success?: boolean;
        error?: string;
      })
    : null;
  if (response.responseStatusCode !== 200 || !payload?.success) {
    if (payload?.error === "WHATSAPP_NO_CONFIGURADO")
      throw new Error("WHATSAPP_NOT_CONFIGURED");
    if (payload?.error === "USUARIO_SIN_EMAIL")
      throw new Error("USER_EMAIL_NOT_AVAILABLE");
    if (payload?.error === "ACCION_INVALIDA")
      throw new Error("INVALID_ACTION");
    if (payload?.error === "PERMISOS_INSUFICIENTES")
      throw new Error("ACTION_PERMISSIONS_MISSING");
    if (payload?.error === "USUARIO_NO_ENCONTRADO")
      throw new Error("ACTION_USER_NOT_FOUND");
    if (payload?.error === "PROVEEDOR_EMAIL_NO_DISPONIBLE")
      throw new Error("EMAIL_PROVIDER_UNAVAILABLE");
    throw new Error("ACTION_FAILED");
  }
  await writeSystemLog(
    actorUserId,
    `admin_user_${action}`,
    userId,
    "Accion administrativa de usuario ejecutada.",
  );
}
