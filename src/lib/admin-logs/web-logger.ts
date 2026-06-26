import "server-only";

import * as Sentry from "@sentry/nextjs";
import type { AdminLogLevel } from "./types";

type WebLogMetadata = Record<string, string | number | boolean | null>;

type WebLogInput = {
  level: AdminLogLevel;
  eventName: string;
  message: string;
  functionName?: string;
  userId?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: WebLogMetadata;
  sentryEventId?: string | null;
};

type WebExceptionLogInput = Omit<WebLogInput, "level" | "sentryEventId"> & {
  error: unknown;
};

function getConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId =
    process.env.APPWRITE_DATABASE_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId =
    process.env.APPWRITE_SYSTEM_LOGS_COLLECTION_ID ??
    process.env.SYSTEM_LOGS_COLLECTION_ID ??
    "system_logs";

  if (!endpoint || !projectId || !apiKey || !databaseId || !collectionId) {
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

function createDocumentId(prefix = "web") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeMetadata(metadata: WebLogMetadata | undefined) {
  if (!metadata) return undefined;
  const safeEntries = Object.entries(metadata).slice(0, 12);
  return JSON.stringify(Object.fromEntries(safeEntries)).slice(0, 1500);
}

export async function writeAdminWebLog(input: WebLogInput) {
  const config = getConfig();
  if (!config) return;

  try {
    await fetch(
      `${config.endpoint}/databases/${encodeURIComponent(
        config.databaseId,
      )}/collections/${encodeURIComponent(config.collectionId)}/documents`,
      {
        method: "POST",
        headers: headers(config),
        cache: "no-store",
        body: JSON.stringify({
          documentId: createDocumentId(),
          data: {
            level: input.level,
            source: "web",
            functionName: sanitizeText(input.functionName ?? "admin-web", 120),
            eventName: sanitizeText(input.eventName, 120),
            userId: input.userId,
            device: "nextjs-admin",
            statusCode: input.statusCode,
            durationMs: input.durationMs,
            sentryEventId: input.sentryEventId ?? undefined,
            message: sanitizeText(input.message, 240),
            metadata: sanitizeMetadata(input.metadata),
            occurredAt: new Date().toISOString(),
          },
          permissions: [],
        }),
      },
    );
  } catch {
    return;
  }
}

export async function writeAdminWebExceptionLog(input: WebExceptionLogInput) {
  const sentryEventId = Sentry.captureException(input.error);
  await writeAdminWebLog({
    ...input,
    level: "error",
    sentryEventId: sentryEventId || null,
  });
}
