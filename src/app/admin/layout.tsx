import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminMobileNav from "@/components/layout/AdminMobileNav";
import AdminMobileBlock from "@/components/admin/AdminMobileBlock";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <>
      <AdminMobileBlock />
      <div className="min-h-screen">
        <AdminMobileNav />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </>
  );
}
