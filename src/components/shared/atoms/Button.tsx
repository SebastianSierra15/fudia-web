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
};

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({
  label,
  href,
  size = "md",
  variant = "primary",
  className,
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

  return (
    <button type="button" className={classes} {...(rest as ButtonProps)}>
      {label}
    </button>
  );
}
