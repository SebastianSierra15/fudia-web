import { HowItWorksCtaSection } from "@/src/components/como-funciona/organisms/HowItWorksCtaSection";
import { FooterSection } from "@/src/components/shared/organisms/FooterSection";
import { NavBar } from "@/src/components/shared/organisms/NavBar";
import { PrivacyBodySection } from "../organisms/PrivacyBodySection";
import { PrivacyHeroSection } from "../organisms/PrivacyHeroSection";

export function PrivacyPolicyTemplate() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar />
      <main className="flex flex-1 flex-col">
        <PrivacyHeroSection />
        <PrivacyBodySection />
        <HowItWorksCtaSection
          title="Mejora tu relación con la comida."
          description="Sin culpa, sin complicaciones. Solo datos reales y hábitos que duran."
          googlePlayLabel="Disponible en Google Play"
        />
      </main>
      <FooterSection />
    </div>
  );
}

