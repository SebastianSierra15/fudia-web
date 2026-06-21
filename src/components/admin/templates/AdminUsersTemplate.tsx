"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import {
  getCurrentUser,
  syncAdminAccessSession,
} from "@/src/lib/appwrite/auth";
import { AdminUsersDashboard } from "../organisms/AdminUsersDashboard";
import { AdminShell } from "./AdminShell";

export function AdminUsersTemplate() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [userLabel, setUserLabel] = useState("Administrador");
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace(buildLoginHref("/admin/users"));
        return;
      }
      const result = await syncAdminAccessSession();
      if (!active) return;
      if (!result.success) {
        router.replace(
          `${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin/users")}`,
        );
        return;
      }
      setUserLabel(user.name?.trim() || user.email?.trim() || "Administrador");
      setAllowed(true);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (!allowed)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080f1f] px-6 text-white">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#a3e467] border-t-transparent" />
      </main>
    );
  return (
    <AdminShell
      title="Usuarios"
      subtitle="Gestion, acceso y metricas de consumo"
      userLabel={userLabel}
      isRightPanelOpen={isDetailOpen}
    >
      <AdminUsersDashboard onDetailOpenChange={setIsDetailOpen} />
    </AdminShell>
  );
}
