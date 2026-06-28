import type {
  AdminSettings,
  AdminSettingsErrorResponse,
  AdminSettingsResponse,
} from "@/src/lib/admin-settings/types";
import { createCurrentSessionJwt } from "./auth";

type RequestFailure = {
  success: false;
  code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
  message: string;
};
type RequestSuccess<T> = { success: true; data: T };

const GENERIC_ERROR_MESSAGE = "No se pudo cargar la configuracion.";

async function request<T>(
  init?: RequestInit,
): Promise<RequestSuccess<T> | RequestFailure> {
  const jwt = await createCurrentSessionJwt();
  if (!jwt)
    return { success: false, code: "NO_SESSION", message: "Tu sesión expiro." };

  try {
    const response = await fetch("/api/admin/settings", {
      ...init,
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (response.status === 401)
      return {
        success: false,
        code: "NO_SESSION",
        message: "Tu sesión expiro.",
      };
    if (response.status === 403)
      return {
        success: false,
        code: "FORBIDDEN",
        message: "No tienes acceso a la configuracion.",
      };
    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as AdminSettingsErrorResponse | null;
      return {
        success: false,
        code: "REQUEST_ERROR",
        message: payload?.message ?? GENERIC_ERROR_MESSAGE,
      };
    }

    return { success: true, data: (await response.json()) as T };
  } catch {
    return {
      success: false,
      code: "REQUEST_ERROR",
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}

export function getAdminSettings() {
  return request<AdminSettingsResponse>();
}

export function saveAdminSettings(settings: AdminSettings) {
  return request<AdminSettingsResponse>({
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}
