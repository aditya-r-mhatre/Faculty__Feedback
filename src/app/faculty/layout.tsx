import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import React from "react";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Strict role-based access control
  if (!session || session.user.role !== "FACULTY") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
