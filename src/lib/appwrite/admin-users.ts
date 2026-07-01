import type {
  AdminUserAction,
  AdminUsersErrorResponse,
  AdminUsersQuery,
  AdminUsersResponse,
} from "@/src/lib/admin-users/types";
import { createCurrentSessionJwt } from "./auth";

type RequestFailure = {
  success: false;
  code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
  message: string;
};
type RequestSuccess<T> = { success: true; data: T };

const GENERIC_ERROR_MESSAGE = "No se pudo cargar el panel de usuarios.";

function toSearchParams(query: AdminUsersQuery) {
  return new URLSearchParams({
    search: query.search,
    plan: query.plan,
    status: query.status,
    onboarding: query.onboarding,
    sort: query.sort,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<RequestSuccess<T> | RequestFailure> {
  const jwt = await createCurrentSessionJwt();
  if (!jwt)
    return { success: false, code: "NO_SESSION", message: "Tu sesión expiro." };
  try {
    const response = await fetch(path, {
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
    const payload = (await response
      .clone()
      .json()
      .catch(() => null)) as AdminUsersErrorResponse | null;
    if (response.status === 403) {
      const message =
        payload?.message ?? "No tienes acceso al panel de usuarios.";
      if (
        message !== "No tienes acceso a este recurso." &&
        message !== "No tienes acceso al panel de usuarios."
      ) {
        return {
          success: false,
          code: "REQUEST_ERROR",
          message,
        };
      }

      return {
        success: false,
        code: "FORBIDDEN",
        message,
      };
    }
    if (!response.ok) {
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

export function getAdminUsers(query: AdminUsersQuery) {
  return request<AdminUsersResponse>(
    `/api/admin/users?${toSearchParams(query).toString()}`,
  );
}

export async function getAdminUsersCsv(query: AdminUsersQuery) {
  const jwt = await createCurrentSessionJwt();
  if (!jwt)
    return {
      success: false as const,
      code: "NO_SESSION" as const,
      message: "Tu sesión expiro.",
    };
  const params = toSearchParams(query);
  params.set("format", "csv");
  try {
    const response = await fetch(`/api/admin/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (response.status === 401)
      return {
        success: false as const,
        code: "NO_SESSION" as const,
        message: "Tu sesión expiro.",
      };
    if (response.status === 403)
      return {
        success: false as const,
        code: "FORBIDDEN" as const,
        message: "No tienes acceso al panel de usuarios.",
      };
    if (!response.ok)
      return {
        success: false as const,
        code: "REQUEST_ERROR" as const,
        message: GENERIC_ERROR_MESSAGE,
      };
    const disposition = response.headers.get("content-disposition") ?? "";
    return {
      success: true as const,
      blob: await response.blob(),
      filename:
        disposition.match(/filename="([^"]+)"/)?.[1] ?? "fudia-usuarios.csv",
    };
  } catch {
    return {
      success: false as const,
      code: "REQUEST_ERROR" as const,
      message: GENERIC_ERROR_MESSAGE,
    };
  }
}

export function updateAdminUserStatus(
  userId: string,
  accountStatus: "active" | "suspended",
) {
  return request<{ user: unknown }>(
    `/api/admin/users/${encodeURIComponent(userId)}/status`,
    { method: "PATCH", body: JSON.stringify({ accountStatus }) },
  );
}

export function updateAdminUserPlan(userId: string, plan: "free" | "premium") {
  return request<{ user: unknown }>(
    `/api/admin/users/${encodeURIComponent(userId)}/plan`,
    { method: "PATCH", body: JSON.stringify({ plan }) },
  );
}

export function runAdminUserAction(userId: string, action: AdminUserAction) {
  return request<{ success: true }>(
    `/api/admin/users/${encodeURIComponent(userId)}/action`,
    { method: "POST", body: JSON.stringify({ action }) },
  );
}
