"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildLoginHref, buildCurrentPath } from "@/src/lib/auth/redirect";
import {
  getCurrentUser,
  syncAdminAccessSession,
} from "@/src/lib/appwrite/auth";
import { acceptAdminTeamInvitation } from "@/src/lib/appwrite/admin-team";
import { AdminShell } from "./AdminShell";

type Status = "loading" | "success" | "error";

export function AdminTeamInvitationTemplate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Validando invitación...");
  const [userLabel, setUserLabel] = useState("Administrador");

  const invitation = useMemo(
    () => ({
      teamId: searchParams.get("teamId") ?? "",
      membershipId: searchParams.get("membershipId") ?? "",
      userId: searchParams.get("userId") ?? "",
      secret: searchParams.get("secret") ?? "",
    }),
    [searchParams],
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      const user = await getCurrentUser();
      if (!active) return;
      if (!user) {
        router.replace(
          buildLoginHref(
            buildCurrentPath(
              "/admin/equipo/invitacion",
              searchParams.toString(),
            ),
          ),
        );
        return;
      }
      setUserLabel(user.name?.trim() || user.email?.trim() || "Administrador");

      if (user.$id !== invitation.userId) {
        setStatus("error");
        setMessage(
          "Esta invitación pertenece a otra cuenta. Inicia sesión con el correo que recibio la invitación.",
        );
        return;
      }

      const result = await acceptAdminTeamInvitation(invitation);
      if (!active) return;
      if (!result.success) {
        setStatus("error");
        setMessage(result.message);
        return;
      }
      await syncAdminAccessSession();
      setStatus("success");
      setMessage("Invitación aceptada. Ya puedes entrar al panel admin.");
      window.setTimeout(() => router.replace("/admin"), 1400);
    })();
    return () => {
      active = false;
    };
  }, [invitation, router, searchParams]);

  const Icon =
    status === "loading"
      ? LoaderCircle
      : status === "success"
        ? CheckCircle2
        : CircleAlert;

  return (
    <AdminShell
      title="Invitación"
      subtitle="Acceso al equipo administrativo"
      userLabel={userLabel}
    >
      <div className="flex min-h-[420px] items-center justify-center">
        <section className="w-full max-w-md rounded-lg border border-(--color-border) bg-(--color-surface) p-7 text-center">
          <Icon
            size={42}
            className={`mx-auto ${
              status === "loading"
                ? "animate-spin text-(--color-accent)"
                : status === "success"
                  ? "text-(--color-accent)"
                  : "text-red-300"
            }`}
          />
          <h2 className="mt-5 text-xl font-bold">Invitación al equipo</h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">
            {message}
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
