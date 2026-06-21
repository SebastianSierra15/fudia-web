export type AdminUserPlan = "free" | "premium";
export type AdminUserAccountStatus = "active" | "suspended";
export type AdminUserOnboardingStatus = "complete" | "incomplete";
export type AdminUserSort =
  | "created_desc"
  | "created_asc"
  | "records_desc"
  | "cost_desc"
  | "last_access_desc";

export type AdminUserAction =
  | "credentials_email"
  | "credentials_whatsapp"
  | "welcome_email"
  | "welcome_whatsapp";

export type AdminUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  plan: AdminUserPlan;
  accountStatus: AdminUserAccountStatus;
  onboardingStatus: AdminUserOnboardingStatus;
  emailVerified: boolean;
  firstMealLogged: boolean;
  notificationsEnabled: boolean;
  recordsCount: number;
  aiCostUsd: number;
  userCreatedAt: string | null;
  lastAccessAt: string | null;
  syncedAt: string;
};

export type AdminUsersQuery = {
  search: string;
  plan: "all" | AdminUserPlan;
  status: "all" | AdminUserAccountStatus;
  onboarding: "all" | AdminUserOnboardingStatus;
  sort: AdminUserSort;
  page: number;
  pageSize: number;
};

export type AdminUsersResponse = {
  generatedAt: string;
  metricsMonth: string;
  summary: {
    totalUsers: number;
    premiumUsers: number;
    averageAiCostUsd: number;
    incompleteOnboardingUsers: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  users: AdminUser[];
  filters: {
    plans: AdminUserPlan[];
    statuses: AdminUserAccountStatus[];
    onboarding: AdminUserOnboardingStatus[];
    sorts: AdminUserSort[];
  };
  warning: string | null;
};

export type AdminUsersErrorResponse = { success: false; message: string };
