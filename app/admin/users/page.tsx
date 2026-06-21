import type { Metadata } from "next";
import { AdminUsersTemplate } from "@/src/components/admin/templates/AdminUsersTemplate";

const title = "Usuarios administrativos de Fudia";
const description = "Panel privado de Fudia para consultar usuarios, actividad mensual, onboarding y ajustes manuales de acceso.";

export const metadata: Metadata = { title, description, robots: { index: false, follow: false } };

export default function AdminUsersPage() { return <AdminUsersTemplate />; }
