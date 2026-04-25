
type StatItemProps = {
  value: string;
  label: string;
};

export function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-lg font-semibold text-foreground">
        {value}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-(--color-muted)">
        {label}
      </span>
    </div>
  );
}




