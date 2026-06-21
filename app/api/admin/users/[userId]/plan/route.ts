import { NextRequest, NextResponse } from "next/server";
import { changeAdminUserPlan } from "@/src/lib/admin-users/server";
import { readBearerToken, validateAdminJwt } from "@/src/lib/auth/admin-server";

function error(message: string, status: number) { return NextResponse.json({ success: false, message }, { status, headers: { "Cache-Control": "no-store" } }); }

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  const { userId } = await context.params;
  const body = await request.json().catch(() => null) as { plan?: string } | null;
  if (!userId || (body?.plan !== "free" && body?.plan !== "premium")) return error("La accion solicitada no es valida.", 400);
  try {
    const authorization = await validateAdminJwt(jwt);
    if (!authorization.success) return error("No tienes acceso a este recurso.", authorization.status);
    await changeAdminUserPlan(userId, body.plan, authorization.userId);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    if (cause instanceof Error && (cause.message === "SELF_MUTATION" || cause.message === "ADMIN_MUTATION")) return error("No puedes modificar el plan de una cuenta administradora.", 403);
    return error("No se pudo actualizar el plan del usuario.", 500);
  }
}
