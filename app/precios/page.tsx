import type { Metadata } from "next";
import { PricingTemplate } from "@/src/components/precios/templates/PricingTemplate";

const title = "Precios Fudia | Planes para mejorar tu nutricion";
const description =
  "Conoce los planes de Fudia y elige la opcion que mejor se adapta a tus objetivos: empieza gratis o pasa a Pro para obtener analisis avanzados e insights completos.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "precios fudia",
    "plan gratuito nutrición",
    "plan pro nutrición",
    "suscripción nutrición",
    "app de alimentación",
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
        url: "/media/price-food2.webp",
        width: 1200,
        height: 630,
        alt: "Planes de precios Fudia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/media/price-food2.webp"],
  },
};

export default function PreciosPage() {
  return <PricingTemplate />;
}
