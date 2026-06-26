import type {
  AdminLogsSourceState,
  AdminSentryIssue,
  AdminSentryProjectSummary,
  AdminSentrySummary,
} from "./types";

type SentryIssueResponse = {
  id?: string;
  title?: string;
  level?: string;
  project?: { slug?: string };
  firstSeen?: string;
  lastSeen?: string;
  count?: string | number;
  permalink?: string;
};

type SentryConfig = {
  token: string;
  organization: string;
  projects: string[];
};

type SentryResult = {
  summary: AdminSentrySummary | null;
  state: AdminLogsSourceState;
};

const CACHE_TTL_MS = 60_000;
let cachedResult: { expiresAt: number; value: SentryResult } | null = null;

function getConfig(): SentryConfig | null {
  const token = process.env.SENTRY_ADMIN_AUTH_TOKEN;
  const organization = process.env.SENTRY_ORG_SLUG;
  const projects = [
    process.env.SENTRY_WEB_PROJECT_SLUG,
    process.env.SENTRY_MOBILE_PROJECT_SLUG,
    process.env.SENTRY_FUNCTIONS_PROJECT_SLUG,
  ].filter((project): project is string => Boolean(project));

  if (!token || !organization || projects.length === 0) return null;
  return { token, organization, projects: Array.from(new Set(projects)) };
}

function normalizeLevel(value: string | undefined): AdminSentryIssue["level"] {
  if (value === "debug" || value === "info" || value === "warning" || value === "warn") {
    return value === "warning" ? "warn" : value;
  }
  return "error";
}

function mapIssue(issue: SentryIssueResponse, fallbackProject: string): AdminSentryIssue | null {
  if (!issue.id || !issue.title || !issue.permalink || !issue.firstSeen || !issue.lastSeen) return null;
  return {
    id: issue.id,
    title: issue.title.slice(0, 180),
    level: normalizeLevel(issue.level),
    project: issue.project?.slug || fallbackProject,
    firstSeen: issue.firstSeen,
    lastSeen: issue.lastSeen,
    count: Number.isFinite(Number(issue.count)) ? Number(issue.count) : 0,
    url: issue.permalink,
  };
}

async function fetchProjectIssues(config: SentryConfig, project: string) {
  const url = new URL(
    `https://sentry.io/api/0/projects/${encodeURIComponent(config.organization)}/${encodeURIComponent(project)}/issues/`,
  );
  url.searchParams.set("query", "is:unresolved");
  url.searchParams.set("limit", "20");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.token}` },
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("Sentry unavailable");

  const issues = ((await response.json()) as SentryIssueResponse[])
    .map((issue) => mapIssue(issue, project))
    .filter((issue): issue is AdminSentryIssue => Boolean(issue));
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  return {
    project,
    unresolvedIssues: issues.length,
    recentIssues: issues.filter((issue) => Date.parse(issue.lastSeen) >= oneDayAgo).length,
    newIssues: issues.filter((issue) => Date.parse(issue.firstSeen) >= oneDayAgo).length,
    issues: issues.slice(0, 5),
  } satisfies AdminSentryProjectSummary;
}

export async function getAdminSentrySummary(forceRefresh = false): Promise<SentryResult> {
  if (!forceRefresh && cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.value;
  }

  const config = getConfig();
  if (!config) {
    return {
      summary: null,
      state: { status: "unavailable", message: "Sentry no esta configurado para lectura admin." },
    };
  }

  try {
    const results = await Promise.allSettled(
      config.projects.map((project) => fetchProjectIssues(config, project)),
    );
    const projects = results
      .filter((result): result is PromiseFulfilledResult<AdminSentryProjectSummary> => result.status === "fulfilled")
      .map((result) => result.value);

    if (projects.length === 0) {
      throw new Error("Sentry unavailable");
    }

    const value: SentryResult = {
      summary: { projects, generatedAt: new Date().toISOString() },
      state:
        projects.length === config.projects.length
          ? { status: "ok" }
          : {
              status: "partial",
              message: "Sentry entrego datos parciales para los proyectos configurados.",
            },
    };
    cachedResult = { expiresAt: Date.now() + CACHE_TTL_MS, value };
    return value;
  } catch {
    const value: SentryResult = {
      summary: null,
      state: { status: "partial", message: "Sentry no esta disponible en este momento." },
    };
    cachedResult = { expiresAt: Date.now() + CACHE_TTL_MS, value };
    return value;
  }
}
