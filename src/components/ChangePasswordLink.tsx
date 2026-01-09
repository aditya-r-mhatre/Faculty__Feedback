"use client";
import { useRouter } from "next/navigation";
import React from "react";

export default function ChangePasswordLink() {
  const router = useRouter();

  const handle = () => {
    try {
      const next = window.location.pathname + window.location.search;
      router.push(`/change-password?next=${encodeURIComponent(next)}`);
    } catch (e) {
      router.push('/change-password');
    }
  };

  return (
    <button onClick={handle} className="px-3 py-1 bg-yellow-400 text-black rounded">
      Change Password
    </button>
  );
}
