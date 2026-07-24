"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Crown,
  ListChecks,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import type {
  AdminUserAction,
  AdminUser,
  AdminUserAccountStatus,
  AdminUserPlan,
  AdminUsersQuery,
  AdminUsersResponse,
} from "@/src/lib/admin-users/types";
import {
  getAdminUsers,
  getAdminUsersCsv,
  updateAdminUserPlan,
  updateAdminUserStatus,
  runAdminUserAction,
} from "@/src/lib/appwrite/admin-users";
import { AdminConfirmModal } from "../molecules/AdminConfirmModal";
import { useAdminFeedback } from "../molecules/AdminFeedbackProvider";
import { useAdminHeaderActions } from "../templates/AdminShell";
import { ADMIN_AUTHORIZE_PATH } from "@/src/lib/auth/admin";
import { buildLoginHref } from "@/src/lib/auth/redirect";

const initialQuery: AdminUsersQuery = {
  search: "",
  plan: "all",
  status: "all",
  onboarding: "all",
  sort: "created_desc",
  page: 1,
  pageSize: 20,
};
const integerFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatTotalUsersTrend(
  comparison: AdminUsersResponse["comparison"]["totalUsers"] | null,
) {
  if (!comparison) {
    return null;
  }

  if (comparison.percent === null) {
    const delta = comparison.current - comparison.previous;
    const sign = delta > 0 ? "+" : "";
    return {
      text: `${sign}${integerFormatter.format(delta)} este mes`,
      className:
        delta > 0
          ? "text-(--color-accent)"
          : delta < 0
            ? "text-red-300"
            : "text-(--color-muted)",
    };
  }

  const sign = comparison.percent > 0 ? "+" : "";
  return {
    text: `${sign}${comparison.percent.toFixed(1)}% este mes`,
    className:
      comparison.percent >= 0 ? "text-(--color-accent)" : "text-red-300",
  };
}

type ConfirmationAction =
  | { kind: "status"; value: AdminUserAccountStatus }
  | { kind: "plan"; value: AdminUserPlan }
  | { kind: "user"; value: AdminUserAction };

function classForPlan(plan: AdminUserPlan) {
  return plan === "premium"
    ? "bg-(--color-accent-soft) text-(--color-accent)"
    : "bg-(--color-surface-2) text-(--color-muted)";
}
function classForStatus(status: AdminUserAccountStatus) {
  return status === "active" ? "text-(--color-accent)" : "text-red-300";
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
function formatDate(value: string | null) {
  if (!value) return "Sin actividad";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function initials(user: AdminUser) {
  return (user.name || user.email || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function ChecklistItem({
  complete,
  label,
}: {
  complete: boolean;
  label: string;
}) {
  const Icon = complete ? CheckCircle2 : CircleAlert;
  return (
    <li className="flex items-center gap-2">
      <Icon
        size={15}
        className={complete ? "text-(--color-accent)" : "text-orange-300"}
      />
      <span>{label}</span>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg border border-(--color-border) bg-(--color-surface)"
          />
        ))}
      </div>
      <div className="h-[520px] animate-pulse rounded-lg border border-(--color-border) bg-(--color-surface)" />
    </div>
  );
}

function UserDetail({
  user,
  onClose,
  onChange,
  onAction,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onChange: (
    field: "plan" | "status",
    value: AdminUserPlan | AdminUserAccountStatus,
  ) => void;
  onAction: (action: AdminUserAction) => void;
}) {
  if (!user) return null;
  const nextStatus = user.accountStatus === "active" ? "suspended" : "active";
  const nextPlan = user.plan === "premium" ? "free" : "premium";
  const requestChange = (
    event: MouseEvent<HTMLButtonElement>,
    field: "plan" | "status",
    value: AdminUserPlan | AdminUserAccountStatus,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onChange(field, value);
  };
  const requestAction = (
    event: MouseEvent<HTMLButtonElement>,
    action: AdminUserAction,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    onAction(action);
  };
  return (
    <aside className="flex h-full min-h-0 flex-col bg-(--color-bg)">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
            {initials(user)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{user.name}</h2>
            <p className="truncate text-sm text-(--color-muted)">
              {user.email || "Correo no disponible"}
            </p>
          </div>
        </div>
        <button
          type="button"
          title="Cerrar detalle"
          onClick={onClose}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-(--color-muted) hover:bg-(--color-surface-2) hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 px-5">
        <div className="rounded-lg bg-(--color-surface-2) p-3 text-center">
          <p className="text-sm font-bold text-(--color-accent)">
            {moneyFormatter.format(user.aiCostUsd)}
          </p>
          <p className="mt-1 text-[10px] text-(--color-muted)">Costo IA mes</p>
        </div>
        <div className="rounded-lg bg-(--color-surface-2) p-3 text-center">
          <p className="text-sm font-bold">
            {integerFormatter.format(user.recordsCount)}
          </p>
          <p className="mt-1 text-[10px] text-(--color-muted)">Registros/mes</p>
        </div>
        <div className="rounded-lg bg-(--color-surface-2) p-3 text-center">
          <p className="text-sm font-bold">
            {user.onboardingStatus === "complete" ? "Listo" : "Pendiente"}
          </p>
          <p className="mt-1 text-[10px] text-(--color-muted)">Onboarding</p>
        </div>
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-3 border-t border-(--color-border) p-5">
        <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Crear / regenerar credenciales
          </p>
          <p className="mt-2 text-xs text-(--color-muted)">
            Genera una contraseña temporal y la envía al usuario.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(event) => requestAction(event, "credentials_email")}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-2 text-xs font-semibold text-(--color-muted) hover:text-foreground"
            >
              <Mail size={14} />
              Enviar por email
            </button>
            <button
              type="button"
              onClick={(event) => requestAction(event, "credentials_whatsapp")}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/15"
            >
              <MessageCircle size={14} />
              Enviar por WhatsApp
            </button>
          </div>
        </section>
        <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Control de acceso
          </p>
          <p className="mt-3 text-sm font-semibold">
            Estado:{" "}
            <span className={classForStatus(user.accountStatus)}>
              {user.accountStatus === "active" ? "Activo" : "Suspendido"}
            </span>
          </p>
          <p className="mt-1 text-xs text-(--color-muted)">
            {user.accountStatus === "active"
              ? "Suspender revocará las sesiones activas."
              : "Activar permite iniciar una nueva sesión."}
          </p>
          <button
            type="button"
            onClick={(event) => requestChange(event, "status", nextStatus)}
            className={`mt-4 h-9 w-full cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors ${
              nextStatus === "active"
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                : "border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20"
            }`}
          >
            {nextStatus === "suspended" ? "Suspender cuenta" : "Activar cuenta"}
          </button>
        </section>
        <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Plan de suscripción
          </p>
          <p className="mt-3 text-sm font-semibold">
            Plan actual:{" "}
            <span
              className={
                user.plan === "premium"
                  ? "text-(--color-accent)"
                  : "text-(--color-muted)"
              }
            >
              {user.plan === "premium" ? "Premium" : "Free"}
            </span>
          </p>
          <p className="mt-1 text-xs text-(--color-muted)">
            Ajuste manual: no modifica Stripe ni cobros.
          </p>
          <button
            type="button"
            onClick={(event) => requestChange(event, "plan", nextPlan)}
            className="mt-4 h-9 w-full cursor-pointer rounded-lg bg-(--color-accent) px-3 text-sm font-bold text-(--color-accent-contrast) transition-colors hover:bg-(--color-accent-strong)"
          >
            Asignar {nextPlan === "premium" ? "Premium" : "Free"}
          </button>
        </section>
        <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-(--color-muted-2)">
            Onboarding
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <ChecklistItem complete label="Cuenta creada" />
            <ChecklistItem
              complete={user.emailVerified}
              label="Email verificado"
            />
            <ChecklistItem
              complete={user.onboardingStatus === "complete"}
              label="Perfil nutricional completado"
            />
            <ChecklistItem
              complete={user.firstMealLogged}
              label="Primer registro de comida"
            />
            <ChecklistItem
              complete={user.notificationsEnabled}
              label="Notificaciones habilitadas"
            />
            <li className="text-xs text-(--color-muted)">
              Último acceso: {formatDate(user.lastAccessAt)}
            </li>
          </ul>
        </section>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            title="Reenviar email de bienvenida"
            onClick={(event) => requestAction(event, "welcome_email")}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-left text-xs font-semibold text-(--color-muted) hover:text-foreground"
          >
            <Mail size={14} />
            Reenviar email de bienvenida
          </button>
          <button
            type="button"
            title="Enviar bienvenida por WhatsApp"
            onClick={(event) => requestAction(event, "welcome_whatsapp")}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/15"
          >
            <MessageCircle size={14} />
            WA de bienvenida
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminUsersDashboard({
  onDetailOpenChange,
}: {
  onDetailOpenChange: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationAction | null>(
    null,
  );
  const lastWarning = useRef("");
  const { hideLoading, showLoading, showToast } = useAdminFeedback();
  const selectUser = useCallback(
    (user: AdminUser) => {
      setSelected(user);
      onDetailOpenChange(true);
    },
    [onDetailOpenChange],
  );
  const closeDetail = useCallback(() => {
    setSelected(null);
    onDetailOpenChange(false);
  }, [onDetailOpenChange]);

  const handleError = useCallback(
    (result: {
      code: "NO_SESSION" | "FORBIDDEN" | "REQUEST_ERROR";
      message: string;
    }) => {
      if (result.code === "NO_SESSION") {
        router.replace(buildLoginHref("/admin/users"));
        return;
      }
      if (result.code === "FORBIDDEN") {
        router.replace(
          `${ADMIN_AUTHORIZE_PATH}?next=${encodeURIComponent("/admin/users")}`,
        );
        return;
      }
      showToast(result.message, "error");
    },
    [router, showToast],
  );
  const load = useCallback(
    async (
      nextQuery: AdminUsersQuery,
      refresh = false,
      loadingMessage?: string,
    ) => {
      if (!refresh) setLoading(true);
      if (loadingMessage) showLoading(loadingMessage);
      const result = await getAdminUsers(nextQuery);
      if (!result.success) handleError(result);
      else {
        setData(result.data);
        setSelected(
          (current) =>
            result.data.users.find((user) => user.userId === current?.userId) ??
            current,
        );
      }
      setLoading(false);
      if (loadingMessage) hideLoading();
    },
    [handleError, hideLoading, showLoading],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => void load(query), 0);
    return () => window.clearTimeout(timer);
  }, [load, query]);
  useEffect(() => {
    if (!data?.warning || data.warning === lastWarning.current) return;
    lastWarning.current = data.warning;
    showToast(data.warning, "warning");
  }, [data?.warning, showToast]);
  const updateQuery = <K extends keyof AdminUsersQuery>(
    key: K,
    value: AdminUsersQuery[K],
  ) =>
    setQuery((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  const handleExport = useCallback(async () => {
    showLoading("Generando archivo CSV...");
    try {
      const result = await getAdminUsersCsv(query);
      if (!result.success) handleError(result);
      else {
        download(result.blob, result.filename);
        showToast("El archivo CSV fue descargado.", "success");
      }
    } finally {
      hideLoading();
    }
  }, [handleError, hideLoading, query, showLoading, showToast]);
  const handleChange = async (
    field: "plan" | "status",
    value: AdminUserPlan | AdminUserAccountStatus,
  ) => {
    if (!selected || pending) return;
    setConfirmation(
      field === "plan"
        ? { kind: "plan", value: value as AdminUserPlan }
        : { kind: "status", value: value as AdminUserAccountStatus },
    );
  };
  const handleUserAction = (action: AdminUserAction) => {
    if (!selected || pending) return;
    setConfirmation({ kind: "user", value: action });
  };
  const confirmAction = async () => {
    if (!selected || !confirmation) return;
    setPending(true);
    const actionToRun = confirmation;
    setConfirmation(null);
    showLoading(
      actionToRun.kind === "status"
        ? "Actualizando estado de la cuenta..."
        : actionToRun.kind === "plan"
          ? "Actualizando plan del usuario..."
          : "Ejecutando acción administrativa...",
    );
    try {
      const result =
        actionToRun.kind === "plan"
          ? await updateAdminUserPlan(selected.userId, actionToRun.value)
          : actionToRun.kind === "status"
            ? await updateAdminUserStatus(selected.userId, actionToRun.value)
            : await runAdminUserAction(selected.userId, actionToRun.value);
      if (!result.success) {
        handleError(result);
      } else if (actionToRun.kind === "user") {
        showToast(
          actionToRun.value === "credentials_email"
            ? "Las credenciales temporales fueron enviadas por correo."
            : "La acción fue completada correctamente.",
          "success",
        );
      } else if (actionToRun.kind === "status") {
        showToast(
          actionToRun.value === "active"
            ? "La cuenta fue activada correctamente."
            : "La cuenta fue suspendida correctamente.",
          "success",
        );
        await load(query, true);
      } else if (actionToRun.kind === "plan") {
        showToast(
          actionToRun.value === "premium"
            ? "El usuario fue asignado a Premium."
            : "El usuario fue asignado a Free.",
          "success",
        );
        await load(query, true);
      } else {
        await load(query, true);
      }
    } finally {
      setPending(false);
      hideLoading();
    }
  };
  const confirmationCopy = useMemo(() => {
    if (!confirmation) return null;
    if (confirmation.kind === "plan") {
      const label = confirmation.value === "premium" ? "Premium" : "Free";
      return {
        title: `Asignar plan ${label}`,
        description:
          "El ajuste cambia únicamente las membresías de Appwrite y no modifica Stripe ni cobros.",
        confirmLabel: `Asignar ${label}`,
        tone: "primary" as const,
      };
    }
    if (confirmation.kind === "status") {
      const suspend = confirmation.value === "suspended";
      return {
        title: suspend ? "Suspender cuenta" : "Activar cuenta",
        description: suspend
          ? "La cuenta dejará de acceder y se revocarán sus sesiones actuales."
          : "La cuenta podrá iniciar una nueva sesión.",
        confirmLabel: suspend ? "Suspender" : "Activar",
        tone: suspend ? ("danger" as const) : ("primary" as const),
      };
    }
    const descriptions: Record<
      AdminUserAction,
      { title: string; description: string; confirmLabel: string }
    > = {
      credentials_email: {
        title: "Regenerar credenciales",
        description:
          "Se generará una contraseña temporal y se enviará por correo al usuario.",
        confirmLabel: "Enviar por email",
      },
      credentials_whatsapp: {
        title: "Regenerar credenciales",
        description:
          "Se intentará enviar una contraseña temporal por WhatsApp al usuario.",
        confirmLabel: "Enviar por WhatsApp",
      },
      welcome_email: {
        title: "Reenviar bienvenida",
        description:
          "Se enviará nuevamente el correo de bienvenida al usuario.",
        confirmLabel: "Reenviar email",
      },
      welcome_whatsapp: {
        title: "Enviar bienvenida",
        description:
          "Se intentará enviar el mensaje de bienvenida por WhatsApp al usuario.",
        confirmLabel: "Enviar por WhatsApp",
      },
    };
    return { ...descriptions[confirmation.value], tone: "primary" as const };
  }, [confirmation]);
  const pagination = useMemo(
    () =>
      data?.pagination ?? {
        page: 1,
        totalPages: 1,
        total: 0,
        pageSize: query.pageSize,
      },
    [data?.pagination, query.pageSize],
  );

  const headerActions = useMemo(
    () => (
      <>
        <button
          type="button"
          title="Actualizar usuarios"
          onClick={() => void load(query, true, "Actualizando usuarios...")}
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm font-semibold text-(--color-muted) hover:text-foreground"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
        <button
          type="button"
          title="Exportar usuarios CSV"
          onClick={() => void handleExport()}
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface-2) px-4 text-sm font-semibold text-(--color-muted) hover:text-foreground"
        >
          <Download size={14} />
          CSV
        </button>
      </>
    ),
    [handleExport, load, query],
  );
  useAdminHeaderActions(headerActions);

  if (loading && !data) return <DashboardSkeleton />;
  return (
    <div className="space-y-5">
      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total usuarios",
                value: integerFormatter.format(data.summary.totalUsers),
                hint: "este mes",
                comparison: data.comparison.totalUsers,
                icon: Users,
                iconClassName: "bg-blue-500/15 text-blue-300",
              },
              {
                label: "Premium",
                value: integerFormatter.format(data.summary.premiumUsers),
                hint: `${(
                  (data.summary.premiumUsers /
                    Math.max(1, data.summary.totalUsers)) *
                  100
                ).toFixed(1)}% del total`,
                comparison: null,
                icon: Crown,
                iconClassName: "bg-emerald-500/15 text-emerald-300",
              },
              {
                label: "Costo IA / usuario",
                value: moneyFormatter.format(data.summary.averageAiCostUsd),
                hint: "promedio mensual estimado",
                comparison: null,
                icon: WalletCards,
                iconClassName: "bg-amber-500/15 text-amber-300",
              },
              {
                label: "Sin onboarding",
                value: integerFormatter.format(
                  data.summary.incompleteOnboardingUsers,
                ),
                hint: "pendientes de completar",
                comparison: null,
                tone: "text-orange-300",
                icon: ListChecks,
                iconClassName: "bg-orange-500/15 text-orange-300",
              },
            ].map((metric) => {
              const Icon = metric.icon;
              const comparison = metric.comparison
                ? formatTotalUsersTrend(metric.comparison)
                : null;
              return (
                <article
                  key={metric.label}
                  className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-(--color-muted)">
                      {metric.label}
                    </p>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${metric.iconClassName}`}
                    >
                      <Icon size={17} />
                    </span>
                  </div>
                  <p className={`mt-2 text-2xl font-bold ${metric.tone ?? ""}`}>
                    {metric.value}
                  </p>
                  {comparison ? (
                    <p className="mt-1 truncate text-xs text-(--color-muted)">
                      <span className={`font-semibold ${comparison.className}`}>
                        {comparison.text}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 truncate text-xs text-(--color-muted)">
                      {metric.hint}
                    </p>
                  )}
                </article>
              );
            })}
          </section>
          <section className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
            <div className="grid gap-3 border-b border-(--color-border) p-4 md:grid-cols-2 xl:grid-cols-[1.45fr_0.7fr_0.75fr_0.8fr_0.9fr]">
              <label className="relative">
                <span className="sr-only">Buscar usuario</span>
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted)"
                />
                <input
                  value={query.search}
                  onChange={(event) =>
                    updateQuery("search", event.target.value)
                  }
                  placeholder="Buscar nombre, email, teléfono..."
                  className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-surface-2) pl-10 pr-3 text-sm outline-none focus:border-(--color-accent-strong)"
                />
              </label>
              <select
                value={query.plan}
                onChange={(event) =>
                  updateQuery(
                    "plan",
                    event.target.value as AdminUsersQuery["plan"],
                  )
                }
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm"
              >
                <option value="all">Todos los planes</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
              <select
                value={query.status}
                onChange={(event) =>
                  updateQuery(
                    "status",
                    event.target.value as AdminUsersQuery["status"],
                  )
                }
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
              </select>
              <select
                value={query.onboarding}
                onChange={(event) =>
                  updateQuery(
                    "onboarding",
                    event.target.value as AdminUsersQuery["onboarding"],
                  )
                }
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm"
              >
                <option value="all">Todo onboarding</option>
                <option value="complete">Completo</option>
                <option value="incomplete">Incompleto</option>
              </select>
              <select
                value={query.sort}
                onChange={(event) =>
                  updateQuery(
                    "sort",
                    event.target.value as AdminUsersQuery["sort"],
                  )
                }
                className="h-9 cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface-2) px-3 text-sm"
              >
                <option value="created_desc">Ordenar: Registro</option>
                <option value="last_access_desc">Ultimo acceso</option>
                <option value="records_desc">Registros/mes</option>
                <option value="cost_desc">Costo IA</option>
              </select>
            </div>
            <div>
              <div className="min-w-0 flex-1 overflow-x-auto">
                <table className="hidden w-full min-w-[920px] text-left text-sm md:table">
                  <thead className="bg-[#17233a]">
                    <tr>
                      {[
                        "Usuario",
                        "Plan",
                        "Estado",
                        "Registros/mes",
                        "Costo IA",
                        "Onboarding",
                        "Ultimo acceso",
                      ].map((label) => (
                        <th
                          key={label}
                          className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-(--color-muted-2)"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr
                        key={user.userId}
                        onClick={() => selectUser(user)}
                        className={`cursor-pointer border-t border-(--color-border) transition-colors hover:bg-(--color-surface-2) ${selected?.userId === user.userId ? "bg-(--color-surface-2)" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">
                              {initials(user)}
                            </span>
                            <div>
                              <p className="font-semibold">{user.name}</p>
                              <p className="max-w-48 truncate text-xs text-(--color-muted)">
                                {user.email || "Correo no disponible"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${classForPlan(user.plan)}`}
                          >
                            {user.plan === "premium" ? "Premium" : "Free"}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3 font-semibold ${classForStatus(user.accountStatus)}`}
                        >
                          {user.accountStatus === "active"
                            ? "Activo"
                            : "Suspendido"}
                        </td>
                        <td className="px-5 py-3 font-mono">
                          {integerFormatter.format(user.recordsCount)}
                        </td>
                        <td className="px-5 py-3 font-mono text-(--color-accent)">
                          {moneyFormatter.format(user.aiCostUsd)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              user.onboardingStatus === "complete"
                                ? "text-(--color-accent)"
                                : "text-orange-300"
                            }
                          >
                            {user.onboardingStatus === "complete"
                              ? "Completo"
                              : "Incompleto"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-(--color-muted)">
                          {formatDate(user.lastAccessAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid gap-2 p-3 md:hidden">
                  {data.users.map((user) => (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="cursor-pointer rounded-lg border border-(--color-border) bg-(--color-bg) p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">
                          {initials(user)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{user.name}</p>
                          <p className="truncate text-xs text-(--color-muted)">
                            {user.email || "Correo no disponible"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${classForPlan(user.plan)}`}
                        >
                          {user.plan === "premium" ? "Premium" : "Free"}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-(--color-muted)">
                        <span>
                          {integerFormatter.format(user.recordsCount)} registros
                        </span>
                        <span className="text-(--color-accent)">
                          {moneyFormatter.format(user.aiCostUsd)}
                        </span>
                        <span>
                          {user.onboardingStatus === "complete"
                            ? "Completo"
                            : "Pendiente"}
                        </span>
                      </div>
                    </button>
                  ))}
                  {data.users.length === 0 ? (
                    <p className="px-4 py-16 text-center text-sm text-(--color-muted)">
                      No hay usuarios para los filtros seleccionados.
                    </p>
                  ) : null}
                </div>
                {data.users.length === 0 ? (
                  <div className="hidden min-h-72 items-center justify-center text-sm text-(--color-muted) md:flex">
                    No hay usuarios para los filtros seleccionados.
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3 border-t border-(--color-border) p-4 text-xs text-(--color-muted)">
                  <span>
                    Mostrando {integerFormatter.format(data.users.length)} de{" "}
                    {integerFormatter.format(pagination.total)} usuarios
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      title="Página anterior"
                      disabled={pagination.page <= 1}
                      onClick={() => updateQuery("page", pagination.page - 1)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--color-border) disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-(--color-accent) px-2 font-bold text-(--color-accent-contrast)">
                      {pagination.page}
                    </span>
                    <button
                      type="button"
                      title="Página siguiente"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => updateQuery("page", pagination.page + 1)}
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-(--color-border) disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <aside
            className={`fixed top-14 right-0 bottom-0 z-40 hidden w-[370px] overflow-y-auto border-l border-(--color-border) bg-(--color-bg) shadow-[-18px_0_50px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out xl:block ${
              selected
                ? "pointer-events-auto translate-x-0"
                : "pointer-events-none translate-x-full"
            }`}
          >
            <UserDetail
              user={selected}
              onClose={closeDetail}
              onChange={handleChange}
              onAction={handleUserAction}
            />
          </aside>
          <div
            className={`fixed inset-0 z-50 bg-black/55 transition-opacity xl:hidden ${selected ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
            onClick={closeDetail}
          />
          <div
            className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-y-auto border-l border-(--color-border) bg-(--color-bg) shadow-[-18px_0_50px_rgba(0,0,0,0.35)] transition-transform xl:hidden ${selected ? "translate-x-0" : "translate-x-full"}`}
          >
            <UserDetail
              user={selected}
              onClose={closeDetail}
              onChange={handleChange}
              onAction={handleUserAction}
            />
          </div>
        </>
      ) : null}
      {confirmationCopy ? (
        <AdminConfirmModal
          open
          title={confirmationCopy.title}
          description={confirmationCopy.description}
          confirmLabel={confirmationCopy.confirmLabel}
          tone={confirmationCopy.tone}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void confirmAction()}
        />
      ) : null}
    </div>
  );
}
