import { Salad, Smartphone, Sprout } from "lucide-react";

export function AboutStoryMosaic() {
  return (
    <div className="rounded-4xl bg-[#071633] p-6">
      <div className="grid grid-cols-[1fr_1.45fr] gap-4">
        <div className="flex h-56 items-center justify-center rounded-3xl bg-[linear-gradient(145deg,#9de04e,#c8ec89)] text-[#1c3c0a]">
          <Salad size={54} strokeWidth={1.8} />
        </div>
        <div className="flex h-56 items-center justify-center rounded-3xl bg-[linear-gradient(145deg,#16181d,#2f405a)] text-[#f2f7ff]">
          <Smartphone size={48} strokeWidth={1.8} />
        </div>
        <div className="flex h-56 flex-col items-center justify-center rounded-3xl bg-[#051438] px-8 text-center">
          <p className="text-5xl font-semibold text-(--color-accent)">98%</p>
          <p className="mt-2 text-xl leading-8 text-[#f3f7ff]">
            precision en analisis nutricional con IA
          </p>
        </div>
        <div className="flex h-56 items-center justify-center rounded-3xl bg-[#d8e7c1] text-[#8bbd44]">
          <Sprout size={56} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
