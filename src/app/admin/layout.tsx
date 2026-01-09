import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import React from "react";
import LogoutButton from "@/components/LogoutButton";
import ChangePasswordLink from "@/components/ChangePasswordLink";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Strict role-based access control
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header Bar */}
      <header className="w-full bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <ChangePasswordLink />
          <LogoutButton />
        </div>
      </header>

      {/* Page Content */}
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}
