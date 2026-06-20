"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_AUTHORIZE_PATH, ADMIN_HOME_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { getCurrentUser, syncAdminAccessSession } from "@/src/lib/appwrite/auth";
import { AdminFinanceSection } from "../organisms/AdminFinanceSection";
import { AdminShell } from "./AdminShell";

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
      <main className="flex min-h-screen items-center justify-center bg-[#080f1f] px-6 text-white">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-[#22324d] bg-[#101a2d] px-8 py-7 text-center shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#a3e467] border-t-transparent" />
          <p className="text-sm text-[#9fb0c7]">
            Cargando panel administrativo...
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Resumen · Finanzas · Administracion"
      userLabel={userLabel}
    >
      <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5 shadow-[0_20px_48px_rgba(0,0,0,0.15)] md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
          Panel admin
        </p>
        <h2 className="mt-2 text-2xl font-bold md:text-3xl">
          Bienvenido, {userLabel}
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-(--color-muted) md:text-base">
          El acceso esta protegido por autenticacion y validacion del team Admin
          de Appwrite. Este panel consolida finanzas, IA y observabilidad.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Estado", "Acceso habilitado"],
            ["Fuente de permisos", "Appwrite Teams"],
            ["Proxima iteracion", "Dashboard de negocio"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-(--color-border) bg-(--color-surface-2) p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <AdminFinanceSection />
    </AdminShell>
  );
}
