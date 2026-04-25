import type { Metadata } from "next";
import { LoginTemplate } from "@/src/components/login/templates/LoginTemplate";

const title = "Iniciar sesión en Fudia | Accede a tu cuenta";
const description =
  "Entra a Fudia para registrar tus comidas, revisar tus metricas nutricionales y continuar tu progreso diario con recomendaciones personalizadas de IA.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "iniciar sesión fudia",
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
        alt: "Iniciar sesión en Fudia",
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

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    toast?: string | string[];
  }>;
};

function getFirstParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <LoginTemplate
      initialNext={getFirstParamValue(resolvedSearchParams?.next)}
      initialToast={getFirstParamValue(resolvedSearchParams?.toast)}
    />
  );
}
