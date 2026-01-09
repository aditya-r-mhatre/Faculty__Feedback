import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  // If NOT logged in, immediately show the login UI via redirect
  if (!session) {
    redirect("/login");
  }

  // If already logged in, send them to their specific dashboard
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");
  if (session.user.role === "STUDENT") redirect("/student/dashboard");

  redirect("/login");
}