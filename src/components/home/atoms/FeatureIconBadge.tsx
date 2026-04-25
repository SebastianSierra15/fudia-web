import type { LucideIcon } from "lucide-react";

type FeatureIconBadgeProps = {
  icon: LucideIcon;
  highlighted?: boolean;
};

export function FeatureIconBadge({
  icon: Icon,
  highlighted = false,
}: FeatureIconBadgeProps) {
  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${
        highlighted
          ? "border-black/10 bg-black/5 text-(--color-accent-contrast)"
          : "border-(--color-border) bg-(--color-surface-2) text-(--color-accent)"
      }`}
    >
      <Icon size={20} strokeWidth={2.1} />
    </span>
  );
}
