"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
    } else {
      // Small delay to let session sync, then redirect
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      
      const role = session?.user?.role;
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "STUDENT") router.push("/student/dashboard");
      else router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-xl w-96 border-t-4 border-indigo-600">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Feedback System Login</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded">{error}</p>}
        <div className="space-y-4">
          <input 
            type="text" placeholder="Username/Email/UID" required
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none text-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-indigo-400 outline-none text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 transition">
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}