import { HowItWorksAnalyzeSection } from "../organisms/HowItWorksAnalyzeSection";
import { HowItWorksCaptureSection } from "../organisms/HowItWorksCaptureSection";
import { HowItWorksCtaSection } from "../organisms/HowItWorksCtaSection";
import { HowItWorksHeroSection } from "../organisms/HowItWorksHeroSection";
import { HowItWorksImproveSection } from "../organisms/HowItWorksImproveSection";
import { FooterSection } from "@/src/components/shared/organisms/FooterSection";
import { NavBar } from "@/src/components/shared/organisms/NavBar";

export function HowItWorksTemplate() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar activeItem="como-funciona" />
      <main className="flex flex-1 flex-col">
        <HowItWorksHeroSection />
        <HowItWorksCaptureSection />
        <HowItWorksAnalyzeSection />
        <HowItWorksImproveSection />
        <HowItWorksCtaSection />
      </main>
      <FooterSection />
    </div>
  );
}

