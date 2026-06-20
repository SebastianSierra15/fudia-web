export type AdminLogLevel = "debug" | "info" | "warn" | "error";
export type AdminLogSource = "appwrite" | "react-native" | "web" | "sentry";
export type AdminSourceStatus = "ok" | "partial" | "unavailable";

export type AdminLogsSourceState = {
  status: AdminSourceStatus;
  message?: string;
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
  executionId: string;
  statusCode: number | null;
  durationMs: number | null;
  aiCostUsd: number | null;
  sentryEventId: string | null;
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
  warnings: string[];
};

export type AdminLogsErrorResponse = {
  success: false;
  message: string;
};
