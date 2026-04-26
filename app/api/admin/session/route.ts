import { Account, Client, Teams } from "appwrite";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE_MAX_AGE_SECONDS,
  ADMIN_ACCESS_COOKIE_NAME,
  APPWRITE_ADMIN_TEAM_ID,
} from "@/src/lib/auth/admin";

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

function getServerConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error("Missing Appwrite config");
  }

  return { endpoint, projectId };
}

async function validateAdminAccess(jwt: string) {
  const { endpoint, projectId } = getServerConfig();

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setJWT(jwt);

  const account = new Account(client);
  const user = await account.get();

  if (!user.emailVerification) {
    return false;
  }

  const teams = new Teams(client);
  const teamList = await teams.list({ total: false });

  return teamList.teams.some((team) => team.$id === APPWRITE_ADMIN_TEAM_ID);
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const jwt = typeof payload?.jwt === "string" ? payload.jwt.trim() : "";

  if (!jwt) {
    return buildUnauthorizedResponse(401);
  }

  try {
    const hasAdminAccess = await validateAdminAccess(jwt);

    if (!hasAdminAccess) {
      return buildUnauthorizedResponse(403);
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
