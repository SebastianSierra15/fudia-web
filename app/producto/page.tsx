import type { Metadata } from "next";
import { ProductTemplate } from "@/src/components/producto/templates/ProductTemplate";

const title = "Producto Fudia | IA para comer mejor";
const description =
  "Descubre el producto de Fudia: escaner de comida con IA, registro por voz, dashboard nutricional y analisis rapido para mejorar tus habitos alimenticios todos los dias.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "producto fudia",
    "nutricion con IA",
    "escaner de comida",
    "registro por voz",
    "dashboard nutricional",
    "analisis de alimentos",
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
        url: "/media/price-food.webp",
        width: 1200,
        height: 630,
        alt: "Producto Fudia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/media/price-food.webp"],
  },
};

export default function ProductoPage() {
  return <ProductTemplate />;
}
