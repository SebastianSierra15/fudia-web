type AuthInputFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
};

export function AuthInputField({
  label,
  type = "text",
  placeholder,
  autoComplete,
}: AuthInputFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-(--color-border) bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-(--color-muted) focus:border-(--color-accent)"
      />
    </label>
  );
}

