"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, LayoutDashboard, ScrollText } from "lucide-react";

const navigationItems = [
  {
    href: "/admin",
    label: "Resumen y finanzas",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/ia",
    label: "Uso de IA",
    icon: BrainCircuit,
  },
  {
    href: "/admin/logs",
    label: "Logs",
    icon: ScrollText,
  },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegacion administrativa"
      className="mb-8 flex gap-2 overflow-x-auto border-b border-(--color-border)"
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors ${
              isActive
                ? "border-(--color-accent-strong) text-foreground"
                : "border-transparent text-(--color-muted) hover:text-foreground"
            }`}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
