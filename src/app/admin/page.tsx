import type { Metadata } from "next";
import { isAdminSession } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atelier Admin | Reshma's Needle",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authenticated = await isAdminSession();
  return authenticated ? <AdminDashboard /> : <AdminLogin />;
}
