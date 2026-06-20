import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE_MAX_AGE_SECONDS,
  ADMIN_ACCESS_COOKIE_NAME,
} from "@/src/lib/auth/admin";
import { validateAdminJwt } from "@/src/lib/auth/admin-server";

const GENERIC_ERROR_MESSAGE = "Ocurrio un error. Intenta mas tarde.";

function buildUnauthorizedResponse(status: 401 | 403) {
  const response = NextResponse.json(
    { success: false, message: GENERIC_ERROR_MESSAGE },
    { status },
  );

  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const jwt = typeof payload?.jwt === "string" ? payload.jwt.trim() : "";

  if (!jwt) {
    return buildUnauthorizedResponse(401);
  }

  try {
    const validation = await validateAdminJwt(jwt);

    if (!validation.success) {
      return buildUnauthorizedResponse(validation.status);
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set({
      name: ADMIN_ACCESS_COOKIE_NAME,
      value: "1",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_ACCESS_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: GENERIC_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}
