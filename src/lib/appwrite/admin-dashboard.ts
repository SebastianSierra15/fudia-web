import type {
  AdminDashboardErrorResponse,
  AdminDashboardSummary,
} from "@/src/lib/admin-dashboard/types";
import { createCurrentSessionJwt } from "./auth";

type DashboardResult =
  | { success: true; data: AdminDashboardSummary }
  | {
      success: false;
      code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
      message: string;
    };

export async function getAdminDashboard(
  weeks = 8,
  refresh = false,
): Promise<DashboardResult> {
  const jwt = await createCurrentSessionJwt();
  if (!jwt) {
    return { success: false, code: "NO_SESSION", message: "Tu sesión expiro." };
  }

  try {
    const params = new URLSearchParams({ weeks: String(weeks) });
    if (refresh) params.set("refresh", "1");
    const response = await fetch(`/api/admin/dashboard?${params.toString()}`, {
      headers: { Authorization: `Bearer ${jwt}` },
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
        message: "No tienes acceso al panel.",
      };
    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as AdminDashboardErrorResponse | null;
      return {
        success: false,
        code: "REQUEST_ERROR",
        message: payload?.message ?? "No se pudo cargar el dashboard.",
      };
    }
    return {
      success: true,
      data: (await response.json()) as AdminDashboardSummary,
    };
  } catch {
    return {
      success: false,
      code: "REQUEST_ERROR",
      message: "No se pudo cargar el dashboard.",
    };
  }
}
