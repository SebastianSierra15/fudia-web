import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import type { AiDataSourceStatus } from "@/src/lib/admin-ai/types";

type AdminSourceBadgeProps = {
  status: AiDataSourceStatus;
};

const statusConfig = {
  ok: {
    label: "Disponible",
    className:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    icon: CheckCircle2,
  },
  partial: {
    label: "Parcial",
    className:
      "border-amber-400/30 bg-amber-400/10 text-amber-300",
    icon: AlertTriangle,
  },
  unavailable: {
    label: "No disponible",
    className:
      "border-red-400/30 bg-red-400/10 text-red-300",
    icon: MinusCircle,
  },
} satisfies Record<
  AiDataSourceStatus,
  {
    label: string;
    className: string;
    icon: typeof CheckCircle2;
  }
>;

export function AdminSourceBadge({ status }: AdminSourceBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold ${config.className}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}
