import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const baseClass =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-tint) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg) cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm md:text-base",
};

const variantClasses = {
  primary:
    "bg-(--color-accent) text-(--color-accent-contrast) hover:bg-(--color-accent-strong)",
  secondary:
    "border border-(--color-border) bg-(--color-surface-2) text-foreground hover:bg-(--color-surface)",
  ghost: "text-foreground hover:bg-(--color-surface-2)",
};

type SharedProps = {
  label: string;
  href?: string;
  size?: keyof typeof sizeClasses;
  variant?: keyof typeof variantClasses;
  className?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  showLoadingLabel?: boolean;
};

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({
  label,
  href,
  size = "md",
  variant = "primary",
  className,
  isLoading = false,
  loadingLabel,
  showLoadingLabel = true,
  ...rest
}: ButtonProps | ButtonLinkProps) {
  const classes = `${baseClass} ${sizeClasses[size]} ${variantClasses[variant]} ${
    className ?? ""
  }`;

  if (href) {
    const { title, ...linkProps } = rest as ButtonLinkProps;
    const resolvedTitle = title ?? label;
    return (
      <a
        href={href}
        className={classes}
        title={resolvedTitle}
        {...linkProps}
      >
        {label}
      </a>
    );
  }

  const buttonProps = rest as ButtonProps;
  const { type, disabled, ...nativeButtonProps } = buttonProps;

  return (
    <button
      type={type ?? "button"}
      className={classes}
      disabled={Boolean(disabled) || isLoading}
      {...nativeButtonProps}
    >
      {isLoading ? (
        <span className={`inline-flex items-center ${showLoadingLabel ? "gap-2" : ""}`}>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {showLoadingLabel ? loadingLabel ?? label : null}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
