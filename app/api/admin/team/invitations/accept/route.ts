import { Account, Client, Teams } from "appwrite";
import { NextRequest, NextResponse } from "next/server";
import { logAdminTeamInvitationAccepted } from "@/src/lib/admin-team/server";
import { writeAdminWebExceptionLog } from "@/src/lib/admin-logs/web-logger";
import { APPWRITE_ADMIN_TEAM_ID } from "@/src/lib/auth/admin";
import { readBearerToken } from "@/src/lib/auth/admin-server";

function error(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function getConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) throw new Error("Missing Appwrite config");
  return { endpoint, projectId };
}

export async function POST(request: NextRequest) {
  const jwt = readBearerToken(request.headers.get("authorization"));
  if (!jwt) return error("Autenticacion requerida.", 401);
  const body = (await request.json().catch(() => null)) as {
    teamId?: string;
    membershipId?: string;
    userId?: string;
    secret?: string;
  } | null;

  if (
    body?.teamId !== APPWRITE_ADMIN_TEAM_ID ||
    !body.membershipId ||
    !body.userId ||
    !body.secret
  ) {
    return error("El enlace de invitacion no es valido.", 400);
  }

  try {
    const { endpoint, projectId } = getConfig();
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setJWT(jwt);
    const account = new Account(client);
    const user = await account.get();

    if (!user.emailVerification) {
      return error("Verifica tu correo antes de aceptar la invitacion.", 403);
    }

    if (user.$id !== body.userId) {
      return error("Esta invitacion pertenece a otro usuario.", 403);
    }

    const teams = new Teams(client);
    await teams.updateMembershipStatus({
      teamId: body.teamId,
      membershipId: body.membershipId,
      userId: body.userId,
      secret: body.secret,
    });
    await logAdminTeamInvitationAccepted(user.$id);
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    await writeAdminWebExceptionLog({
      functionName: "admin-team",
      eventName: "admin_team_invitation_accept_failed",
      userId: body?.userId,
      message: "No se pudo aceptar una invitacion administrativa.",
      error: cause,
    });
    return error("No se pudo aceptar la invitacion administrativa.", 500);
  }
}
