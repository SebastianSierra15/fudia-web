"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/src/components/shared/atoms/Container";
import { NavBar } from "@/src/components/shared/organisms/NavBar";
import { ADMIN_AUTHORIZE_PATH, ADMIN_HOME_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { getCurrentUser, syncAdminAccessSession } from "@/src/lib/appwrite/auth";
import { AdminFinanceSection } from "../organisms/AdminFinanceSection";

type AccessStatus = "checking" | "allowed";

export function AdminTemplate() {
  const router = useRouter();
  const [status, setStatus] = useState<AccessStatus>("checking");
  const [userLabel, setUserLabel] = useState("Administrador");

  useEffect(() => {
    let isActive = true;

    const resolveAccess = async () => {
      const user = await getCurrentUser();

      if (!isActive) {
        return;
      }

      if (!user) {
        router.replace(buildLoginHref(ADMIN_HOME_PATH));
        return;
      }

      const syncResult = await syncAdminAccessSession();

      if (!isActive) {
        return;
      }

      if (!syncResult.success) {
        router.replace(`${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent(ADMIN_HOME_PATH)}`);
        return;
      }

      const name = user.name?.trim();
      const email = user.email?.trim();
      setUserLabel(name || email || "Administrador");
      setStatus("allowed");
    };

    void resolveAccess();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) px-8 py-7 text-center shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-(--color-accent) border-t-transparent" />
          <p className="text-sm text-(--color-muted)">
            Cargando panel administrativo...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,var(--color-bg)_0%,var(--color-gradient)_100%)] text-foreground">
      <NavBar />
      <main className="flex-1 py-10 md:py-14">
        <Container>
          <section className="rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-[0_20px_48px_rgba(0,0,0,0.15)] md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
              Panel admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Bienvenido, {userLabel}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-(--color-muted) md:text-base">
              El acceso esta protegido por autenticacion y validacion del team
              Admin de Appwrite. En el siguiente paso conectaremos las metricas
              de negocio para costos, ingresos y margen por usuario.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                  Estado
                </p>
                <p className="mt-2 text-xl font-semibold">Acceso habilitado</p>
              </div>
              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                  Fuente de permisos
                </p>
                <p className="mt-2 text-xl font-semibold">Appwrite Teams</p>
              </div>
              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                  Proxima iteracion
                </p>
                <p className="mt-2 text-xl font-semibold">Dashboard de negocio</p>
              </div>
            </div>
          </section>

          <AdminFinanceSection />
        </Container>
      </main>
    </div>
  );
}
