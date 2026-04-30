import { FooterSection } from "@/src/components/shared/organisms/FooterSection";
import { NavBar } from "@/src/components/shared/organisms/NavBar";
import { HeroMetricsSection } from "@/src/components/home/organisms/HeroMetricsSection";
import { AboutCtaSection } from "../organisms/AboutCtaSection";
import { AboutFoundersSection } from "../organisms/AboutFoundersSection";
import { AboutHeroSection } from "../organisms/AboutHeroSection";
import { AboutStorySection } from "../organisms/AboutStorySection";
import { AboutValuesSection } from "../organisms/AboutValuesSection";

const aboutMetrics = [
  { target: 2022, label: "Año de fundación" },
  { target: 50, suffix: "K+", label: "Usuarios activos" },
  { target: 2, suffix: "M+", label: "Comidas registradas" },
  { target: 4.9, suffix: "★", decimals: 1, label: "Rating en App Store" },
];

export function AboutTemplate() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar activeItem="sobre-nosotros" />
      <main className="flex flex-1 flex-col">
        <AboutHeroSection />
        <HeroMetricsSection metrics={aboutMetrics} tone="about" />
        <AboutStorySection />
        <AboutFoundersSection />
        <AboutValuesSection />
        <AboutCtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
