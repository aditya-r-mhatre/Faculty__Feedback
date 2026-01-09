"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupDept() {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/dept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      alert("Department created successfully!");
      router.push("/admin/dashboard");
    } else {
      const err = await res.json();
      alert("Failed: " + (err?.error || "Unknown error"));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow-lg border-t-4 border-indigo-600">
      <h2 className="text-2xl font-bold mb-6 text-black">Create Department</h2>
      <form onSubmit={handleCreateDept} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-1 text-black">Department Name</label>
          <input 
            type="text" 
            required 
            className="w-full border p-2 rounded text-black"
            placeholder="e.g. Computer Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button className="w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700">
          Create Department
        </button>
      </form>
    </div>
  );
}
