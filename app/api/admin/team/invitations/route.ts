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

function getOrigin(request: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured;
  return request.nextUrl.origin;
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
