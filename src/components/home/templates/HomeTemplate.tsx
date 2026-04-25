import { FooterSection } from "@/src/components/shared/organisms/FooterSection";
import { NavBar } from "@/src/components/shared/organisms/NavBar";
import { CtaSection } from "../organisms/CtaSection";
import { DesignedSection } from "../organisms/DesignedSection";
import { FeaturesSection } from "../organisms/FeaturesSection";
import { HeroMetricsSection } from "../organisms/HeroMetricsSection";
import { HeroSection } from "../organisms/HeroSection";
import { StepsSection } from "../organisms/StepsSection";
import { TestimonialsSection } from "../organisms/TestimonialsSection";

export function HomeTemplate() {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,var(--color-bg)_0%,var(--color-gradient)_100%)] text-foreground">
      <NavBar />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <HeroMetricsSection />
        <StepsSection />
        <FeaturesSection />
        <DesignedSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
