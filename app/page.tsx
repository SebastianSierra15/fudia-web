import type { Metadata } from "next";
import { HomeTemplate } from "@/src/components/home/templates/HomeTemplate";

const title = "Fudia | Nutricion IA para comer mejor cada dia";
const description =
  "Fudia es tu nutricionista con IA: registra comidas, analiza habitos y recibe planes personalizados con recordatorios inteligentes para mantenerte constante y mejorar tu salud.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "nutricion",
    "IA",
    "planes alimenticios",
    "analisis nutricional",
    "habitos saludables",
    "Fudia",
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
        url: "/global/fudia_logo.png",
        width: 1200,
        height: 630,
        alt: "Fudia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/global/fudia_logo.png"],
  },
};

export default function Home() {
  return <HomeTemplate />;
}
