import type {
  AiUsageErrorResponse,
  AiUsageResponse,
} from "@/src/lib/admin-ai/types";
import { createCurrentSessionJwt } from "./auth";

type AiUsageRequestResult =
  | { success: true; data: AiUsageResponse }
  | {
      success: false;
      code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
      message: string;
    };

type AiUsageCsvResult =
  | { success: true; blob: Blob; filename: string }
  | {
      success: false;
      code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
      message: string;
    };

const GENERIC_ERROR_MESSAGE = "No se pudo cargar el panel de IA.";

async function requestAiUsage(
  month: string,
  format?: "csv",
) {
  const jwt = await createCurrentSessionJwt();
  if (!jwt) {
    return {
      success: false as const,
      code: "NO_SESSION" as const,
      message: "Tu sesion expiro.",
    };
  }

  const searchParams = new URLSearchParams({ month });
  if (format) {
    searchParams.set("format", format);
  }

  try {
    const response = await fetch(
      `/api/admin/ai-usage?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        cache: "no-store",
      },
    );

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
        message: "No tienes acceso al panel de IA.",
      };
    }

    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as AiUsageErrorResponse | null;
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

export async function getAdminAiUsage(
  month: string,
): Promise<AiUsageRequestResult> {
  const result = await requestAiUsage(month);
  if (!result.success) {
    return result;
  }

  const data = (await result.response.json()) as AiUsageResponse;
  return { success: true, data };
}

export async function getAdminAiUsageCsv(
  month: string,
): Promise<AiUsageCsvResult> {
  const result = await requestAiUsage(month, "csv");
  if (!result.success) {
    return result;
  }

  const disposition = result.response.headers.get("content-disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);

  return {
    success: true,
    blob: await result.response.blob(),
    filename: filenameMatch?.[1] ?? `fudia-ia-${month}.csv`,
  };
}
