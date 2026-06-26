import { NextRequest, NextResponse } from "next/server";
import { changeAdminUserStatus } from "@/src/lib/admin-users/server";
import { writeAdminWebLog } from "@/src/lib/admin-logs/web-logger";
import { readBearerToken, validateAdminJwt } from "@/src/lib/auth/admin-server";

function error(message: string, status: number) { return NextResponse.json({ success: false, message }, { status, headers: { "Cache-Control": "no-store" } }); }

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  const { userId } = await context.params;
  const body = await request.json().catch(() => null) as { accountStatus?: string } | null;
  if (!userId || (body?.accountStatus !== "active" && body?.accountStatus !== "suspended")) return error("La accion solicitada no es valida.", 400);
  let actorUserId = "";
  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success) return error("No tienes acceso a este recurso.", authorization.status);
    actorUserId = authorization.userId;
    await changeAdminUserStatus(userId, body.accountStatus, authorization.userId);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    await writeAdminWebLog({
      level: "warn",
      functionName: "admin-users",
      eventName: "admin_user_status_change_failed",
      userId,
      message: "Cambio de estado de usuario no completado.",
      statusCode: cause instanceof Error && (cause.message === "SELF_MUTATION" || cause.message === "ADMIN_MUTATION") ? 403 : 500,
      metadata: {
        actorUserId,
        requestedStatus: body.accountStatus,
        reason: cause instanceof Error ? cause.message : "UNKNOWN",
      },
    });
    if (cause instanceof Error && (cause.message === "SELF_MUTATION" || cause.message === "ADMIN_MUTATION")) return error("No puedes modificar el estado de una cuenta administradora.", 403);
    return error("No se pudo actualizar el estado de la cuenta.", 500);
  }
}
