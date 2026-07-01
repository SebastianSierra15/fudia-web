import { NextRequest, NextResponse } from "next/server";
import {
  inviteAdminTeamMember,
  isAdminTeamRole,
} from "@/src/lib/admin-team/server";
import {
  writeAdminWebExceptionLog,
  writeAdminWebLog,
} from "@/src/lib/admin-logs/web-logger";
import { readBearerToken, validateAdminJwt } from "@/src/lib/auth/admin-server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function error(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function parseOrigin(origin: string) {
  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

function isBindableHost(hostname: string) {
  return ["0.0.0.0", "::", "[::]"].includes(hostname);
}

function toPublicOrigin(origin: string) {
  const url = parseOrigin(origin);
  if (!url) return "";
  if (isBindableHost(url.hostname)) {
    url.hostname = "localhost";
  }
  return url.origin;
}

function getForwardedOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) return "";
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = forwardedHost.split(",")[0]?.trim();
  const protocol = forwardedProto.split(",")[0]?.trim();
  if (!host || !protocol) return "";
  return toPublicOrigin(`${protocol}://${host}`);
}

function getConfiguredOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return "";
  const origin = toPublicOrigin(configured);
  if (!origin) return "";
  const url = parseOrigin(origin);
  return url && !isBindableHost(url.hostname) ? origin : "";
}

function getOrigin(request: NextRequest) {
  return (
    getConfiguredOrigin() ||
    getForwardedOrigin(request) ||
    toPublicOrigin(request.nextUrl.origin) ||
    "http://localhost:3000"
  );
}

export async function POST(request: NextRequest) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    role?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";

  if (!EMAIL_PATTERN.test(email) || !isAdminTeamRole(body?.role)) {
    return error("La invitacion solicitada no es valida.", 400);
  }

  let actorUserId = "";
  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success)
      return error("No tienes acceso a este recurso.", authorization.status);
    actorUserId = authorization.userId;
    await inviteAdminTeamMember({
      actorUserId,
      actorJwt: jwt,
      email,
      role: body.role,
      origin: getOrigin(request),
    });
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "UNKNOWN";
    await writeAdminWebLog({
      level: "warn",
      functionName: "admin-team",
      eventName: "admin_team_invitation_failed",
      userId: actorUserId || undefined,
      message: "Invitacion administrativa no completada.",
      statusCode: reason === "DUPLICATE_MEMBER" ? 409 : 500,
      metadata: {
        role: body.role,
        reason,
        targetEmailDomain: email.split("@")[1] ?? "",
      },
    });
    if (reason === "DUPLICATE_MEMBER")
      return error("Este correo ya tiene una invitacion o acceso admin.", 409);
    if (reason === "INVITER_NOT_ALLOWED")
      return error(
        "Tu cuenta admin no tiene permisos para enviar invitaciones del equipo.",
        403,
      );
    await writeAdminWebExceptionLog({
      functionName: "admin-team",
      eventName: "admin_team_invitation_unexpected_failed",
      userId: actorUserId || undefined,
      message: "Fallo inesperado creando invitacion administrativa.",
      error: cause,
    });
    return error("No se pudo crear la invitacion administrativa.", 500);
  }
}
