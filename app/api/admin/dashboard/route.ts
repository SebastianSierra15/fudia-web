import { NextRequest, NextResponse } from "next/server";
import { getAdminDashboardSummary } from "@/src/lib/admin-dashboard/server";
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
  let growthWeeks = 8;

  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success)
      return error("No tienes acceso a este recurso.", authorization.status);
    actorUserId = authorization.userId;

    growthWeeks = Number(request.nextUrl.searchParams.get("weeks") ?? "8");
    if (![8, 12, 24].includes(growthWeeks))
      return error("El rango solicitado no es valido.", 400);
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    const data = await getAdminDashboardSummary(
      growthWeeks,
      forceRefresh,
    );
    if (forceRefresh) {
      await writeAdminWebLog({
        level: "info",
        functionName: "admin-dashboard",
        eventName: "admin_dashboard_refreshed",
        userId: actorUserId,
        message: "Actualizacion manual del dashboard administrativo.",
        metadata: { growthWeeks },
      });
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    await writeAdminWebExceptionLog({
      functionName: "admin-dashboard",
      eventName: "admin_dashboard_load_failed",
      userId: actorUserId || undefined,
      message: "Fallo inesperado cargando el dashboard administrativo.",
      metadata: { growthWeeks },
      error: cause,
    });
    return error("No se pudo cargar el resumen administrativo.", 500);
  }
}
