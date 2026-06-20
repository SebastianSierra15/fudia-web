import { NextRequest, NextResponse } from "next/server";
import {
  createAdminLogsCsv,
  getAdminLogs,
  parseLogsDate,
} from "@/src/lib/admin-logs/server";
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

  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success) {
      return jsonError("No tienes acceso a este recurso.", authorization.status);
    }

    const date = parseLogsDate(request.nextUrl.searchParams.get("date"));
    if (!date) {
      return jsonError(
        "El parametro date debe usar YYYY-MM-DD y no puede ser futuro.",
        400,
      );
    }

    const data = await getAdminLogs(date);

    if (request.nextUrl.searchParams.get("format") === "csv") {
      const csv = createAdminLogsCsv(data);

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
  } catch {
    return jsonError(GENERIC_ERROR_MESSAGE, 500);
  }
}
