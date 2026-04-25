import type { LucideIcon } from "lucide-react";

type ProductTrustPillProps = {
  icon: LucideIcon;
  label: string;
};

export function ProductTrustPill({ icon: Icon, label }: ProductTrustPillProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-base font-medium text-(--color-muted)">
      <Icon size={15} strokeWidth={2.1} className="text-(--color-accent)" />
      {label}
    </span>
  );
}
