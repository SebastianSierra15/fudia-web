import Image from "next/image";

type HowItWorksImagePanelProps = {
  src: string;
  alt: string;
  title: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

export function HowItWorksImagePanel({
  src,
  alt,
  title,
  priority = false,
  className = "",
  sizes = "(max-width: 1024px) 92vw, 50vw",
}: HowItWorksImagePanelProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-4xl border border-(--color-accent) shadow-[0_24px_50px_rgba(0,0,0,0.16)] ${className}`}
    >
      <div className="relative aspect-16/10">
        <Image
          src={src}
          alt={alt}
          title={title}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
      </div>
    </div>
  );
}
