"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Clock3,
  Sparkles,
  Target,
  TrendingUp,
  WandSparkles,
} from "lucide-react";
import { MacroMetric } from "../atoms/MacroMetric";
import { FeatureCard } from "../molecules/FeatureCard";
import { Container } from "@/src/components/shared/atoms/Container";

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-20" id="producto">
      <Container>
        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
            className="mx-auto max-w-5xl space-y-5 text-center"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-2) px-4 py-2 text-sm font-semibold tracking-wide text-(--color-accent)">
              <WandSparkles size={15} strokeWidth={2.1} />
              CARACTERÍSTICAS
            </p>
            <h2 className="text-balance text-4xl leading-tight font-semibold text-foreground md:text-6xl">
              Todo lo que necesitas para comer mejor
            </h2>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-12">
            <FeatureCard
              className="lg:col-span-5"
              title="Análisis IA en segundos"
              description="OpenAI Vision identifica cada ingrediente con precisión nutricional."
              icon={Sparkles}
              imageSrc="/media/hero-fruit.webp"
              imageAlt="Frutas sobre fondo azul para analisis nutricional"
              imageTitle="Frutas sobre fondo azul para analisis nutricional"
              delay={0.04}
            />

            <FeatureCard
              className="lg:col-span-4"
              title="Metas personalizadas"
              description="Establece tus objetivos calóricos y de macros según tu estilo de vida."
              icon={Target}
              delay={0.1}
            />

            <FeatureCard
              className="lg:col-span-3"
              title="Historial completo"
              description="Consulta todo lo que has comido con gráficas semanales y mensuales."
              icon={Clock3}
              highlighted
              delay={0.16}
            />

            <FeatureCard
              className="lg:col-span-8"
              title="Macros en tiempo real"
              description="Visualiza proteínas, carbohidratos, grasas y azúcares con gráficas intuitivas actualizadas al instante."
              icon={TrendingUp}
              delay={0.22}
            >
              <div className="mt-2 grid grid-cols-3 gap-4 border-t border-(--color-border) pt-4">
                <MacroMetric value="142g" label="Proteíñas" highlighted />
                <MacroMetric value="280g" label="Carbos" />
                <MacroMetric value="68g" label="Grasas" />
              </div>
            </FeatureCard>

            <FeatureCard
              className="lg:col-span-4"
              title="Recordatorios inteligentes"
              description="Fudia te recuerda cuándo comer y te alerta si te estás alejando de tus metas diarias."
              icon={Bell}
              delay={0.28}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
