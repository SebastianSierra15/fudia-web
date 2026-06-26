import { NextRequest, NextResponse } from "next/server";
import {
  createAdminLogsCsv,
  getAdminLogs,
  parseLogsDate,
} from "@/src/lib/admin-logs/server";
import {
  writeAdminWebExceptionLog,
  writeAdminWebLog,
} from "@/src/lib/admin-logs/web-logger";
import {
  readBearerToken,
  validateAdminJwt,
} from "@/src/lib/auth/admin-server";

const GENERIC_ERROR_MESSAGE = "No se pudieron cargar los logs.";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) {
    return jsonError("Autenticacion requerida.", 401);
  }

  let actorUserId = "";
  let date = "";

  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success) {
      return jsonError("No tienes acceso a este recurso.", authorization.status);
    }
    actorUserId = authorization.userId;

    const parsedDate = parseLogsDate(request.nextUrl.searchParams.get("date"));
    if (!parsedDate) {
      return jsonError(
        "El parametro date debe usar YYYY-MM-DD y no puede ser futuro.",
        400,
      );
    }
    date = parsedDate;

    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
    if (forceRefresh) {
      await writeAdminWebLog({
        level: "info",
        functionName: "admin-logs",
        eventName: "admin_logs_refreshed",
        userId: actorUserId,
        message: "Actualizacion manual del panel de logs.",
        metadata: { date },
      });
    }

    const data = await getAdminLogs(date, forceRefresh);

    if (request.nextUrl.searchParams.get("format") === "csv") {
      const csv = createAdminLogsCsv(data);
      await writeAdminWebLog({
        level: "info",
        functionName: "admin-logs",
        eventName: "admin_logs_exported",
        userId: actorUserId,
        message: "Exportacion CSV de logs generada desde el panel admin.",
        metadata: { date },
      });

      return new NextResponse(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="fudia-logs-${date}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (cause) {
    await writeAdminWebExceptionLog({
      functionName: "admin-logs",
      eventName: "admin_logs_load_failed",
      userId: actorUserId || undefined,
      message: "Fallo inesperado cargando el panel de logs.",
      metadata: { date: date || null },
      error: cause,
    });
    return jsonError(GENERIC_ERROR_MESSAGE, 500);
  }
}
