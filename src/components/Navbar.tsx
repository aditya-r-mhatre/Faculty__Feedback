import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // If not logged in, send to login
  if (!session) {
    redirect("/login");
  }

  // Role-based auto-redirection
  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin/dashboard");
    case "HOD":
      redirect("/hod/analytics");
    case "STUDENT":
      redirect("/student/dashboard");
    default:
      redirect("/login");
  }
}