import { Container } from "@/src/components/shared/atoms/Container";
import { MetricCounter } from "../molecules/MetricCounter";

const metrics = [
  {
    target: 50,
    suffix: "K+",
    label: "Usuarios activos",
  },
  {
    target: 2,
    suffix: "M+",
    label: "Comidas registradas",
  },
  {
    target: 98,
    suffix: "%",
    label: "Precisión de análisis IA",
  },
  {
    target: 4.9,
    suffix: "★",
    decimals: 1,
    label: "Rating en App Store",
  },
];

export function HeroMetricsSection() {
  return (
    <section className="border-y border-(--color-border) bg-(--color-surface-2) py-8">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={
                index > 0
                  ? "lg:border-l lg:border-(--color-border) lg:pl-8"
                  : ""
              }
            >
              <MetricCounter
                target={metric.target}
                suffix={metric.suffix}
                decimals={metric.decimals}
                label={metric.label}
                delay={index * 0.08}
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
