"use client";
import { useEffect, useState } from "react";

export default function ViewDepartments() {
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/dept")
      .then((r) => r.json())
      .then((deptsRes) => {
        setDepts(Array.isArray(deptsRes) ? deptsRes : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-600">Loading departments…</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Departments
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        View all departments.
      </p>

      {/* Empty State */}
      {depts.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-500">
          No departments found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                  Department Name
                </th>
              </tr>
            </thead>

            <tbody>
              {depts.map((d) => (
                <tr
                  key={d._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {d.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
