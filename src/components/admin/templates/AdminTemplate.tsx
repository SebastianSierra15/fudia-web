"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_AUTHORIZE_PATH, ADMIN_HOME_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { getCurrentUser, syncAdminAccessSession } from "@/src/lib/appwrite/auth";
import { AdminDashboard } from "../organisms/AdminDashboard";
import { AdminShell } from "./AdminShell";

type AccessStatus = "checking" | "allowed";

function getCurrentMonthLabel() {
  const now = new Date();
  const label = new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(now);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function AdminTemplate() {
  const router = useRouter();
  const [status, setStatus] = useState<AccessStatus>("checking");
  const [userLabel, setUserLabel] = useState("Administrador");
  const [monthLabel] = useState(getCurrentMonthLabel);
  const subtitle = `Resumen de actividad y decisiones · ${monthLabel}`;

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
      <AdminShell
        title="Panel de Administracion"
        subtitle={subtitle}
        userLabel={userLabel}
      >
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) px-8 py-7 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#a3e467] border-t-transparent" />
          <p className="text-sm text-(--color-muted)">
            Cargando panel administrativo...
          </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Panel de Administracion"
      subtitle={subtitle}
      userLabel={userLabel}
    >
      <AdminDashboard />
    </AdminShell>
  );
}
