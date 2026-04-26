import { sanitizeNextPath } from "./redirect";

export const APPWRITE_ADMIN_TEAM_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TEAM_ADMIN_ID ??
  "69ed68fd001dcdbeaee6";

export const APPWRITE_PREMIUM_TEAM_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TEAM_PREMIUM_ID ??
  "69d0674b0024ad1068c4";

export const ADMIN_ACCESS_COOKIE_NAME = "fudia_admin_access";
export const ADMIN_ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 15;

export const ADMIN_HOME_PATH = "/admin";
export const ADMIN_AUTHORIZE_PATH = "/admin/authorize";

export function sanitizeAdminNextPath(rawNextPath?: string | null) {
  const safePath = sanitizeNextPath(rawNextPath);

  if (!safePath.startsWith("/admin")) {
    return ADMIN_HOME_PATH;
  }

  if (safePath.startsWith(ADMIN_AUTHORIZE_PATH)) {
    return ADMIN_HOME_PATH;
  }

  return safePath;
}
