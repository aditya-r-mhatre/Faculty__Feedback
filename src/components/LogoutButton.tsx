"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function LogoutButton() {
  const router = useRouter();

  const performLogout = async () => {
    try {
      // Clear client-side storage
      if (typeof window !== "undefined") {
        try { sessionStorage.clear(); } catch (e) { /* ignore */ }
        try { localStorage.removeItem('persist'); } catch (e) { /* ignore */ }
      }

      // Terminate NextAuth session (no automatic redirect)
      await signOut({ redirect: false });

      // Replace history entry and navigate to login to avoid back navigation
      router.replace("/login");

      // Force a full navigation to ensure all client state is reset
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout error:", err);
      router.replace("/login");
    }
  };


  return (
    <button
      onClick={performLogout}
      className="px-3 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
      aria-label="Logout"
    >
      Logout
    </button>
  );
}
