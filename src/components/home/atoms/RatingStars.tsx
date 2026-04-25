import { Star } from "lucide-react";

type RatingStarsProps = {
  muted?: boolean;
};

export function RatingStars({ muted = false }: RatingStarsProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${
        muted ? "text-(--color-muted-2)" : "text-(--color-accent)"
      }`}
      aria-label="5 de 5 estrellas"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={15}
          strokeWidth={2}
          className={muted ? "fill-transparent" : "fill-current"}
        />
      ))}
    </span>
  );
}
