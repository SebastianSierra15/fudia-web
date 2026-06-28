import type { AnchorHTMLAttributes, ReactNode } from "react";

type StoreDownloadButtonProps = {
  icon: ReactNode;
  label: string;
  href?: string;
  className?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export function StoreDownloadButton({
  icon,
  label,
  href = "#",
  className = "",
  title,
  ...rest
}: StoreDownloadButtonProps) {
  return (
    <a
      href={href}
      title={title ?? label}
      className={`inline-flex h-14 min-w-56 items-center justify-center gap-2.5 rounded-2xl border px-6 text-lg font-semibold transition-colors ${className}`}
      {...rest}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        {icon}
      </span>
      {label}
    </a>
  );
}
