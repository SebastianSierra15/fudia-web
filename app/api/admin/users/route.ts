import { NextRequest, NextResponse } from "next/server";
import { createAdminUsersCsv, getAdminUsers, parseAdminUsersQuery } from "@/src/lib/admin-users/server";
import { readBearerToken, validateAdminJwt } from "@/src/lib/auth/admin-server";

function error(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  const query = parseAdminUsersQuery(request.nextUrl.searchParams);
  if (!query) return error("Los filtros enviados no son validos.", 400);
  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success) return error("No tienes acceso a este recurso.", authorization.status);
    const data = await getAdminUsers(query);
    if (request.nextUrl.searchParams.get("format") === "csv") {
      return new NextResponse(`\uFEFF${createAdminUsersCsv(data)}`, { status: 200, headers: { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="fudia-usuarios-${data.metricsMonth}.csv"`, "Content-Type": "text/csv; charset=utf-8" } });
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("No se pudo cargar el panel de usuarios.", 500);
  }
}
