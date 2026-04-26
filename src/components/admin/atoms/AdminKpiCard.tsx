type AdminKpiCardProps = {
  title: string;
  value: string;
  hint: string;
  tone?: "neutral" | "success" | "warning";
};

const toneClasses: Record<NonNullable<AdminKpiCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  success: "text-emerald-500",
  warning: "text-amber-500",
};

export function AdminKpiCard({
  title,
  value,
  hint,
  tone = "neutral",
}: AdminKpiCardProps) {
  return (
    <article className="rounded-2xl border border-(--color-border) bg-(--color-surface-2) p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-(--color-muted)">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-(--color-muted)">{hint}</p>
    </article>
  );
}
