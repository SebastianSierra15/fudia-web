export type AiDataSourceStatus = "ok" | "partial" | "unavailable";

export type AiSourceState = {
  status: AiDataSourceStatus;
  message?: string;
};

export type AiUsageRange = {
  month: string;
  label: string;
  start: string;
  end: string;
};

export type AiUsageSummary = {
  officialCalls: number;
  officialCompletionCalls: number;
  officialTranscriptionCalls: number;
  officialInputTokens: number;
  officialCachedInputTokens: number;
  officialOutputTokens: number;
  officialTotalTokens: number;
  officialCostUsd: number;
  attributedCalls: number;
  attributedTokens: number;
  estimatedAttributedCostUsd: number;
  attributedAudioSeconds: number;
};

export type AiBudget = {
  limitUsd: number | null;
  spentUsd: number;
  remainingUsd: number | null;
  usedPercent: number | null;
  exceeded: boolean;
};

export type AiDailyUsage = {
  date: string;
  officialCalls: number;
  officialCompletionCalls: number;
  officialTranscriptionCalls: number;
  officialInputTokens: number;
  officialCachedInputTokens: number;
  officialOutputTokens: number;
  officialTokens: number;
  officialCostUsd: number;
  attributedCalls: number;
  attributedTokens: number;
  estimatedCostUsd: number;
};

export type AiAttributionBreakdown = {
  calls: number;
  tokens: number;
  estimatedCostUsd: number;
};

export type AiModelUsage = AiAttributionBreakdown & {
  model: string;
};

export type AiFunctionUsage = AiAttributionBreakdown & {
  functionName: string;
};

export type AiTopUser = AiAttributionBreakdown & {
  userId: string;
  name: string;
  email: string;
};

export type AiAttributionCoverage = {
  callsPercent: number | null;
  tokensPercent: number | null;
  costPercent: number | null;
  attributedCalls: number;
  officialCalls: number;
  attributedTokens: number;
  officialTokens: number;
  estimatedCostUsd: number;
  officialCostUsd: number;
};

export type AiUsageComparisonPeriod = {
  range: AiUsageRange;
  summary: Pick<
    AiUsageSummary,
    | "officialCalls"
    | "officialInputTokens"
    | "officialOutputTokens"
    | "officialTotalTokens"
    | "officialCostUsd"
    | "estimatedAttributedCostUsd"
  >;
  daily: AiDailyUsage[];
};

export type AiUsageResponse = {
  success: true;
  generatedAt: string;
  range: AiUsageRange;
  summary: AiUsageSummary;
  budget: AiBudget;
  daily: AiDailyUsage[];
  byModel: AiModelUsage[];
  byFunction: AiFunctionUsage[];
  topUsers: AiTopUser[];
  attributionCoverage: AiAttributionCoverage;
  telemetryStartedAt: string | null;
  comparison: {
    previousMonth: AiUsageComparisonPeriod | null;
  };
  sources: {
    openaiCompletions: AiSourceState;
    openaiTranscriptions: AiSourceState;
    openaiCosts: AiSourceState;
    appwriteTelemetry: AiSourceState;
    appwriteUsers: AiSourceState;
  };
  warnings: string[];
};

export type AiUsageErrorResponse = {
  success: false;
  message: string;
};
