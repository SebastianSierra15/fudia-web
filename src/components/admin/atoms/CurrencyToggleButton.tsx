type CurrencyMode = "COP" | "USD";

type CurrencyToggleButtonProps = {
  mode: CurrencyMode;
  onToggle: () => void;
};

export function CurrencyToggleButton({
  mode,
  onToggle,
}: CurrencyToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-surface-2) px-4 text-sm font-semibold text-foreground transition-colors hover:bg-(--color-surface)"
    >
      {mode === "COP" ? "Ver en USD" : "Ver en COP"}
    </button>
  );
}
