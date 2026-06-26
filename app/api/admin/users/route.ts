import { NextRequest, NextResponse } from "next/server";
import { createAdminUsersCsv, getAdminUsers, parseAdminUsersQuery } from "@/src/lib/admin-users/server";
import {
  writeAdminWebExceptionLog,
  writeAdminWebLog,
} from "@/src/lib/admin-logs/web-logger";
import { readBearerToken, validateAdminJwt } from "@/src/lib/auth/admin-server";

function error(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  const query = parseAdminUsersQuery(request.nextUrl.searchParams);
  if (!query) return error("Los filtros enviados no son validos.", 400);
  let actorUserId = "";
  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success) return error("No tienes acceso a este recurso.", authorization.status);
    actorUserId = authorization.userId;
    const data = await getAdminUsers(query);
    if (request.nextUrl.searchParams.get("format") === "csv") {
      await writeAdminWebLog({
        level: "info",
        functionName: "admin-users",
        eventName: "admin_users_exported",
        userId: actorUserId,
        message: "Exportacion CSV de usuarios generada desde el panel admin.",
        metadata: {
          page: query.page,
          pageSize: query.pageSize,
          plan: query.plan,
          status: query.status,
          onboarding: query.onboarding,
        },
      });
      return new NextResponse(`\uFEFF${createAdminUsersCsv(data)}`, { status: 200, headers: { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="fudia-usuarios-${data.metricsMonth}.csv"`, "Content-Type": "text/csv; charset=utf-8" } });
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    await writeAdminWebExceptionLog({
      functionName: "admin-users",
      eventName: "admin_users_load_failed",
      userId: actorUserId || undefined,
      message: "Fallo inesperado cargando el panel de usuarios.",
      error: cause,
    });
    return error("No se pudo cargar el panel de usuarios.", 500);
  }
}
