import type { Metadata } from "next";
import { AdminTemplate } from "@/src/components/admin/templates/AdminTemplate";

const title = "Panel de administracion de Fudia";
const description =
  "Acceso administrativo para controlar modulos internos de Fudia y preparar metricas de negocio con permisos por rol.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminTemplate />;
}
