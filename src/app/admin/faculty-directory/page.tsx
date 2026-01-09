"use client";
import { useState, useEffect } from "react";

export default function FacultyDirectory() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    facultyId: "",
    name: "",
    dept: ""
  });

  useEffect(() => {
    fetch("/api/admin/dept")
      .then((r) => r.json())
      .then((d) => setDepts(Array.isArray(d) ? d : []))
      .catch(() => {});
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) {
      qs.set("search", search);
    }
    const res = await fetch("/api/admin/faculty?" + qs.toString());
    const data = await res.json();
    setFaculty(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadFaculty();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleAdd = async () => {
    if (!newFaculty.facultyId || !newFaculty.name || !newFaculty.dept) {
      alert("Please fill all fields");
      return;
    }

    const res = await fetch("/api/admin/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newFaculty)
    });

    if (res.ok) {
      alert("Faculty added successfully!");
      setShowAddModal(false);
      setNewFaculty({ facultyId: "", name: "", dept: "" });
      loadFaculty();
    } else {
      const err = await res.json();
      alert("Failed: " + (err?.error || "Unknown error"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this faculty?")) return;

    const res = await fetch(`/api/admin/faculty?id=${id}`, {
      method: "DELETE"
    });

    if (res.ok) {
      alert("Faculty deleted successfully!");
      loadFaculty();
    } else {
      const err = await res.json();
      alert("Failed: " + (err?.error || "Unknown error"));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Faculty Directory</h1>
          <p className="text-sm text-gray-600">Add and manage faculty members</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          Add Faculty
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <input
          type="text"
          placeholder="Search by Faculty ID or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
        />
      </div>

      {/* Faculty Table */}
      {loading ? (
        <div className="text-gray-600">Loading faculty...</div>
      ) : faculty.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-500">
          No faculty found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faculty.map((f) => (
                <tr key={f._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{f.facultyId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{f.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.dept?.name || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(f._id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-lg w-11/12 max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Faculty</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty ID</label>
                <input
                  type="text"
                  value={newFaculty.facultyId}
                  onChange={(e) => setNewFaculty({ ...newFaculty, facultyId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                  placeholder="e.g., FAC001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                  placeholder="Faculty Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={newFaculty.dept}
                  onChange={(e) => setNewFaculty({ ...newFaculty, dept: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="">Select Department</option>
                  {depts.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
