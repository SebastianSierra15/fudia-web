import { Container } from "@/src/components/shared/atoms/Container";
import { MetricCounter } from "../molecules/MetricCounter";

type HeroMetric = {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

const defaultMetrics: HeroMetric[] = [
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

type HeroMetricsSectionProps = {
  metrics?: HeroMetric[];
  tone?: "default" | "about";
};

export function HeroMetricsSection({
  metrics = defaultMetrics,
  tone = "default",
}: HeroMetricsSectionProps) {
  const isAboutTone = tone === "about";

  return (
    <section
      className={`border-y py-8 ${
        isAboutTone
          ? "border-[#26344a] bg-[#071633] dark:border-[#2f4058] dark:bg-[#22324a]"
          : "border-(--color-border) bg-(--color-surface-2)"
      }`}
    >
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={
                index > 0
                  ? `lg:border-l lg:pl-8 ${
                      isAboutTone ? "lg:border-[#26344a]" : "lg:border-(--color-border)"
                    }`
                  : ""
              }
            >
              <MetricCounter
                target={metric.target}
                suffix={metric.suffix}
                decimals={metric.decimals}
                label={metric.label}
                delay={index * 0.08}
                valueClassName={isAboutTone ? "text-[#9FE35F]" : ""}
                labelClassName={isAboutTone ? "text-[#8aa0c0]" : ""}
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
