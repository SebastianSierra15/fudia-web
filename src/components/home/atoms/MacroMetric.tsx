type MacroMetricProps = {
  value: string;
  label: string;
  highlighted?: boolean;
};

export function MacroMetric({
  value,
  label,
  highlighted = false,
}: MacroMetricProps) {
  return (
    <div className="space-y-1">
      <p
        className={`text-4xl leading-none font-semibold ${
          highlighted ? "text-(--color-accent)" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-sm text-(--color-muted)">{label}</p>
    </div>
  );
}
