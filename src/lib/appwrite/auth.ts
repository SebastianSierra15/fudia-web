import { AppwriteException, Models, OAuthProvider } from "appwrite";
import { APPWRITE_ADMIN_TEAM_ID } from "@/src/lib/auth/admin";
import { getAppwriteAccount, getAppwriteTeams } from "./client";

type LoginWithEmailResult =
  | { success: true }
  | { success: false; code: string; message: string };

type AdminAccessSessionResult =
  | { success: true }
  | { success: false; code: "NO_SESSION" | "UNAUTHORIZED" | "REQUEST_ERROR" };

const GENERIC_LOGIN_ERROR_MESSAGE =
  "Ocurrio un error al iniciar sesión. Intenta mas tarde.";

function mapLoginError(error: unknown): { code: string; message: string } {
  if (error instanceof AppwriteException) {
    if (error.code === 401 || error.type === "user_invalid_credentials") {
      return {
        code: "INVALID_CREDENTIALS",
        message: "Correo o contraseña incorrectos.",
      };
    }

    if (error.code === 429) {
      return {
        code: "TOO_MANY_REQUESTS",
        message: "Demasiados intentos. Espera un momento e intenta de nuevo.",
      };
    }

    if (error.code === 400) {
      return {
        code: "BAD_REQUEST",
        message: GENERIC_LOGIN_ERROR_MESSAGE,
      };
    }

    return {
      code: error.type || "APPWRITE_ERROR",
      message: GENERIC_LOGIN_ERROR_MESSAGE,
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNEXPECTED_ERROR",
      message: GENERIC_LOGIN_ERROR_MESSAGE,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: GENERIC_LOGIN_ERROR_MESSAGE,
  };
}

export async function createCurrentSessionJwt() {
  try {
    const account = getAppwriteAccount();
    const jwt = await account.createJWT({ duration: 900 });
    return jwt.jwt;
  } catch {
    return null;
  }
}

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<LoginWithEmailResult> {
  try {
    const account = getAppwriteAccount();
    await account.createEmailPasswordSession({ email, password });

    return { success: true };
  } catch (error) {
    const mapped = mapLoginError(error);
    return {
      success: false,
      code: mapped.code,
      message: mapped.message,
    };
  }
}

export async function startGoogleOAuthLogin(nextPath: string) {
  const account = getAppwriteAccount();
  const origin = window.location.origin;
  const encodedNext = encodeURIComponent(nextPath);
  const successUrl = `${origin}/login/callback?next=${encodedNext}`;
  const failureUrl = `${origin}/login?toast=oauth_error&next=${encodedNext}`;

  await account.createOAuth2Session({
    provider: OAuthProvider.Google,
    success: successUrl,
    failure: failureUrl,
  });
}

export async function getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
  try {
    const account = getAppwriteAccount();
    return await account.get();
  } catch {
    return null;
  }
}

export async function isCurrentUserInTeam(teamId: string) {
  try {
    const teams = getAppwriteTeams();
    const teamList = await teams.list({ total: false });
    return teamList.teams.some((team) => team.$id === teamId);
  } catch {
    return false;
  }
}

export function isCurrentUserAdmin() {
  return isCurrentUserInTeam(APPWRITE_ADMIN_TEAM_ID);
}

export async function syncAdminAccessSession(): Promise<AdminAccessSessionResult> {
  const jwt = await createCurrentSessionJwt();
  if (!jwt) {
    return { success: false, code: "NO_SESSION" };
  }

  try {
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ jwt }),
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, code: "UNAUTHORIZED" };
    }

    return { success: false, code: "REQUEST_ERROR" };
  } catch {
    return { success: false, code: "REQUEST_ERROR" };
  }
}

export async function clearAdminAccessSession() {
  try {
    await fetch("/api/admin/session", {
      method: "DELETE",
      credentials: "same-origin",
    });
  } catch {
    return;
  }
}

export async function logoutCurrentSession() {
  let unexpectedError: unknown = null;

  try {
    const account = getAppwriteAccount();
    await account.deleteSession("current");
  } catch (error) {
    if (!(error instanceof AppwriteException && error.code === 401)) {
      unexpectedError = error;
    }
  }

  await clearAdminAccessSession();

  if (unexpectedError) {
    throw unexpectedError;
  }
}
