type HowItWorksBulletItemProps = {
  text: string;
};

export function HowItWorksBulletItem({ text }: HowItWorksBulletItemProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-(--color-accent)" />
      <span className="text-base leading-8 font-medium text-foreground md:text-xl">
        {text}
      </span>
    </li>
  );
}
