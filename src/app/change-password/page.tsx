"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get('next') || '/';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      alert('Password changed successfully');
      router.push(next || '/');
    } catch (e: any) {
      alert('Error: ' + (e.message || e));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-6">Change Password</h2>

        <form onSubmit={submit} className="space-y-4 bg-white text-gray-800 p-6 rounded-xl shadow border border-gray-200">
          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e=>setCurrentPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-800 p-2 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e=>setNewPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-800 p-2 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e=>setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-800 p-2 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'} bg-blue-600 text-white font-semibold rounded-lg shadow-md`}
            >
              {loading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
