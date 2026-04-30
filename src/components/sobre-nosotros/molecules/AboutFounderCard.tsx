type AboutFounderCardProps = {
  name: string;
  role: string;
  badge: string;
  initial: string;
  bio: string;
  tags: string[];
  tone: "lime" | "blue";
};

export function AboutFounderCard({
  name,
  role,
  badge,
  initial,
  bio,
  tags,
  tone,
}: AboutFounderCardProps) {
  const toneStyles =
    tone === "lime"
      ? {
          hero: "bg-[linear-gradient(140deg,#a2df56,#d8efb7)]",
          avatar:
            "bg-[#68c622] text-[#04123a] ring-[#e8f7d0] dark:ring-[#22324a]",
        }
      : {
          hero: "bg-[linear-gradient(145deg,#101a45,#153664)]",
          avatar:
            "bg-[#232e60] text-(--color-accent) ring-[#d5dbe5] dark:ring-[#22324a]",
        };

  return (
    <article className="overflow-hidden rounded-4xl border border-(--color-border) bg-background shadow-[0_16px_34px_rgba(3,12,30,0.06)]">
      <div className={`relative h-52 ${toneStyles.hero}`}>
        <span className="absolute top-6 right-6 rounded-full border border-black/10 bg-black/25 px-4 py-1 text-xs font-semibold text-[#d8efb7]">
          {badge}
        </span>

        <div
          className={`absolute -bottom-12 left-8 flex h-24 w-24 items-center justify-center rounded-full text-5xl font-semibold ring-4 ${toneStyles.avatar}`}
        >
          {initial}
        </div>
      </div>

      <div className="space-y-4 px-8 pt-14 pb-8">
        <div>
          <h3 className="text-4xl leading-tight font-semibold text-foreground md:text-5xl">{name}</h3>
          <p className="mt-1 text-base font-semibold text-(--color-accent) md:text-lg">{role}</p>
        </div>

        <p className="text-base leading-8 text-(--color-muted) md:text-lg">{bio}</p>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-(--color-border) bg-(--color-surface-2) px-4 py-1 text-xs font-semibold text-foreground md:text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
