import type { Metadata } from "next";
import { LoginTemplate } from "@/src/components/login/templates/LoginTemplate";

const title = "Iniciar sesion en Fudia | Accede a tu cuenta";
const description =
  "Entra a Fudia para registrar tus comidas, revisar tus metricas nutricionales y continuar tu progreso diario con recomendaciones personalizadas de IA.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "iniciar sesion fudia",
    "login fudia",
    "cuenta fudia",
    "nutricion con ia",
    "acceso fudia",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/global/fudia_logo.png",
        width: 1200,
        height: 630,
        alt: "Iniciar sesion en Fudia",
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

export default function LoginPage() {
  return <LoginTemplate />;
}

