import { ProductCtaSection } from "../organisms/ProductCtaSection";
import { ProductHeroSection } from "../organisms/ProductHeroSection";
import { ProductModulesSection } from "../organisms/ProductModulesSection";
import { FooterSection } from "@/src/components/shared/organisms/FooterSection";
import { NavBar } from "@/src/components/shared/organisms/NavBar";

export function ProductTemplate() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavBar activeItem="producto" />
      <main className="flex flex-1 flex-col">
        <ProductHeroSection />
        <ProductModulesSection />
        <ProductCtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
