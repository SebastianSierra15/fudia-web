import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";
import { Sparkles } from "lucide-react";

export function AboutHeroSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <Container>
        <div className="max-w-4xl space-y-7">
          <SectionTag label="SOBRE NOSOTROS" icon={Sparkles} />

          <h1 className="text-balance text-5xl leading-[1.05] font-semibold text-foreground md:text-7xl">
            {"Construidos para "}
            <span className="text-(--color-accent)">cambiar</span>
            {" la relaci\u00f3n con tu comida"}
          </h1>

          <p className="max-w-3xl text-base leading-8 text-(--color-muted) md:text-lg">
            {
              "Somos un equipo peque\u00f1o con una convicci\u00f3n enorme: que la tecnolog\u00eda puede hacer que comer bien sea simple, placentero y accesible para todos."
            }
          </p>
        </div>
      </Container>
    </section>
  );
}
