import { AppwriteException, Models, OAuthProvider } from "appwrite";
import { getAppwriteAccount } from "./client";

type LoginWithEmailResult =
  | { success: true }
  | { success: false; code: string; message: string };

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
        message: "Revisa los datos ingresados e intenta nuevamente.",
      };
    }

    return {
      code: error.type || "APPWRITE_ERROR",
      message: error.message || "No se pudo iniciar sesión.",
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNEXPECTED_ERROR",
      message: error.message || "No se pudo iniciar sesión.",
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "No se pudo iniciar sesión.",
  };
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

export async function logoutCurrentSession() {
  try {
    const account = getAppwriteAccount();
    await account.deleteSession("current");
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) {
      return;
    }

    throw error;
  }
}
