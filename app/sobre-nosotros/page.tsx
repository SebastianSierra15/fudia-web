import type { Metadata } from "next";
import { AboutTemplate } from "@/src/components/sobre-nosotros/templates/AboutTemplate";

const title = "Sobre Nosotros Fudia | Equipo y mision nutricional IA";
const description =
  "Conoce la historia de Fudia, el equipo fundador y los principios que guian nuestra forma de construir tecnologia nutricional con IA para transformar habitos de alimentacion en Latinoamerica.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "sobre nosotros fudia",
    "equipo fundador fudia",
    "mision de fudia",
    "nutricion con IA",
    "historia de fudia",
    "startup de nutricion",
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
        url: "/global/fudia_logofull_blanco.png",
        width: 1200,
        height: 630,
        alt: "Sobre nosotros Fudia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/global/fudia_logofull_blanco.png"],
  },
};

export default function SobreNosotrosPage() {
  return <AboutTemplate />;
}
