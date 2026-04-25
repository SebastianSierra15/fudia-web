import { Check, X } from "lucide-react";

type PlanFeatureItemProps = {
  text: string;
  available?: boolean;
};

export function PlanFeatureItem({ text, available = true }: PlanFeatureItemProps) {
  return (
    <li className="flex items-start gap-3 text-lg leading-8">
      <span
        className={`mt-1 inline-flex h-5 w-5 items-center justify-center ${
          available ? "text-(--color-accent)" : "text-(--color-border)"
        }`}
      >
        {available ? <Check size={18} strokeWidth={2.5} /> : <X size={16} />}
      </span>
      <span
        className={
          available ? "text-foreground" : "text-(--color-muted) line-through"
        }
      >
        {text}
      </span>
    </li>
  );
}

