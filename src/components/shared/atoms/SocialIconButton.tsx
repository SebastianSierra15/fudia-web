import type { AnchorHTMLAttributes } from "react";
import type { ReactNode } from "react";

type SocialIconButtonProps = {
  icon: ReactNode;
  label: string;
  href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export function SocialIconButton({
  icon,
  label,
  href,
  title,
  className = "",
  ...rest
}: SocialIconButtonProps) {
  return (
    <a
      href={href}
      title={title ?? label}
      aria-label={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-surface-2) text-(--color-muted) transition-colors hover:text-foreground ${className}`}
      {...rest}
    >
      {icon}
    </a>
  );
}
