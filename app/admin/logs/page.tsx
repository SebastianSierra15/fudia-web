import type { Metadata } from "next";
import { AdminLogsTemplate } from "@/src/components/admin/templates/AdminLogsTemplate";

const title = "Logs administrativos";
const description =
  "Panel administrativo privado de Fudia para consultar ejecuciones, errores y eventos tecnicos normalizados de Appwrite, web y mobile.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Fudia admin",
    "logs Appwrite",
    "observabilidad Fudia",
    "Sentry Fudia",
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
        alt: "Panel de logs de Fudia",
      },
    ],
  },
};

export default function AdminLogsPage() {
  return <AdminLogsTemplate />;
}
