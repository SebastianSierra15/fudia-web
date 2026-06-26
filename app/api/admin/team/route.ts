import { NextRequest, NextResponse } from "next/server";
import { getAdminTeam } from "@/src/lib/admin-team/server";
import {
  writeAdminWebExceptionLog,
  writeAdminWebLog,
} from "@/src/lib/admin-logs/web-logger";
import { readBearerToken, validateAdminJwt } from "@/src/lib/auth/admin-server";

function error(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(request: NextRequest) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  let actorUserId = "";

  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success)
      return error("No tienes acceso a este recurso.", authorization.status);
    actorUserId = authorization.userId;
    const data = await getAdminTeam(actorUserId);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (cause) {
    await writeAdminWebExceptionLog({
      functionName: "admin-team",
      eventName: "admin_team_load_failed",
      userId: actorUserId || undefined,
      message: "Fallo inesperado cargando el equipo administrativo.",
      error: cause,
    });
    return error("No se pudo cargar el equipo administrativo.", 500);
  }
}

export async function POST() {
  await writeAdminWebLog({
    level: "warn",
    functionName: "admin-team",
    eventName: "admin_team_invalid_method",
    message: "Metodo no permitido para la ruta de equipo.",
    statusCode: 405,
  });
  return error("Metodo no permitido.", 405);
}
