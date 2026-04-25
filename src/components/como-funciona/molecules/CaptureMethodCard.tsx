import type { LucideIcon } from "lucide-react";

type CaptureMethodCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function CaptureMethodCard({
  icon: Icon,
  title,
  description,
}: CaptureMethodCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_6px_18px_rgba(10,20,45,0.04)]">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-surface-2)">
        <Icon size={20} strokeWidth={2.2} className="text-(--color-accent)" />
      </span>
      <div className="space-y-0.5">
        <h3 className="text-3xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-(--color-muted) md:text-base">
          {description}
        </p>
      </div>
    </article>
  );
}

