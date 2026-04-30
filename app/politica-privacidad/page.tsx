import type { Metadata } from "next";
import { PrivacyPolicyTemplate } from "@/src/components/politica-privacidad/templates/PrivacyPolicyTemplate";

const title = "Politica de Privacidad Fudia | Uso y proteccion de datos";
const description =
  "Consulta la politica de privacidad de Fudia: como recopilamos, usamos y protegemos tu informacion personal y nutricional para ofrecer una experiencia segura, transparente y enfocada en tu bienestar.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "politica de privacidad fudia",
    "privacidad de datos",
    "proteccion de informacion",
    "datos nutricionales",
    "seguridad en fudia",
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
        alt: "Politica de Privacidad Fudia",
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

export default function PoliticaPrivacidadPage() {
  return <PrivacyPolicyTemplate />;
}

