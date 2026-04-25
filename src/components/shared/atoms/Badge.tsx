
type BadgeProps = {
  text: string;
  tone?: "accent" | "muted";
};

export function Badge({ text, tone = "muted" }: BadgeProps) {
  const toneClass =
    tone === "accent"
      ? "bg-(--color-badge-bg) text-(--color-badge-text)"
      : "bg-(--color-surface-2) text-(--color-muted)";
  const dotClass =
    tone === "accent" ? "bg-(--color-badge-text)" : "bg-(--color-accent-strong)";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {text}
    </span>
  );
}


