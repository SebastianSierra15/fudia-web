import { Container } from "@/src/components/shared/atoms/Container";
import { SectionTag } from "@/src/components/shared/atoms/SectionTag";
import { Sparkles } from "lucide-react";
import { AboutFounderCard } from "../molecules/AboutFounderCard";

const founders = [
  {
    name: "Sebasti\u00e1n Torres",
    role: "Co-fundador & CEO",
    badge: "Co-fundador & CEO",
    initial: "S",
    tone: "lime" as const,
    bio: "Ingeniero de sistemas de la Universidad de los Andes con una obsesi\u00f3n por los productos que realmente cambian h\u00e1bitos. Antes de Fudia trabaj\u00f3 en machine learning aplicado a salud en un startup de telemedicina. Sube monta\u00f1as los fines de semana y tiene una relaci\u00f3n amor-odio con el conteo de calor\u00edas que lo llev\u00f3 a crear la soluci\u00f3n definitiva.",
    tags: ["Product Strategy", "Machine Learning", "Fundraising", "Growth"],
  },
  {
    name: "Mateo R\u00edos",
    role: "Co-fundador & CTO",
    badge: "Co-fundador & CTO",
    initial: "M",
    tone: "blue" as const,
    bio: "Ingeniero de software apasionado por la visi\u00f3n computacional y las interfaces m\u00f3viles. Construy\u00f3 los primeros modelos de reconocimiento de alimentos de Fudia desde cero integrando OpenAI Vision con un pipeline de validaci\u00f3n nutricional propio. Fan del caf\u00e9 de especialidad, los keyboards mec\u00e1nicos y la arquitectura de software limpia.",
    tags: ["React Native", "Computer Vision", "Backend", "DevOps"],
  },
];

export function AboutFoundersSection() {
  return (
    <section className="bg-(--color-surface) py-20 md:py-24">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <SectionTag label="EL EQUIPO FUNDADOR" icon={Sparkles} />
          <h2 className="mt-6 text-balance text-5xl leading-[1.08] font-semibold text-foreground md:text-7xl">
            {"Las personas detr\u00e1s de "}
            <span className="text-(--color-accent)">Fudia</span>
          </h2>
          <p className="mt-5 text-base leading-8 text-(--color-muted) md:text-lg">
            {
              "Dos ingenieros con pasi\u00f3n por la salud, la inteligencia artificial y el dise\u00f1o de producto."
            }
          </p>
        </div>

        <div className="mt-14 grid gap-8 xl:grid-cols-2">
          {founders.map((founder) => (
            <AboutFounderCard key={founder.name} {...founder} />
          ))}
        </div>
      </Container>
    </section>
  );
}
