import type { Metadata } from "next";
import { AdminAiTemplate } from "@/src/components/admin/templates/AdminAiTemplate";

const title = "Uso y costos de inteligencia artificial";
const description =
  "Panel administrativo privado de Fudia para consultar consumo de OpenAI, costos por proyecto, presupuesto mensual y telemetria de ejecuciones IA en Appwrite.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Fudia admin",
    "uso de inteligencia artificial",
    "costos OpenAI",
    "telemetria Appwrite",
  ],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title,
    description,
    images: [
      {
        url: "/global/fudia_logo.png",
        width: 1200,
        height: 630,
        alt: "Panel de uso de IA de Fudia",
      },
    ],
  },
};

export default function AdminAiPage() {
  return <AdminAiTemplate />;
}
