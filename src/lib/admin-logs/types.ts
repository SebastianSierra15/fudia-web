export type AdminLogLevel = "debug" | "info" | "warn" | "error";
export type AdminLogSource = "appwrite" | "react-native" | "web" | "sentry";
export type AdminSourceStatus = "ok" | "partial" | "unavailable";

export type AdminLogsSourceState = {
  status: AdminSourceStatus;
  message?: string;
};

export type AdminSentryIssue = {
  id: string;
  title: string;
  level: AdminLogLevel;
  project: string;
  firstSeen: string;
  lastSeen: string;
  count: number;
  url: string;
};

export type AdminSentryProjectSummary = {
  project: string;
  unresolvedIssues: number;
  recentIssues: number;
  newIssues: number;
  issues: AdminSentryIssue[];
};

export type AdminSentrySummary = {
  projects: AdminSentryProjectSummary[];
  generatedAt: string;
};

export type AdminLogEntry = {
  id: string;
  timestamp: string;
  level: AdminLogLevel;
  source: AdminLogSource;
  functionName: string;
  eventName: string;
  userId?: string;
  userLabel: string;
  device: string | null;
  executionId: string;
  statusCode: number | null;
  durationMs: number | null;
  aiCostUsd: number | null;
  sentryEventId: string | null;
  sentryUrl: string | null;
  message: string;
};

export type AdminLogsFunctionSummary = {
  functionId: string;
  functionName: string;
  total: number;
  errors: number;
  warnings: number;
  avgDurationMs: number | null;
};

export type AdminLogsKpiComparison = {
  percent: number | null;
  current: number;
  previous: number;
  label: string;
};

export type AdminLogsResponse = {
  generatedAt: string;
  range: {
    date: string;
    label: string;
    start: string;
    end: string;
  };
  summary: {
    totalLogs: number;
    errors: number;
    warnings: number;
    appwriteExecutions: number;
    reactNativeLogs: number;
    webLogs: number;
    functionsExecuted: number;
    aiCostUsd: number;
  };
  comparison: {
    totalLogs: AdminLogsKpiComparison;
    errors: AdminLogsKpiComparison;
    functionsExecuted: AdminLogsKpiComparison;
    aiCostUsd: AdminLogsKpiComparison;
  };
  filters: {
    levels: AdminLogLevel[];
    sources: AdminLogSource[];
    functions: string[];
  };
  sources: {
    appwriteExecutions: AdminLogsSourceState;
    systemLogs: AdminLogsSourceState;
    sentry: AdminLogsSourceState;
    aiTelemetry: AdminLogsSourceState;
  };
  entries: AdminLogEntry[];
  byFunction: AdminLogsFunctionSummary[];
  sentrySummary: AdminSentrySummary | null;
  warnings: string[];
};

export type AdminLogsErrorResponse = {
  success: false;
  message: string;
};
