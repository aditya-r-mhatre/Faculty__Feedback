"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function FacultyDashboard() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          setLoading(true);
          const res = await fetch("/api/faculty/analytics", {
            method: "GET",
            cache: "no-store"
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            setAnalytics(data);
          }
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-black">Faculty Dashboard</h2>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-black mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-black">Faculty Dashboard</h2>
        <p className="text-slate-600 mt-2">View your subject feedback analytics</p>
      </div>

      {session?.user && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm text-black">
            <strong>Welcome:</strong> {session.user.username}
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <p className="text-black mt-2">Loading analytics...</p>
          </div>
        ) : analytics.length === 0 ? (
          <div className="p-20 border-2 border-dashed border-gray-200 rounded-2xl text-center">
            <p className="text-black text-lg">No feedback responses found yet.</p>
          </div>
        ) : (
          analytics.map((item: any) => (
            <div key={item._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-black capitalize">
                    {item.subjectName || "Unnamed Subject"}
                  </h3>
                  <p className="text-black font-medium">Class: {item.classYear} - Division {item.division}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-black">
                      Submissions: {item.totalSubmissions}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-indigo-600">
                    {Number(item.averageRating).toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Rating</p>
                </div>
              </div>
              
              {/* Performance Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-black">
                  <span>Progress</span>
                  <span>{Math.round((item.averageRating / 5) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${(item.averageRating / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
