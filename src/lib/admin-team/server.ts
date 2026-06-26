import "server-only";

import { Query } from "appwrite";
import { APPWRITE_ADMIN_TEAM_ID } from "@/src/lib/auth/admin";
import { writeAdminWebLog } from "@/src/lib/admin-logs/web-logger";
import type {
  AdminTeamMember,
  AdminTeamResponse,
  AdminTeamRoleKey,
} from "./types";

type Membership = {
  $id: string;
  $createdAt?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  invited?: string;
  joined?: string;
  confirm?: boolean;
  roles?: string[];
};

type MembershipPage = {
  memberships?: Membership[];
  total?: number;
};

const ROLE_OPTIONS: Array<{ key: AdminTeamRoleKey; label: string }> = [
  { key: "super_admin", label: "Super Admin" },
  { key: "cofounder", label: "Co-fundador" },
  { key: "cto", label: "Co-fundador / CTO" },
  { key: "support", label: "Soporte" },
];

const ROLE_LABELS: Record<AdminTeamRoleKey, string> = {
  super_admin: "Super Admin",
  cofounder: "Co-fundador",
  cto: "Co-fundador / CTO",
  support: "Soporte",
  admin: "Admin",
};

function getConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    return null;
  }

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    projectId,
    apiKey,
    adminTeamId: APPWRITE_ADMIN_TEAM_ID,
  };
}

function headers(config: NonNullable<ReturnType<typeof getConfig>>) {
  return {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-Key": config.apiKey,
    "Content-Type": "application/json",
  };
}

function sessionHeaders(
  config: NonNullable<ReturnType<typeof getConfig>>,
  jwt: string,
) {
  return {
    "X-Appwrite-Project": config.projectId,
    "X-Appwrite-JWT": jwt,
    "Content-Type": "application/json",
  };
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function initials(name: string, email: string) {
  const source = name || email || "Admin";
  const parts = source.includes("@")
    ? [source.slice(0, 2)]
    : source.split(/\s+/).filter(Boolean).slice(0, 2);
  return (
    parts
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "AD"
  );
}

function mapRole(roles: string[] | undefined): {
  roleKey: AdminTeamRoleKey;
  roleLabel: string;
} {
  const normalized = (roles ?? []).map((role) => role.trim().toLowerCase());
  const roleKey =
    ROLE_OPTIONS.find((option) => normalized.includes(option.key))?.key ??
    (normalized.includes("owner") ? "super_admin" : "admin");
  return { roleKey, roleLabel: ROLE_LABELS[roleKey] };
}

function mapMembership(
  membership: Membership,
  actorUserId: string,
): AdminTeamMember {
  const name = cleanText(membership.userName) || "Sin nombre";
  const email = cleanText(membership.userEmail);
  const role = mapRole(membership.roles);
  const confirmed = membership.confirm === true;

  return {
    membershipId: membership.$id,
    userId: cleanText(membership.userId),
    name,
    email,
    initials: initials(name, email),
    ...role,
    status: confirmed ? "active" : "pending",
    joinedAt: cleanText(membership.joined) || null,
    invitedAt: cleanText(membership.invited) || membership.$createdAt || null,
    isCurrentUser: membership.userId === actorUserId,
  };
}

export function isAdminTeamRole(value: unknown): value is AdminTeamRoleKey {
  return ROLE_OPTIONS.some((option) => option.key === value);
}

export async function getAdminTeam(
  actorUserId: string,
): Promise<AdminTeamResponse> {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin team configuration");
  const memberships: Membership[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = new URL(
      `${config.endpoint}/teams/${encodeURIComponent(
        config.adminTeamId,
      )}/memberships`,
    );
    [Query.limit(limit), Query.offset(offset)].forEach((item) =>
      url.searchParams.append("queries[]", item),
    );
    const response = await fetch(url, {
      headers: headers(config),
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`Membership list failed with ${response.status}`);
    const page = (await response.json()) as MembershipPage;
    memberships.push(...(page.memberships ?? []));
    if ((page.memberships ?? []).length < limit) break;
    offset += limit;
  }

  const members = memberships
    .map((membership) => mapMembership(membership, actorUserId))
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === "active" ? -1 : 1;
      if (left.isCurrentUser !== right.isCurrentUser)
        return left.isCurrentUser ? -1 : 1;
      return left.name.localeCompare(right.name, "es");
    });

  return {
    generatedAt: new Date().toISOString(),
    members,
    summary: {
      total: members.length,
      active: members.filter((member) => member.status === "active").length,
      pending: members.filter((member) => member.status === "pending").length,
    },
    roles: ROLE_OPTIONS,
  };
}

export async function inviteAdminTeamMember(input: {
  actorUserId: string;
  actorJwt: string;
  email: string;
  role: AdminTeamRoleKey;
  origin: string;
}) {
  const config = getConfig();
  if (!config) throw new Error("Missing Appwrite admin team configuration");
  const email = input.email.trim().toLowerCase();
  const inviteUrl = `${input.origin.replace(/\/$/, "")}/admin/equipo/invitacion`;
  try {
    const response = await fetch(
      `${config.endpoint}/teams/${encodeURIComponent(
        APPWRITE_ADMIN_TEAM_ID,
      )}/memberships`,
      {
        method: "POST",
        headers: sessionHeaders(config, input.actorJwt),
        cache: "no-store",
        body: JSON.stringify({
          roles: [input.role],
          email,
          url: inviteUrl,
        }),
      },
    );
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`APPWRITE_${response.status}:${body.slice(0, 120)}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("APPWRITE_409")) throw new Error("DUPLICATE_MEMBER");
    if (message.includes("APPWRITE_401") || message.includes("APPWRITE_403"))
      throw new Error("INVITER_NOT_ALLOWED");
    throw error;
  }

  await writeAdminWebLog({
    level: "info",
    functionName: "admin-team",
    eventName: "admin_team_invitation_created",
    userId: input.actorUserId,
    message: "Invitacion administrativa creada.",
    metadata: {
      role: input.role,
      targetEmailDomain: email.split("@")[1] ?? "",
    },
  });
}

export async function logAdminTeamInvitationAccepted(userId: string) {
  await writeAdminWebLog({
    level: "info",
    functionName: "admin-team",
    eventName: "admin_team_invitation_accepted",
    userId,
    message: "Invitacion administrativa aceptada.",
  });
}
