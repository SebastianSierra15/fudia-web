import type { LucideIcon } from "lucide-react";
import type { AnchorHTMLAttributes } from "react";

type StoreDownloadButtonProps = {
  icon: LucideIcon;
  label: string;
  href?: string;
  className?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export function StoreDownloadButton({
  icon: Icon,
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
      <Icon size={21} strokeWidth={2.2} />
      {label}
    </a>
  );
}
