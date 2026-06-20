import type {
  AdminLogsErrorResponse,
  AdminLogsResponse,
} from "@/src/lib/admin-logs/types";
import { createCurrentSessionJwt } from "./auth";

type AdminLogsRequestResult =
  | { success: true; data: AdminLogsResponse }
  | {
      success: false;
      code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
      message: string;
    };

type AdminLogsCsvResult =
  | { success: true; blob: Blob; filename: string }
  | {
      success: false;
      code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
      message: string;
    };

const GENERIC_ERROR_MESSAGE = "No se pudo cargar el panel de logs.";

async function requestAdminLogs(date: string, format?: "csv") {
  const jwt = await createCurrentSessionJwt();
  if (!jwt) {
    return {
      success: false as const,
      code: "NO_SESSION" as const,
      message: "Tu sesion expiro.",
    };
  }

  const searchParams = new URLSearchParams({ date });
  if (format) {
    searchParams.set("format", format);
  }

  try {
    const response = await fetch(`/api/admin/logs?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return {
        success: false as const,
        code: "NO_SESSION" as const,
        message: "Tu sesion expiro.",
      };
    }

    if (response.status === 403) {
      return {
        success: false as const,
        code: "FORBIDDEN" as const,
        message: "No tienes acceso al panel de logs.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as AdminLogsErrorResponse | null;
      return {
        success: false as const,
        code: "REQUEST_ERROR" as const,
        message: payload?.message ?? GENERIC_ERROR_MESSAGE,
      };
    }

    return { success: true as const, response };
  } catch {
    return {
      success: false as const,
      code: "REQUEST_ERROR" as const,
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}

export async function getAdminLogs(
  date: string,
): Promise<AdminLogsRequestResult> {
  const result = await requestAdminLogs(date);
  if (!result.success) {
    return result;
  }

  const data = (await result.response.json()) as AdminLogsResponse;
  return { success: true, data };
}

export async function getAdminLogsCsv(
  date: string,
): Promise<AdminLogsCsvResult> {
  const result = await requestAdminLogs(date, "csv");
  if (!result.success) {
    return result;
  }

  const disposition = result.response.headers.get("content-disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);

  return {
    success: true,
    blob: await result.response.blob(),
    filename: filenameMatch?.[1] ?? `fudia-logs-${date}.csv`,
  };
}
