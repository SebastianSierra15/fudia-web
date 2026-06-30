"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  AdminTeamMember,
  AdminTeamResponse,
  AdminTeamRoleKey,
} from "@/src/lib/admin-team/types";
import {
  getAdminTeam,
  inviteAdminTeamMember,
} from "@/src/lib/appwrite/admin-team";
import { AdminConfirmModal } from "../molecules/AdminConfirmModal";
import { useAdminFeedback } from "../molecules/AdminFeedbackProvider";
import { useAdminHeaderActions } from "../templates/AdminShell";

type InvitationDraft = {
  email: string;
  role: AdminTeamRoleKey;
};

const roleColor: Record<AdminTeamRoleKey, string> = {
  super_admin: "bg-(--color-accent-soft) text-(--color-accent)",
  cofounder: "bg-blue-500/15 text-blue-300",
  cto: "bg-purple-500/20 text-purple-300",
  support: "bg-(--color-surface-2) text-(--color-muted)",
  admin: "bg-(--color-surface-2) text-(--color-muted)",
};

function TeamSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-lg border border-(--color-border) bg-(--color-surface)"
        />
      ))}
    </div>
  );
}

function MemberCard({ member }: { member: AdminTeamMember }) {
  return (
    <article className="flex min-h-40 animate-[admin-fade-in_0.28s_ease-out] flex-col items-center justify-center rounded-lg border border-(--color-border) bg-(--color-surface) p-6 text-center transition-transform duration-200 hover:-translate-y-0.5 hover:border-(--color-accent)/40">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
          member.isCurrentUser
            ? "bg-(--color-accent) text-(--color-accent-contrast)"
            : member.roleKey === "cto"
              ? "bg-purple-500/20 text-purple-300"
              : member.roleKey === "support"
                ? "bg-orange-500/15 text-orange-300"
                : "bg-blue-500/20 text-blue-300"
        }`}
      >
        {member.initials}
      </div>
      <h2 className="mt-3 max-w-full truncate text-sm font-bold">
        {member.name}
      </h2>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <span
          className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${roleColor[member.roleKey]}`}
        >
          {member.roleLabel}
        </span>
        {member.status === "pending" ? (
          <span className="rounded-full bg-amber-400/10 px-3 py-0.5 text-[11px] font-bold text-amber-300">
            Pendiente
          </span>
        ) : null}
      </div>
      <p className="mt-3 max-w-full truncate text-xs font-medium text-(--color-accent)">
        {member.email || "Email no disponible"}
      </p>
    </article>
  );
}

function InviteCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      title="Invitar miembro"
      onClick={onClick}
      className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-(--color-border) bg-(--color-surface)/60 p-6 text-center text-(--color-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
    >
      <Plus size={24} />
      <span className="mt-4 text-sm font-medium text-foreground">
        Invitar miembro
      </span>
      <span className="mt-1 text-xs">Anadir al equipo</span>
    </button>
  );
}

export function AdminTeamDashboard() {
  const [data, setData] = useState<AdminTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<InvitationDraft>({
    email: "",
    role: "support",
  });
  const { hideLoading, showLoading, showToast } = useAdminFeedback();

  const roles = useMemo(
    () =>
      data?.roles ?? [
        { key: "super_admin" as const, label: "Super Admin" },
        { key: "cofounder" as const, label: "Co-fundador" },
        { key: "cto" as const, label: "Co-fundador / CTO" },
        { key: "support" as const, label: "Soporte" },
      ],
    [data],
  );

  const loadTeam = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      const result = await getAdminTeam();
      if (result.success) {
        setData(result.data);
      } else {
        showToast(result.message, "error");
      }
      setLoading(false);
      setRefreshing(false);
    },
    [showToast],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTeam("initial"), 0);
    return () => window.clearTimeout(timeout);
  }, [loadTeam]);

  useEffect(() => {
    const openInvite = () => setInviteOpen(true);
    window.addEventListener("fudia-admin-open-team-invite", openInvite);
    return () =>
      window.removeEventListener("fudia-admin-open-team-invite", openInvite);
  }, []);

  const submitInvitation = async () => {
    setConfirmOpen(false);
    showLoading("Enviando invitacion...");
    const result = await inviteAdminTeamMember(draft.email, draft.role);
    hideLoading();
    if (!result.success) {
      showToast(result.message, "error");
      return;
    }
    showToast("Invitacion administrativa enviada.", "success");
    setInviteOpen(false);
    setDraft({ email: "", role: "support" });
    await loadTeam("refresh");
  };

  const headerActions = useMemo(
    () => (
      <button
        type="button"
        title="Actualizar equipo"
        onClick={() => void loadTeam("refresh")}
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm font-semibold text-(--color-muted) hover:text-foreground"
      >
        <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        <span className="hidden sm:inline">Actualizar</span>
      </button>
    ),
    [loadTeam, refreshing],
  );
  useAdminHeaderActions(headerActions);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <div className="rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold text-foreground">
                {data?.summary.total ?? 0}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                <Users size={16} />
              </span>
            </div>
            <p className="text-xs text-(--color-muted)">Miembros</p>
          </div>
          <div className="rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold text-(--color-accent)">
                {data?.summary.active ?? 0}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                <UserCheck size={16} />
              </span>
            </div>
            <p className="text-xs text-(--color-muted)">Activos</p>
          </div>
          <div className="rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-2xl font-bold text-amber-300">
                {data?.summary.pending ?? 0}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                <Clock size={16} />
              </span>
            </div>
            <p className="text-xs text-(--color-muted)">Pendientes</p>
          </div>
        </div>
      </div>

      {loading ? (
        <TeamSkeleton />
      ) : data && data.members.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.members.map((member) => (
            <MemberCard key={member.membershipId} member={member} />
          ))}
          <InviteCard onClick={() => setInviteOpen(true)} />
        </div>
      ) : (
        <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-8 text-center">
          <ShieldCheck className="mx-auto text-(--color-muted)" size={36} />
          <h2 className="mt-4 text-lg font-bold">Sin miembros visibles</h2>
          <p className="mt-2 text-sm text-(--color-muted)">
            No se encontraron administradores para mostrar.
          </p>
          <button
            type="button"
            title="Invitar miembro"
            onClick={() => setInviteOpen(true)}
            className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-(--color-accent) px-4 text-sm font-bold text-(--color-accent-contrast)"
          >
            <UserPlus size={16} />
            Invitar miembro
          </button>
        </div>
      )}

      {inviteOpen ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/65 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-invite-title"
            className="w-full max-w-lg rounded-lg border border-(--color-border) bg-(--color-surface) p-5 shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-accent-soft) text-(--color-accent)">
                <UserPlus size={20} />
              </span>
              <button
                type="button"
                title="Cerrar invitacion"
                onClick={() => setInviteOpen(false)}
                className="h-8 cursor-pointer rounded-lg px-3 text-sm text-(--color-muted) hover:bg-(--color-surface-2) hover:text-foreground"
              >
                Cerrar
              </button>
            </div>
            <h2 id="team-invite-title" className="mt-4 text-lg font-bold">
              Invitar miembro
            </h2>
            <p className="mt-1 text-sm text-(--color-muted)">
              El usuario recibira una invitacion y tendra acceso admin solo al
              aceptarla.
            </p>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Email
                <div className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3">
                  <Mail size={16} className="text-(--color-muted)" />
                  <input
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="correo@fudia.app"
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-(--color-muted-2)"
                  />
                </div>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Rol visual
                <select
                  value={draft.role}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      role: event.target.value as AdminTeamRoleKey,
                    }))
                  }
                  className="h-11 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm outline-none"
                >
                  {roles.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="h-10 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) text-sm font-semibold text-(--color-muted) hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="h-10 cursor-pointer rounded-lg bg-(--color-accent) text-sm font-bold text-(--color-accent-contrast) hover:bg-(--color-accent-strong)"
              >
                Enviar invitacion
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <AdminConfirmModal
        open={confirmOpen}
        title="Enviar invitacion admin"
        description="Al aceptar, esta persona podra entrar al panel administrativo de Fudia."
        confirmLabel="Enviar invitacion"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void submitInvitation()}
      />
    </div>
  );
}
