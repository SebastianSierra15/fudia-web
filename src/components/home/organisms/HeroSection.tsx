import { Smartphone, Star } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { AppStoreLogo, GooglePlayLogo } from "@/src/components/shared/atoms/StoreLogos";
import { HeroImageCard } from "@/src/components/shared/molecules/HeroImageCard";
import { StoreDownloadButton } from "@/src/components/shared/molecules/StoreDownloadButton";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-(--color-border) py-10 md:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(182,240,117,0.22),transparent_58%)]" />
      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-(--color-accent) bg-[rgba(9,18,41,0.6)] px-4 py-2 text-sm font-semibold text-(--color-accent)">
              <Smartphone size={16} strokeWidth={2.2} />
              Tu nutricionista personal, ahora en tu bolsillo
            </p>

            <div className="space-y-4">
              <h1 className="text-balance text-4xl leading-[1.05] font-semibold text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Transforma tu vida
                <span className="block text-(--color-accent-strong)">
                  con IA nutricional
                </span>
              </h1>
              <p className="text-base leading-7 text-(--color-muted) md:text-lg">
                Registra tus comidas con una foto, un audio o escribiendo. Fudia
                analiza tus nutrientes y te ofrece recomendaciones
                personalizadas con inteligencia artificial.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <StoreDownloadButton
                icon={<AppStoreLogo className="size-5" />}
                label="App Store"
                className="w-full border-(--color-accent) bg-(--color-accent) text-(--color-accent-contrast) hover:bg-(--color-accent-strong) sm:w-auto"
              />
              <StoreDownloadButton
                icon={<GooglePlayLogo className="size-5" />}
                label="Google Play"
                className="w-full border-[#2b354e] bg-[#141b2d] text-white hover:bg-[#1c2842] sm:w-auto"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-base font-semibold text-(--color-muted)">
              <span className="flex items-center gap-1 text-(--color-muted-2)">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    strokeWidth={1.85}
                    className="fill-transparent"
                  />
                ))}
              </span>
              <span>Más de 10,000 usuarios activos</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-136">
            <div className="grid grid-cols-2 items-end gap-4 sm:gap-6">
              <HeroImageCard
                src="/media/phone-tennis.webp"
                alt="Mujer deportista usando Fudia"
                title="Mujer deportista usando Fudia"
                backgroundClassName="bg-[#eddc69]"
                className="sm:translate-y-8"
                priority
                delay={0.04}
              />
              <HeroImageCard
                src="/media/phone-scale.webp"
                alt="Alimentos saludables junto a una balanza"
                title="Alimentos saludables junto a una balanza"
                priority
                delay={0.16}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
