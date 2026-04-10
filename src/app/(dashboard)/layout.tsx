import { redirect } from "next/navigation";
import MobileSidebar from "@/components/layout/MobileSidebar";
import Sidebar from "@/components/layout/Sidebar";
import { getServerSession } from "@/lib/auth-helpers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const user = { name: session.user.name, email: session.user.email };

  return (
    <div className="relative z-10 flex min-h-screen bg-transparent">
      <div className="hidden md:flex">
        <Sidebar role={role} user={user} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <MobileSidebar role={role} user={user} />

        <div className="px-4 py-6 md:px-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
