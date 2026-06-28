import type { Metadata } from "next";
import { AdminSettingsTemplate } from "@/src/components/admin/templates/AdminSettingsTemplate";

const title = "Configuracion administrativa de Fudia";
const description =
  "Panel privado para revisar parametros administrativos de Fudia, alertas internas, soporte, planes y controles operativos sin exponer datos sensibles.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Fudia admin",
    "configuracion administrativa",
    "parametros del sistema",
    "panel privado",
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
        alt: "Configuracion administrativa de Fudia",
      },
    ],
  },
};

export default function AdminSettingsPage() {
  return <AdminSettingsTemplate />;
}
