import type {
  AdminTeamErrorResponse,
  AdminTeamResponse,
  AdminTeamRoleKey,
} from "@/src/lib/admin-team/types";
import { createCurrentSessionJwt } from "./auth";

type RequestFailure = {
  success: false;
  code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
  message: string;
};
type RequestSuccess<T> = { success: true; data: T };

const GENERIC_ERROR_MESSAGE = "No se pudo cargar el equipo administrativo.";

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<RequestSuccess<T> | RequestFailure> {
  const jwt = await createCurrentSessionJwt();
  if (!jwt)
    return { success: false, code: "NO_SESSION", message: "Tu sesion expiro." };

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
        message: "Tu sesion expiro.",
      };
    if (response.status === 403) {
      const payload = (await response
        .json()
        .catch(() => null)) as AdminTeamErrorResponse | null;
      return {
        success: false,
        code: "FORBIDDEN",
        message: payload?.message ?? "No tienes acceso al panel de equipo.",
      };
    }
    if (!response.ok) {
      const payload = (await response
        .json()
        .catch(() => null)) as AdminTeamErrorResponse | null;
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

export function getAdminTeam() {
  return request<AdminTeamResponse>("/api/admin/team");
}

export function inviteAdminTeamMember(email: string, role: AdminTeamRoleKey) {
  return request<{ success: true }>("/api/admin/team/invitations", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export function acceptAdminTeamInvitation(input: {
  teamId: string;
  membershipId: string;
  userId: string;
  secret: string;
}) {
  return request<{ success: true }>("/api/admin/team/invitations/accept", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
