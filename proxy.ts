import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  ADMIN_AUTHORIZE_PATH,
} from "@/src/lib/auth/admin";

function buildAuthorizeRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  const targetPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = ADMIN_AUTHORIZE_PATH;
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", targetPath);

  return NextResponse.redirect(redirectUrl);
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith(ADMIN_AUTHORIZE_PATH)) {
    return NextResponse.next();
  }

  const hasAdminCookie = Boolean(
    request.cookies.get(ADMIN_ACCESS_COOKIE_NAME)?.value,
  );

  if (!hasAdminCookie) {
    return buildAuthorizeRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
