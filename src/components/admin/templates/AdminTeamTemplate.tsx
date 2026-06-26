"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";
import {
  getCurrentUser,
  syncAdminAccessSession,
} from "@/src/lib/appwrite/auth";
import { AdminTeamDashboard } from "../organisms/AdminTeamDashboard";
import { AdminShell } from "./AdminShell";

export function AdminTeamTemplate() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [userLabel, setUserLabel] = useState("Administrador");

  useEffect(() => {
    let active = true;
    void (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace(buildLoginHref("/admin/equipo"));
        return;
      }
      const result = await syncAdminAccessSession();
      if (!active) return;
      if (!result.success) {
        router.replace(
          `${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin/equipo")}`,
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

  const actions = allowed ? (
    <button
      type="button"
      title="Invitar miembro"
      onClick={() =>
        window.dispatchEvent(new CustomEvent("fudia-admin-open-team-invite"))
      }
      className="hidden h-10 cursor-pointer items-center gap-2 rounded-lg bg-(--color-accent) px-4 text-sm font-bold text-(--color-accent-contrast) hover:bg-(--color-accent-strong) sm:inline-flex"
    >
      <UserPlus size={16} /> Invitar miembro
    </button>
  ) : null;

  return (
    <AdminShell
      title="Equipo"
      subtitle="Administradores del portal"
      userLabel={userLabel}
      actions={actions}
    >
      {!allowed ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) px-8 py-7 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#a3e467] border-t-transparent" />
            <p className="text-sm text-(--color-muted)">
              Validando acceso al equipo administrativo...
            </p>
          </div>
        </div>
      ) : (
        <AdminTeamDashboard />
      )}
    </AdminShell>
  );
}
