type GoogleAuthButtonProps = {
  label: string;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
};

export function GoogleAuthButton({
  label,
  disabled = false,
  isLoading = false,
  onClick,
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-(--color-border) bg-background text-sm font-semibold text-foreground transition-colors hover:bg-(--color-surface-2) disabled:cursor-not-allowed disabled:opacity-70"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.63v3.01h3.89c2.28-2.1 3.55-5.2 3.55-8.67z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.01c-1.08.72-2.45 1.14-4.06 1.14-3.12 0-5.77-2.1-6.72-4.93H1.26v3.1A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.3A7.19 7.19 0 0 1 4.9 12c0-.8.14-1.58.38-2.3V6.6H1.26A12 12 0 0 0 0 12c0 1.93.46 3.75 1.26 5.4l4.02-3.1z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.33.6 4.57 1.78l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.6l4.02 3.1C6.23 6.87 8.88 4.77 12 4.77z"
        />
      </svg>
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Conectando...
        </span>
      ) : (
        label
      )}
    </button>
  );
}
