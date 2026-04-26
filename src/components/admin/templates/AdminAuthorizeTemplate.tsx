"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/shared/atoms/Button";
import {
  ADMIN_HOME_PATH,
  sanitizeAdminNextPath,
} from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import {
  getCurrentUser,
  logoutCurrentSession,
  syncAdminAccessSession,
} from "@/src/lib/appwrite/auth";

type AdminAuthorizeTemplateProps = {
  initialNext?: string | null;
};

type AuthorizationStatus = "checking" | "forbidden" | "error";

function buildNotVerifiedRedirect(nextPath: string) {
  const params = new URLSearchParams();
  params.set("toast", "email_not_verified");
  params.set("next", nextPath);
  return `/login?${params.toString()}`;
}

export function AdminAuthorizeTemplate({
  initialNext,
}: AdminAuthorizeTemplateProps) {
  const router = useRouter();
  const targetPath = useMemo(
    () => sanitizeAdminNextPath(initialNext),
    [initialNext],
  );
  const [status, setStatus] = useState<AuthorizationStatus>("checking");

  useEffect(() => {
    let isActive = true;

    const resolveAuthorization = async () => {
      const user = await getCurrentUser();

      if (!isActive) {
        return;
      }

      if (!user) {
        router.replace(buildLoginHref(targetPath));
        return;
      }

      if (!user.emailVerification) {
        await logoutCurrentSession();
        if (isActive) {
          router.replace(buildNotVerifiedRedirect(targetPath));
        }
        return;
      }

      const syncResult = await syncAdminAccessSession();

      if (!isActive) {
        return;
      }

      if (syncResult.success) {
        router.replace(targetPath);
        return;
      }

      if (syncResult.code === "NO_SESSION") {
        router.replace(buildLoginHref(targetPath));
        return;
      }

      if (syncResult.code === "UNAUTHORIZED") {
        setStatus("forbidden");
        return;
      }

      setStatus("error");
    };

    void resolveAuthorization();

    return () => {
      isActive = false;
    };
  }, [router, targetPath]);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) px-8 py-7 text-center shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-accent) border-t-transparent" />
          <p className="text-sm text-(--color-muted)">
            Validando permisos de administrador...
          </p>
        </div>
      </main>
    );
  }

  if (status === "forbidden") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="w-full max-w-lg rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
            Acceso denegado
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            No tienes permisos para entrar al panel admin.
          </h1>
          <p className="mt-3 text-sm text-(--color-muted)">
            Tu cuenta no pertenece al team de administradores en Appwrite.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button label="Ir al inicio" href="/" className="sm:flex-1" />
            <Button
              label="Reintentar"
              href={ADMIN_HOME_PATH}
              variant="secondary"
              className="sm:flex-1"
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
          Error temporal
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          No pudimos validar tu acceso en este momento.
        </h1>
        <p className="mt-3 text-sm text-(--color-muted)">
          Intenta nuevamente en unos segundos.
        </p>
        <div className="mt-6">
          <Button label="Intentar de nuevo" href={ADMIN_HOME_PATH} className="w-full" />
        </div>
      </div>
    </main>
  );
}
