"use client";

import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BrainCircuit,
  ChevronUp,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { AdminFeedbackProvider } from "../molecules/AdminFeedbackProvider";
import { logoutCurrentSession } from "@/src/lib/appwrite/auth";

type AdminShellProps = {
  title: string;
  subtitle: string;
  userLabel: string;
  children: ReactNode;
  actions?: ReactNode;
  isRightPanelOpen?: boolean;
};

type AdminHeaderActionsContextValue = {
  setActions: (actions: ReactNode) => void;
};

const AdminHeaderActionsContext =
  createContext<AdminHeaderActionsContextValue | null>(null);

const adminTheme: CSSProperties & Record<string, string> = {
  "--color-bg": "#080f1f",
  "--color-fg": "#f8fafc",
  "--color-muted": "#9fb0c7",
  "--color-muted-2": "#62708a",
  "--color-surface": "#101a2d",
  "--color-surface-2": "#1a2940",
  "--color-border": "#22324d",
  "--color-gradient": "#0b1426",
  "--color-tint": "#a3e467",
  "--color-accent": "#a3e467",
  "--color-accent-strong": "#83dc4d",
  "--color-accent-soft": "#1d3b2a",
  "--color-accent-contrast": "#07110a",
  "--background": "#080f1f",
  "--foreground": "#f8fafc",
};

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/ia", label: "IA Analytics", icon: BrainCircuit },
  {
    href: "/admin/transactions",
    label: "Transacciones",
    icon: BarChart3,
    disabled: true,
  },
  {
    href: "/admin/support",
    label: "Soporte",
    icon: CircleHelp,
    badge: "12",
    disabled: true,
  },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
];

const systemItems = [
  {
    href: "/admin/settings",
    label: "Configuracion",
    icon: Settings,
  },
  { href: "/admin/equipo", label: "Equipo", icon: Users },
];

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AD";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SidebarContent({
  userLabel,
  onNavigate,
}: {
  userLabel: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = getInitials(userLabel);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutCurrentSession();
    } finally {
      router.replace("/login");
      onNavigate?.();
    }
  };

  const renderItem = (item: (typeof menuItems)[number]) => {
    const Icon = item.icon;
    const isActive =
      item.href === "/admin"
        ? pathname === item.href
        : pathname.startsWith(item.href);
    const classes = `group flex h-9 w-full cursor-pointer items-center justify-start gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors ${
      isActive
        ? "bg-(--color-accent-soft) text-(--color-accent)"
        : "text-(--color-muted) hover:bg-(--color-surface-2) hover:text-foreground"
    } ${item.disabled ? "opacity-75" : ""}`;

    const content = (
      <>
        <Icon size={16} />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge ? (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        ) : null}
      </>
    );

    if (item.disabled) {
      return (
        <button
          key={item.href}
          type="button"
          title={`${item.label} proximamente`}
          className={classes}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        className={classes}
        onClick={onNavigate}
      >
        {content}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/admin"
        title="Fudia admin"
        className="flex h-16 cursor-pointer items-center gap-3 border-b border-(--color-border) px-5"
        onClick={onNavigate}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--color-accent)">
          <Image
            src="/global/fudia_logo.png"
            alt="Fudia"
            title="Fudia"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
        </span>
        <span className="text-lg font-bold tracking-tight">fudia</span>
        <span className="rounded-full bg-(--color-surface-2) px-2 py-0.5 text-[10px] font-medium text-(--color-muted)">
          admin
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-(--color-muted-2)">
          Menu
        </p>
        <nav className="mt-3 grid gap-1">{menuItems.map(renderItem)}</nav>

        <p className="mt-8 px-2 text-[11px] font-bold uppercase tracking-wider text-(--color-muted-2)">
          Sistema
        </p>
        <nav className="mt-3 grid gap-1">{systemItems.map(renderItem)}</nav>
      </div>

      <div className="relative border-t border-(--color-border) p-3">
        <button
          type="button"
          title="Abrir menu de usuario"
          onClick={() => setIsUserMenuOpen((value) => !value)}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg bg-(--color-surface-2) p-3 text-left transition-colors hover:bg-[#243653] ${
            isUserMenuOpen ? "ring-1 ring-(--color-border)" : ""
          }`}
          aria-expanded={isUserMenuOpen}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-xs font-bold text-(--color-accent-contrast)">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{userLabel}</p>
            <p className="text-xs text-(--color-muted)">Super Admin</p>
          </div>
          <ChevronUp
            size={15}
            className={`shrink-0 text-(--color-muted) transition-transform ${
              isUserMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {isUserMenuOpen ? (
          <>
            <button
              type="button"
              aria-label="Cerrar menu de usuario"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setIsUserMenuOpen(false)}
              tabIndex={-1}
            />
            <div className="absolute right-3 bottom-[72px] left-3 z-20 overflow-hidden rounded-lg border border-(--color-border) bg-[#121f34] shadow-[0_18px_42px_rgba(0,0,0,0.45)]">
              <div className="border-b border-(--color-border) px-3 py-3">
                <p className="truncate text-sm font-bold">{userLabel}</p>
                <p className="mt-0.5 text-xs text-(--color-muted)">
                  Panel administrativo
                </p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  title="Cerrar sesión"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                  className="flex h-10 w-full cursor-pointer items-center justify-start gap-3 rounded-md px-3 text-left text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:cursor-wait disabled:opacity-70"
                >
                  <LogOut size={16} />
                  {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function AdminShell({
  title,
  subtitle,
  userLabel,
  children,
  actions,
  isRightPanelOpen = false,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dynamicActions, setDynamicActions] = useState<ReactNode>(null);
  const headerActionsContext = useMemo(
    () => ({ setActions: setDynamicActions }),
    [],
  );

  return (
    <AdminFeedbackProvider>
      <AdminHeaderActionsContext.Provider value={headerActionsContext}>
        <div
          style={adminTheme}
          className="min-h-screen bg-(--color-bg) text-foreground"
        >
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-[210px] border-r border-(--color-border) bg-(--color-surface) lg:block">
            <SidebarContent userLabel={userLabel} />
          </aside>

          <div
            className={`fixed inset-0 z-50 bg-black/55 transition-opacity duration-200 lg:hidden ${
              isSidebarOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[86vw] border-r border-(--color-border) bg-(--color-surface) shadow-[18px_0_50px_rgba(0,0,0,0.35)] transition-transform duration-200 lg:hidden ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              type="button"
              title="Cerrar menu"
              aria-label="Cerrar menu"
              className="absolute top-3 right-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-(--color-surface-2) text-(--color-muted) hover:text-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent
              userLabel={userLabel}
              onNavigate={() => setIsSidebarOpen(false)}
            />
          </aside>

          <main className="min-h-screen lg:pl-[210px]">
            <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-4 border-b border-(--color-border) bg-(--color-bg)/95 px-4 backdrop-blur md:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  title="Abrir menu"
                  aria-label="Abrir menu"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-(--color-surface-2) text-(--color-muted) hover:text-foreground lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold leading-6">
                    {title}
                  </h1>
                  <p className="truncate text-xs text-(--color-muted)">
                    {subtitle}
                  </p>
                </div>
              </div>
              {actions || dynamicActions ? (
                <div className="flex shrink-0 items-center gap-2">
                  {actions}
                  {dynamicActions}
                </div>
              ) : null}
            </header>

            <div
              className={`mx-auto max-w-[1240px] animate-[admin-fade-in_0.28s_ease-out] px-4 py-4 transition-[padding,max-width] duration-300 ease-out md:px-7 ${isRightPanelOpen ? "xl:max-w-none xl:pr-[397px]" : ""}`}
            >
              {children}
            </div>
          </main>
        </div>
      </AdminHeaderActionsContext.Provider>
    </AdminFeedbackProvider>
  );
}

export function useAdminHeaderActions(actions: ReactNode) {
  const context = useContext(AdminHeaderActionsContext);
  if (!context)
    throw new Error("useAdminHeaderActions must be used inside AdminShell");
  useEffect(() => {
    context.setActions(actions);
    return () => context.setActions(null);
  }, [actions, context]);
}
