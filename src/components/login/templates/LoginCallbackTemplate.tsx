"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutCurrentSession } from "@/src/lib/appwrite/auth";
import { sanitizeNextPath } from "@/src/lib/auth/redirect";

type LoginCallbackTemplateProps = {
  initialNext?: string | null;
};

function buildLoginRedirect(nextPath: string, toastCode: string) {
  const params = new URLSearchParams();
  params.set("toast", toastCode);
  params.set("next", nextPath);
  return `/login?${params.toString()}`;
}

export function LoginCallbackTemplate({
  initialNext,
}: LoginCallbackTemplateProps) {
  const router = useRouter();
  const nextPath = useMemo(() => sanitizeNextPath(initialNext), [initialNext]);

  useEffect(() => {
    let isActive = true;

    const resolveLogin = async () => {
      try {
        const user = await getCurrentUser();

        if (!user) {
          if (isActive) {
            router.replace(buildLoginRedirect(nextPath, "oauth_error"));
          }
          return;
        }

        if (!user.emailVerification) {
          await logoutCurrentSession();
          if (isActive) {
            router.replace(buildLoginRedirect(nextPath, "email_not_verified"));
          }
          return;
        }

        if (isActive) {
          router.replace(nextPath);
        }
      } catch {
        if (isActive) {
          router.replace(buildLoginRedirect(nextPath, "oauth_error"));
        }
      }
    };

    void resolveLogin();

    return () => {
      isActive = false;
    };
  }, [nextPath, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) px-8 py-7 text-center shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-accent) border-t-transparent" />
        <p className="text-sm text-(--color-muted)">
          Validando inicio de sesión...
        </p>
      </div>
    </main>
  );
}
