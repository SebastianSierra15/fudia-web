"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import { getCurrentUser, syncAdminAccessSession } from "@/src/lib/appwrite/auth";
import { AdminLogsDashboard } from "../organisms/AdminLogsDashboard";
import { AdminShell } from "./AdminShell";

type AccessStatus = "checking" | "allowed";

export function AdminLogsTemplate() {
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
        router.replace(buildLoginHref("/admin/logs"));
        return;
      }

      const syncResult = await syncAdminAccessSession();
      if (!isActive) {
        return;
      }

      if (!syncResult.success) {
        router.replace(
          `${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin/logs")}`,
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
      <main className="flex min-h-screen items-center justify-center bg-[#080f1f] px-6 text-white">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-[#22324d] bg-[#101a2d] px-8 py-7 text-center shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#a3e467] border-t-transparent" />
          <p className="text-sm text-[#9fb0c7]">
            Validando acceso al panel de logs...
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminShell
      title="Logs"
      subtitle="Appwrite · React Native · Tiempo real"
      userLabel={userLabel}
    >
      <AdminLogsDashboard />
    </AdminShell>
  );
}
