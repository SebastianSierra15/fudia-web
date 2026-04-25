import type { LucideIcon } from "lucide-react";

type SectionTagProps = {
  label: string;
  icon?: LucideIcon;
  className?: string;
};

export function SectionTag({ label, icon: Icon, className = "" }: SectionTagProps) {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-2) px-4 py-2 text-sm font-semibold tracking-wide text-(--color-accent) ${className}`}
    >
      {Icon ? <Icon size={15} strokeWidth={2.1} /> : null}
      {label}
    </p>
  );
}
