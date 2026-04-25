import type { Metadata } from "next";
import { HowItWorksTemplate } from "@/src/components/como-funciona/templates/HowItWorksTemplate";

const title = "Cómo funciona Fudia | IA nutricional en 3 pasos";
const description =
  "Conoce cómo funciona Fudia: captura tu comida por foto, voz o texto, deja que la IA analice tus datos en segundos y mejora tus hábitos con insights claros y accionables.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "como funciona fudia",
    "registro de comida",
    "analisis nutricional IA",
    "app nutricion",
    "OpenAI Vision",
    "GPT-4o",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/media/step1-salad.webp",
        width: 1200,
        height: 630,
        alt: "Cómo funciona Fudia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/media/step1-salad.webp"],
  },
};

export default function ComoFuncionaPage() {
  return <HowItWorksTemplate />;
}

