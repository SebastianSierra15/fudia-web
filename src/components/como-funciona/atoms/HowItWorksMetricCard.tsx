type HowItWorksMetricCardProps = {
  value: string;
  label: string;
};

export function HowItWorksMetricCard({
  value,
  label,
}: HowItWorksMetricCardProps) {
  return (
    <div className="flex min-h-24 min-w-34 flex-col items-center justify-center rounded-2xl border border-(--color-border) bg-background px-4 py-3 text-center shadow-[0_4px_16px_rgba(10,20,45,0.05)] dark:bg-[#0c1a3a]">
      <span className="text-3xl font-semibold text-(--color-accent)">
        {value}
      </span>
      <span className="mt-1 text-sm text-(--color-muted)">{label}</span>
    </div>
  );
}
