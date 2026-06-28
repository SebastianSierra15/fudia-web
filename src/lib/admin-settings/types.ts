export type AdminSettings = {
  unusualCostAlert: boolean;
  defaultModel: string;
  realtimeCostLogs: boolean;
  alertEmail: string;
  criticalErrorAlerts: boolean;
  dailyEmailSummary: boolean;
  urgentTicketAlerts: boolean;
  summaryFrequency: string;
  supportEmail: string;
  emailSignature: boolean;
  autoTicketReply: boolean;
  responseSlaHours: string;
  freeMonthlyRecords: string;
  premiumMonthlyRecords: string;
  premiumYearlyRecords: string;
  maintenanceMode: boolean;
};

export type AdminSettingsResponse = {
  generatedAt: string;
  settings: AdminSettings;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type AdminSettingsErrorResponse = {
  success: false;
  message: string;
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  unusualCostAlert: true,
  defaultModel: "gpt-4o",
  realtimeCostLogs: true,
  alertEmail: "admin@fudia.app",
  criticalErrorAlerts: true,
  dailyEmailSummary: true,
  urgentTicketAlerts: true,
  summaryFrequency: "Diario",
  supportEmail: "soporte@fudia.app",
  emailSignature: true,
  autoTicketReply: true,
  responseSlaHours: "24",
  freeMonthlyRecords: "30",
  premiumMonthlyRecords: "Ilimitado",
  premiumYearlyRecords: "Ilimitado",
  maintenanceMode: false,
};
