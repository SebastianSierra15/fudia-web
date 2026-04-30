import { Dna, Earth, Search, Zap } from "lucide-react";
import { Container } from "@/src/components/shared/atoms/Container";
import { AboutValueCard } from "../atoms/AboutValueCard";

const values = [
  {
    icon: Zap,
    title: "Velocidad con prop\u00f3sito",
    description:
      "Iteramos r\u00e1pido, pero nunca sacrificamos la calidad del dato nutricional. La precisi\u00f3n no es negociable.",
  },
  {
    icon: Search,
    title: "Transparencia radical",
    description:
      "Te mostramos exactamente c\u00f3mo calculamos tus macros. Sin cajas negras, sin estimados vagos.",
  },
  {
    icon: Earth,
    title: "Acceso para todos",
    description:
      "Dise\u00f1amos primero para Latinoam\u00e9rica. Nuestros modelos reconocen arepas, bandeja paisa y aguadepanela.",
  },
  {
    icon: Dna,
    title: "Ciencia primero",
    description:
      "Cada recomendaci\u00f3n est\u00e1 respaldada por evidencia nutricional real, no por tendencias de redes sociales.",
  },
];

export function AboutValuesSection() {
  return (
    <section className="bg-(--color-surface) py-16 md:py-20">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-balance text-5xl leading-[1.08] font-semibold text-foreground md:text-7xl">
            Lo que nos <span className="text-(--color-accent)">define</span>
          </h2>
          <p className="mt-5 text-base leading-8 text-(--color-muted) md:text-lg">
            {
              "Cuatro principios que gu\u00edan cada decisi\u00f3n de producto, de negocio y de equipo."
            }
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => (
            <AboutValueCard key={value.title} {...value} />
          ))}
        </div>
      </Container>
    </section>
  );
}
