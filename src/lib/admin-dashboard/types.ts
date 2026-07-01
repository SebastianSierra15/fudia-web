export type AdminDashboardBar = {
  label: string;
  value: number;
};

export type AdminDashboardFunnel = {
  created: number;
  verified: number;
  onboardingComplete: number;
  firstMealLogged: number;
};

export type AdminKpiComparison = {
  percent: number | null;
  current: number | null;
  previous: number | null;
  label: string;
};

export type AdminDashboardSummary = {
  success: true;
  generatedAt: string;
  month: string;
  growthWeeks: number;
  summary: {
    totalUsers: number;
    activeToday: number;
    premiumUsers: number;
    estimatedMrrUsd: number;
    aiCalls: number | null;
    aiCostUsd: number | null;
  };
  comparison: {
    totalUsers: AdminKpiComparison;
    premiumUsers: AdminKpiComparison;
    estimatedMrrUsd: AdminKpiComparison;
    aiCalls: AdminKpiComparison;
    aiCostUsd: AdminKpiComparison;
  };
  growth: AdminDashboardBar[];
  aiByFunction: AdminDashboardBar[];
  activation: AdminDashboardFunnel;
  retention: {
    active7Days: number;
    active30Days: number;
  };
  finance: {
    monthlyCostUsd: number | null;
    estimatedMarginUsd: number | null;
    snapshotPeriod: string | null;
    history: AdminDashboardBar[];
  };
  recentActivity: Array<{
    id: string;
    label: string;
    source: string;
    occurredAt: string;
  }>;
  sources: {
    users: "ok" | "unavailable";
    telemetry: "ok" | "unavailable";
    finance: "ok" | "unavailable";
  };
  warnings: string[];
};

export type AdminDashboardErrorResponse = {
  success: false;
  message: string;
};
