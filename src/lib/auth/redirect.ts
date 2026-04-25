const DEFAULT_AFTER_LOGIN_PATH = "/";

export function sanitizeNextPath(rawNextPath?: string | null): string {
  if (!rawNextPath) {
    return DEFAULT_AFTER_LOGIN_PATH;
  }

  if (!rawNextPath.startsWith("/")) {
    return DEFAULT_AFTER_LOGIN_PATH;
  }

  if (rawNextPath.startsWith("//")) {
    return DEFAULT_AFTER_LOGIN_PATH;
  }

  if (rawNextPath.startsWith("/login")) {
    return DEFAULT_AFTER_LOGIN_PATH;
  }

  return rawNextPath;
}

export function buildCurrentPath(pathname: string, queryString: string) {
  if (!queryString) {
    return pathname;
  }

  return `${pathname}?${queryString}`;
}

export function buildLoginHref(nextPath: string) {
  const safeNext = sanitizeNextPath(nextPath);
  return `/login?next=${encodeURIComponent(safeNext)}`;
}

