import { NextRequest, NextResponse } from "next/server";
import {
  createAdminAiUsageCsv,
  getAdminAiUsage,
  parseAiUsageMonth,
} from "@/src/lib/admin-ai/server";
import {
  readBearerToken,
  validateAdminJwt,
} from "@/src/lib/auth/admin-server";

const GENERIC_ERROR_MESSAGE = "No se pudo cargar el uso de IA.";

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

    const month = parseAiUsageMonth(request.nextUrl.searchParams.get("month"));
    if (!month) {
      return jsonError(
        "El parametro month debe usar YYYY-MM y no puede ser futuro.",
        400,
      );
    }

    const data = await getAdminAiUsage(month);

    if (request.nextUrl.searchParams.get("format") === "csv") {
      const csv = createAdminAiUsageCsv(data);
      const fileDate = data.generatedAt.slice(0, 10);

      return new NextResponse(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="fudia-ia-${month}-${fileDate}.csv"`,
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
