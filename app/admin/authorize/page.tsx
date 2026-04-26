import type { Metadata } from "next";
import { AdminAuthorizeTemplate } from "@/src/components/admin/templates/AdminAuthorizeTemplate";

const title = "Validando acceso administrativo en Fudia";
const description =
  "Validacion segura de acceso para el panel administrativo de Fudia con autenticacion y permisos por team.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
  },
};

type AdminAuthorizePageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

function getFirstParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function AdminAuthorizePage({
  searchParams,
}: AdminAuthorizePageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <AdminAuthorizeTemplate
      initialNext={getFirstParamValue(resolvedSearchParams?.next)}
    />
  );
}
