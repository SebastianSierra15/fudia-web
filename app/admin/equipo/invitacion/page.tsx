import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTeamInvitationTemplate } from "@/src/components/admin/templates/AdminTeamInvitationTemplate";

const title = "Invitacion al equipo Fudia";
const description =
  "Pantalla privada para aceptar invitaciones al equipo administrativo de Fudia.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
};

export default function AdminTeamInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AdminTeamInvitationTemplate />
    </Suspense>
  );
}
