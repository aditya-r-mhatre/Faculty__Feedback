import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ChangePasswordLink from "@/components/ChangePasswordLink";
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-emerald-600 text-white p-4 flex justify-between items-center">
        <div>
          <span className="font-bold">Student Feedback Portal</span>
          <span className="ml-4">{session.user.username} (Div {session.user.division})</span>
        </div>
        <div className="flex items-center gap-2">
          <ChangePasswordLink />
          <LogoutButton />
        </div>
      </nav>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}