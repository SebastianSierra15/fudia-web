import "server-only";

import { Account, Client, Teams } from "appwrite";
import { APPWRITE_ADMIN_TEAM_ID } from "./admin";

type AdminValidationResult =
  | { success: true; userId: string }
  | { success: false; status: 401 | 403 };

function getServerAppwriteConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error("Missing Appwrite server config");
  }

  return { endpoint, projectId };
}

export function readBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function validateAdminJwt(
  jwt: string,
): Promise<AdminValidationResult> {
  const { endpoint, projectId } = getServerAppwriteConfig();
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setJWT(jwt);

  try {
    const account = new Account(client);
    const user = await account.get();

    if (!user.emailVerification) {
      return { success: false, status: 403 };
    }

    const teams = new Teams(client);
    const teamList = await teams.list({ total: false });
    const isAdmin = teamList.teams.some(
      (team) => team.$id === APPWRITE_ADMIN_TEAM_ID,
    );

    if (!isAdmin) {
      return { success: false, status: 403 };
    }

    return { success: true, userId: user.$id };
  } catch {
    return { success: false, status: 401 };
  }
}
