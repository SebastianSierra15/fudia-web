import { NextRequest, NextResponse } from "next/server";
import { runAdminUserAction } from "@/src/lib/admin-users/server";
import { writeAdminWebLog } from "@/src/lib/admin-logs/web-logger";
import { readBearerToken, validateAdminJwt } from "@/src/lib/auth/admin-server";

const actions = new Set([
  "credentials_email",
  "credentials_whatsapp",
  "welcome_email",
  "welcome_whatsapp",
]);

function error(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  const { userId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
  } | null;
  if (!userId || !body?.action || !actions.has(body.action))
    return error("La accion solicitada no es valida.", 400);
  let actorUserId = "";
  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success)
      return error("No tienes acceso a este recurso.", authorization.status);
    actorUserId = authorization.userId;
    await runAdminUserAction(
      userId,
      body.action as Parameters<typeof runAdminUserAction>[1],
      authorization.userId,
    );
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    await writeAdminWebLog({
      level: "warn",
      functionName: "admin-users",
      eventName: "admin_user_action_failed",
      userId,
      message: "Accion administrativa de usuario no completada.",
      statusCode:
        cause instanceof Error &&
        (cause.message === "SELF_MUTATION" || cause.message === "ADMIN_MUTATION")
          ? 403
          : cause instanceof Error &&
              (cause.message === "WHATSAPP_NOT_CONFIGURED" ||
                cause.message === "USER_EMAIL_NOT_AVAILABLE" ||
                cause.message === "ACTION_PERMISSIONS_MISSING" ||
                cause.message === "EMAIL_PROVIDER_UNAVAILABLE")
            ? 422
            : undefined,
      metadata: {
        actorUserId,
        action: body.action,
        reason: cause instanceof Error ? cause.message : "UNKNOWN",
      },
    });
    if (
      cause instanceof Error &&
      (cause.message === "SELF_MUTATION" || cause.message === "ADMIN_MUTATION")
    )
      return error(
        "No puedes ejecutar acciones sobre una cuenta administradora.",
        403,
      );
    if (cause instanceof Error && cause.message === "WHATSAPP_NOT_CONFIGURED")
      return error("WhatsApp no esta configurado para Fudia.", 422);
    if (cause instanceof Error && cause.message === "USER_EMAIL_NOT_AVAILABLE")
      return error("El usuario no tiene un correo disponible para esta accion.", 422);
    if (cause instanceof Error && cause.message === "INVALID_ACTION")
      return error("La accion solicitada no es valida.", 400);
    if (cause instanceof Error && cause.message === "ACTION_PERMISSIONS_MISSING")
      return error("La configuracion de correo no tiene permisos suficientes.", 422);
    if (cause instanceof Error && cause.message === "ACTION_USER_NOT_FOUND")
      return error("El usuario seleccionado ya no esta disponible.", 404);
    if (cause instanceof Error && cause.message === "EMAIL_PROVIDER_UNAVAILABLE")
      return error("El proveedor de correo no esta disponible.", 422);
    return error("No se pudo completar la accion solicitada.", 500);
  }
}
