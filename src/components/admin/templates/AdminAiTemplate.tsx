"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  syncAdminAccessSession,
} from "@/src/lib/appwrite/auth";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { AdminAiDashboard } from "../organisms/AdminAiDashboard";
import { AdminShell } from "./AdminShell";

type AccessStatus = "checking" | "allowed";

export function AdminAiTemplate() {
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
        router.replace(buildLoginHref("/admin/ia"));
        return;
      }

      const syncResult = await syncAdminAccessSession();
      if (!isActive) {
        return;
      }

      if (!syncResult.success) {
        router.replace(
          `${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin/ia")}`,
        );
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
        title="IA Analytics"
        subtitle="OpenAI · Appwrite · Presupuesto"
        userLabel={userLabel}
      >
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) px-8 py-7 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#a3e467] border-t-transparent" />
            <p className="text-sm text-(--color-muted)">
              Validando acceso al panel de IA...
            </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="IA Analytics"
      subtitle="OpenAI · Appwrite · Presupuesto"
      userLabel={userLabel}
    >
      <AdminAiDashboard />
    </AdminShell>
  );
}
