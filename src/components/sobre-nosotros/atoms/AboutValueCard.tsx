import type { LucideIcon } from "lucide-react";

type AboutValueCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function AboutValueCard({
  icon: Icon,
  title,
  description,
}: AboutValueCardProps) {
  return (
    <article className="rounded-2xl border border-(--color-border) bg-(--color-bg) p-7 transition-all duration-200 hover:border-(--color-accent) hover:shadow-[0_14px_34px_rgba(166,233,100,0.18)]">
      <Icon size={30} className="text-(--color-accent)" />
      <h3 className="mt-5 text-3xl leading-tight font-semibold text-foreground md:text-4xl">
        {title}
      </h3>
      <p className="mt-4 text-base leading-8 text-(--color-muted) md:text-lg">{description}</p>
    </article>
  );
}
