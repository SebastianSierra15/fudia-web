import type { Metadata } from "next";
import { AdminTeamTemplate } from "@/src/components/admin/templates/AdminTeamTemplate";

const title = "Equipo administrativo de Fudia";
const description =
  "Panel privado de Fudia para consultar administradores del portal, invitaciones pendientes y roles visuales del equipo.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
};

export default function AdminTeamPage() {
  return <AdminTeamTemplate />;
}
