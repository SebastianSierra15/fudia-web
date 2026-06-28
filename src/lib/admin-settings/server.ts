import "server-only";

import type { AdminSettings, AdminSettingsResponse } from "./types";
import { DEFAULT_ADMIN_SETTINGS } from "./types";
import { writeAdminWebLog } from "@/src/lib/admin-logs/web-logger";

type AppwriteDocument = Record<string, unknown> & {
  $id: string;
  $updatedAt?: string;
};

const SETTINGS_DOCUMENT_ID = "system";
const MODEL_OPTIONS = ["gpt-4o", "gpt-4o-mini", "gpt-4.1-mini"];
const FREQUENCY_OPTIONS = ["Diario", "Semanal", "Mensual"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId =
    process.env.APPWRITE_DATABASE_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId =
    process.env.APPWRITE_ADMIN_SETTINGS_COLLECTION_ID ?? "admin_settings";

  if (!endpoint || !projectId || !apiKey || !databaseId) {
    return null;
  }

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    projectId,
    apiKey,
    databaseId,
    collectionId,
  };
}

function headers(config: NonNullable<ReturnType<typeof getConfig>>) {
  return {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-Key": config.apiKey,
    "Content-Type": "application/json",
  };
}

function documentPath(config: NonNullable<ReturnType<typeof getConfig>>) {
  return `/databases/${encodeURIComponent(config.databaseId)}/collections/${encodeURIComponent(config.collectionId)}/documents/${SETTINGS_DOCUMENT_ID}`;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; data: T | null }> {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin settings configuration");
  const response = await fetch(`${config.endpoint}${path}`, {
    ...init,
    headers: { ...headers(config), ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  if (response.status === 404) {
    return { status: 404, data: null };
  }

  if (!response.ok) {
    throw new Error(`Appwrite settings request failed with ${response.status}`);
  }

  return { status: response.status, data: (await response.json()) as T };
}

function boolValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function normalizeLimit(value: unknown, fallback: string) {
  const text = stringValue(value, fallback);
  if (text.toLowerCase() === "ilimitado") return "Ilimitado";
  const number = Number(text);
  if (!Number.isInteger(number) || number < 0 || number > 100000) {
    return fallback;
  }
  return String(number);
}

function mapDocument(document: AppwriteDocument | null): AdminSettingsResponse {
  const source: Record<string, unknown> = document ?? {};
  const defaultSettings = DEFAULT_ADMIN_SETTINGS;
  const defaultModel = stringValue(source.defaultModel, defaultSettings.defaultModel);
  const summaryFrequency = stringValue(
    source.summaryFrequency,
    defaultSettings.summaryFrequency,
  );

  return {
    generatedAt: new Date().toISOString(),
    updatedAt: document?.$updatedAt ?? (stringValue(source.updatedAt, "") || null),
    updatedBy: stringValue(source.updatedBy, "") || null,
    settings: {
      unusualCostAlert: boolValue(
        source.unusualCostAlert,
        defaultSettings.unusualCostAlert,
      ),
      defaultModel: MODEL_OPTIONS.includes(defaultModel)
        ? defaultModel
        : defaultSettings.defaultModel,
      realtimeCostLogs: boolValue(
        source.realtimeCostLogs,
        defaultSettings.realtimeCostLogs,
      ),
      alertEmail: stringValue(source.alertEmail, defaultSettings.alertEmail),
      criticalErrorAlerts: boolValue(
        source.criticalErrorAlerts,
        defaultSettings.criticalErrorAlerts,
      ),
      dailyEmailSummary: boolValue(
        source.dailyEmailSummary,
        defaultSettings.dailyEmailSummary,
      ),
      urgentTicketAlerts: boolValue(
        source.urgentTicketAlerts,
        defaultSettings.urgentTicketAlerts,
      ),
      summaryFrequency: FREQUENCY_OPTIONS.includes(summaryFrequency)
        ? summaryFrequency
        : defaultSettings.summaryFrequency,
      supportEmail: stringValue(source.supportEmail, defaultSettings.supportEmail),
      emailSignature: boolValue(
        source.emailSignature,
        defaultSettings.emailSignature,
      ),
      autoTicketReply: boolValue(
        source.autoTicketReply,
        defaultSettings.autoTicketReply,
      ),
      responseSlaHours: normalizeLimit(
        source.responseSlaHours,
        defaultSettings.responseSlaHours,
      ),
      freeMonthlyRecords: normalizeLimit(
        source.freeMonthlyRecords,
        defaultSettings.freeMonthlyRecords,
      ),
      premiumMonthlyRecords: normalizeLimit(
        source.premiumMonthlyRecords,
        defaultSettings.premiumMonthlyRecords,
      ),
      premiumYearlyRecords: normalizeLimit(
        source.premiumYearlyRecords,
        defaultSettings.premiumYearlyRecords,
      ),
      maintenanceMode: boolValue(
        source.maintenanceMode,
        defaultSettings.maintenanceMode,
      ),
    },
  };
}

export function parseAdminSettingsPayload(
  value: unknown,
): AdminSettings | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const mapped = mapDocument(source as AppwriteDocument).settings;

  if (
    !EMAIL_PATTERN.test(mapped.alertEmail) ||
    !EMAIL_PATTERN.test(mapped.supportEmail)
  ) {
    return null;
  }

  return mapped;
}

export async function getAdminSettings(): Promise<AdminSettingsResponse> {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin settings configuration");
  const result = await request<AppwriteDocument>(documentPath(config));
  return mapDocument(result.data);
}

export async function updateAdminSettings(
  settings: AdminSettings,
  actorUserId: string,
): Promise<AdminSettingsResponse> {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin settings configuration");
  const now = new Date().toISOString();
  const data = { ...settings, updatedBy: actorUserId, updatedAt: now };
  const existing = await request<AppwriteDocument>(documentPath(config));

  if (existing.status === 404) {
    await request<AppwriteDocument>(
      `/databases/${encodeURIComponent(config.databaseId)}/collections/${encodeURIComponent(config.collectionId)}/documents`,
      {
        method: "POST",
        body: JSON.stringify({
          documentId: SETTINGS_DOCUMENT_ID,
          data,
          permissions: [],
        }),
      },
    );
  } else {
    await request<AppwriteDocument>(documentPath(config), {
      method: "PATCH",
      body: JSON.stringify({ data }),
    });
  }

  await writeAdminWebLog({
    level: "info",
    functionName: "admin-settings",
    eventName: "admin_settings_updated",
    userId: actorUserId,
    message: "Configuracion administrativa actualizada.",
    metadata: {
      defaultModel: settings.defaultModel,
      summaryFrequency: settings.summaryFrequency,
      maintenanceMode: settings.maintenanceMode,
    },
  });

  const refreshed = await request<AppwriteDocument>(documentPath(config));
  return mapDocument(refreshed.data);
}
