import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSettings,
  parseAdminSettingsPayload,
  updateAdminSettings,
} from "@/src/lib/admin-settings/server";
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

async function authorize(request: NextRequest) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return { success: false as const, response: error("Autenticacion requerida.", 401) };
  const authorization = await validateAdminJwt(jwt);
  if (!authorization.success) {
    return {
      success: false as const,
      response: error("No tienes acceso a este recurso.", authorization.status),
    };
  }
  return { success: true as const, userId: authorization.userId };
}

export async function GET(request: NextRequest) {
  let actorUserId = "";
  try {
    const authorization = await authorize(request);
    if (!authorization.success) return authorization.response;
    actorUserId = authorization.userId;
    const data = await getAdminSettings();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (cause) {
    await writeAdminWebExceptionLog({
      functionName: "admin-settings",
      eventName: "admin_settings_load_failed",
      userId: actorUserId || undefined,
      message: "Fallo inesperado cargando la configuracion administrativa.",
      error: cause,
    });
    return error("No se pudo cargar la configuracion.", 500);
  }
}

export async function PUT(request: NextRequest) {
  let actorUserId = "";
  try {
    const authorization = await authorize(request);
    if (!authorization.success) return authorization.response;
    actorUserId = authorization.userId;
    const body = (await request.json().catch(() => null)) as {
      settings?: unknown;
    } | null;
    const settings = parseAdminSettingsPayload(body?.settings);
    if (!settings) {
      await writeAdminWebLog({
        level: "warn",
        functionName: "admin-settings",
        eventName: "admin_settings_invalid_payload",
        userId: actorUserId,
        message: "Payload invalido al actualizar configuracion admin.",
        statusCode: 400,
      });
      return error("La configuracion enviada no es valida.", 400);
    }
    const data = await updateAdminSettings(settings, actorUserId);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (cause) {
    await writeAdminWebExceptionLog({
      functionName: "admin-settings",
      eventName: "admin_settings_update_failed",
      userId: actorUserId || undefined,
      message: "Fallo inesperado actualizando la configuracion administrativa.",
      error: cause,
    });
    return error("No se pudo guardar la configuracion.", 500);
  }
}
