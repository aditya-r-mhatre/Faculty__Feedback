"use client";
import { useState, useEffect } from "react";

export default function ManageStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState<"uid" | "email" | "name">("uid");
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editForm, setEditForm] = useState({
    year: "",
    program: "",
    dept: "",
    division: "",
    batch: ""
  });
  const [createForm, setCreateForm] = useState({
    uid: "",
    name: "",
    email: "",
    password: "",
    year: "",
    program: "",
    dept: "",
    division: "",
    batch: ""
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  
  // Bulk creation state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2>(1);
  const [emailCsvs, setEmailCsvs] = useState<any[]>([]);
  const [emailCsvFile, setEmailCsvFile] = useState<File | null>(null);
  const [emailCsvLabel, setEmailCsvLabel] = useState("");
  const [studentCsvFile, setStudentCsvFile] = useState<File | null>(null);
  const [bulkMetadata, setBulkMetadata] = useState({
    emailCsvId: "",
    program: "",
    dept: "",
    year: "",
    division: ""
  });
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dept")
      .then((r) => r.json())
      .then((d) => setDepts(Array.isArray(d) ? d : []))
      .catch(() => {});
    loadStudents();
    loadEmailCsvs();
  }, []);

  const loadEmailCsvs = async () => {
    try {
      const res = await fetch("/api/admin/email-csv");
      const data = await res.json();
      setEmailCsvs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load email CSVs:", error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) {
      qs.set("search", search);
      qs.set("searchBy", searchBy);
    }
    const res = await fetch("/api/admin/students?" + qs.toString());
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadStudents();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, searchBy]);

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      year: student.year || "",
      program: student.program || "",
      dept: student.dept?._id || student.dept || "",
      division: student.division || "",
      batch: student.batch || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;

    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingStudent._id,
        year: editForm.year,
        program: editForm.program,
        dept: editForm.dept,
        division: editForm.division,
        batch: editForm.batch
      })
    });

    if (res.ok) {
      alert("Student updated successfully!");
      setEditingStudent(null);
      loadStudents();
    } else {
      const err = await res.json();
      alert("Failed: " + (err?.error || "Unknown error"));
    }
  };

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!createForm.uid.trim()) errors.uid = "UID is required";
    if (!createForm.name.trim()) errors.name = "Name is required";
    if (!createForm.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errors.email = "Invalid email format";
    if (!createForm.password.trim()) errors.password = "Password is required";
    else if (createForm.password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!createForm.year) errors.year = "Year is required";
    if (!createForm.program) errors.program = "Program is required";
    if (!createForm.dept) errors.dept = "Department is required";
    if (!createForm.division) errors.division = "Division is required";
    if (!createForm.batch) errors.batch = "Batch is required";

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStudent = async () => {
    if (!validateCreateForm()) return;

    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm)
    });

    if (res.ok) {
      alert("Student created successfully!");
      setShowCreateModal(false);
      setCreateForm({
        uid: "",
        name: "",
        email: "",
        password: "",
        year: "",
        program: "",
        dept: "",
        division: "",
        batch: ""
      });
      setCreateErrors({});
      loadStudents();
    } else {
      const err = await res.json();
      const errorMsg = err?.error || "Unknown error";
      alert("Failed: " + errorMsg);
      // Set specific error if it's about uniqueness
      if (errorMsg.includes("UID")) {
        setCreateErrors({ uid: errorMsg });
      } else if (errorMsg.includes("email")) {
        setCreateErrors({ email: errorMsg });
      }
    }
  };

  const handleUploadEmailCsv = async () => {
    if (!emailCsvFile) {
      alert("Please select a CSV file");
      return;
    }

    setBulkLoading(true);
    const formData = new FormData();
    formData.append("file", emailCsvFile);
    if (emailCsvLabel.trim()) {
      formData.append("label", emailCsvLabel.trim());
    }

    try {
      const res = await fetch("/api/admin/email-csv", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        alert("Email CSV uploaded successfully!");
        setEmailCsvFile(null);
        setEmailCsvLabel("");
        loadEmailCsvs();
      } else {
        const err = await res.json();
        alert("Failed: " + (err?.error || "Unknown error"));
      }
    } catch (error) {
      alert("Failed to upload email CSV");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteEmailCsv = async (id: string) => {
    if (!confirm("Are you sure you want to delete this email CSV? This will not delete any students.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/email-csv/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert("Email CSV deleted successfully!");
        loadEmailCsvs();
        if (bulkMetadata.emailCsvId === id) {
          setBulkMetadata({ ...bulkMetadata, emailCsvId: "" });
        }
      } else {
        const err = await res.json();
        alert("Failed: " + (err?.error || "Unknown error"));
      }
    } catch (error) {
      alert("Failed to delete email CSV");
    }
  };

  const handleBulkCreate = async () => {
    if (!studentCsvFile) {
      alert("Please select a Student CSV file");
      return;
    }

    if (!bulkMetadata.emailCsvId || !bulkMetadata.program || !bulkMetadata.dept || !bulkMetadata.year || !bulkMetadata.division) {
      alert("Please fill all metadata fields");
      return;
    }

    setBulkLoading(true);
    const formData = new FormData();
    formData.append("file", studentCsvFile);
    formData.append("emailCsvId", bulkMetadata.emailCsvId);
    formData.append("program", bulkMetadata.program);
    formData.append("dept", bulkMetadata.dept);
    formData.append("year", bulkMetadata.year);
    formData.append("division", bulkMetadata.division);

    try {
      const res = await fetch("/api/admin/bulk-create-students", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      
      if (res.ok) {
        setBulkResult(data.summary);
        loadStudents();
      } else {
        alert("Failed: " + (data?.error || "Unknown error"));
      }
    } catch (error) {
      alert("Failed to process bulk creation");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Manage Students</h1>
          <p className="text-sm text-gray-600">Search and edit student details</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Create Student
          </button>
          <button
            onClick={() => {
              setShowBulkModal(true);
              setBulkStep(1);
              setBulkResult(null);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Bulk Create Students
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Enter UID, Email, or Name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search By
            </label>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as "uid" | "email" | "name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="uid">UID</option>
              <option value="email">Email</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadStudents}
              className="w-full h-10 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="text-gray-600">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-500">
          No students found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.uid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.program || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.dept?.name || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.division}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.batch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditingStudent(null)}
          />
          <div className="relative bg-white rounded-xl shadow-lg w-11/12 max-w-md p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Student</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setEditingStudent(null)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="">Select Year</option>
                  <option value="FE">FE</option>
                  <option value="SE">SE</option>
                  <option value="TE">TE</option>
                  <option value="BE">BE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={editForm.program}
                  onChange={(e) => setEditForm({ ...editForm, program: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="">Select Program</option>
                  <option value="BTECH">B.Tech</option>
                  <option value="MTECH">M.Tech</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={editForm.dept}
                  onChange={(e) => setEditForm({ ...editForm, dept: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                <select
                  value={editForm.division}
                  onChange={(e) => setEditForm({ ...editForm, division: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="">Select Division</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <select
                  value={editForm.batch}
                  onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                >
                  <option value="">Select Batch</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowCreateModal(false);
              setCreateErrors({});
            }}
          />
          <div className="relative bg-white rounded-xl shadow-lg w-11/12 max-w-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Student</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateErrors({});
                }}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.uid}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, uid: e.target.value });
                    if (createErrors.uid) setCreateErrors({ ...createErrors, uid: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.uid ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                  placeholder="e.g., SE-CE-BTECH-001"
                />
                {createErrors.uid && <p className="text-xs text-red-500 mt-1">{createErrors.uid}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, name: e.target.value });
                    if (createErrors.name) setCreateErrors({ ...createErrors, name: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.name ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                  placeholder="Full Name"
                />
                {createErrors.name && <p className="text-xs text-red-500 mt-1">{createErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, email: e.target.value });
                    if (createErrors.email) setCreateErrors({ ...createErrors, email: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.email ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                  placeholder="student@example.com"
                />
                {createErrors.email && <p className="text-xs text-red-500 mt-1">{createErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, password: e.target.value });
                    if (createErrors.password) setCreateErrors({ ...createErrors, password: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.password ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                  placeholder="Minimum 6 characters"
                />
                {createErrors.password && <p className="text-xs text-red-500 mt-1">{createErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.program}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, program: e.target.value });
                    if (createErrors.program) setCreateErrors({ ...createErrors, program: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.program ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                >
                  <option value="">Select Program</option>
                  <option value="BTECH">B.Tech</option>
                  <option value="MTECH">M.Tech</option>
                  <option value="MCA">MCA</option>
                </select>
                {createErrors.program && <p className="text-xs text-red-500 mt-1">{createErrors.program}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.dept}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, dept: e.target.value });
                    if (createErrors.dept) setCreateErrors({ ...createErrors, dept: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.dept ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                >
                  <option value="">Select Department</option>
                  {depts.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {createErrors.dept && <p className="text-xs text-red-500 mt-1">{createErrors.dept}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.year}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, year: e.target.value });
                    if (createErrors.year) setCreateErrors({ ...createErrors, year: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.year ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                >
                  <option value="">Select Year</option>
                  <option value="FE">FE</option>
                  <option value="SE">SE</option>
                  <option value="TE">TE</option>
                  <option value="BE">BE</option>
                </select>
                {createErrors.year && <p className="text-xs text-red-500 mt-1">{createErrors.year}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.division}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, division: e.target.value });
                    if (createErrors.division) setCreateErrors({ ...createErrors, division: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.division ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                >
                  <option value="">Select Division</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                {createErrors.division && <p className="text-xs text-red-500 mt-1">{createErrors.division}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch <span className="text-red-500">*</span>
                </label>
                <select
                  value={createForm.batch}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, batch: e.target.value });
                    if (createErrors.batch) setCreateErrors({ ...createErrors, batch: "" });
                  }}
                  className={`w-full rounded-lg border ${createErrors.batch ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black`}
                >
                  <option value="">Select Batch</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                {createErrors.batch && <p className="text-xs text-red-500 mt-1">{createErrors.batch}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateStudent}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
              >
                Create Student
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateErrors({});
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!bulkLoading) {
                setShowBulkModal(false);
                setBulkStep(1);
                setBulkResult(null);
                setEmailCsvFile(null);
                setEmailCsvLabel("");
                setStudentCsvFile(null);
                setBulkMetadata({
                  emailCsvId: "",
                  program: "",
                  dept: "",
                  year: "",
                  division: ""
                });
              }
            }}
          />
          <div className="relative bg-white rounded-xl shadow-lg w-11/12 max-w-4xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Bulk Create Students {bulkStep === 1 ? "- Step 1: Upload Email CSV" : "- Step 2: Upload Student CSV"}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  if (!bulkLoading) {
                    setShowBulkModal(false);
                    setBulkStep(1);
                    setBulkResult(null);
                    setEmailCsvFile(null);
                    setEmailCsvLabel("");
                    setStudentCsvFile(null);
                    setBulkMetadata({
                      emailCsvId: "",
                      program: "",
                      dept: "",
                      year: "",
                      division: ""
                    });
                  }
                }}
                disabled={bulkLoading}
              >
                ✕
              </button>
            </div>

            {bulkResult ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Bulk Creation Summary</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <p><strong>Total Rows Processed:</strong> {bulkResult.totalRows}</p>
                    <p><strong>Students Created:</strong> {bulkResult.created}</p>
                    <p><strong>Students Skipped:</strong> {bulkResult.skipped}</p>
                  </div>
                </div>

                {bulkResult.skippedDetails && bulkResult.skippedDetails.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <h4 className="font-semibold text-yellow-800 mb-2">Skipped Students</h4>
                    <div className="space-y-1 text-xs">
                      {bulkResult.skippedDetails.slice(0, 50).map((item: any, idx: number) => (
                        <div key={idx} className="text-yellow-700">
                          <strong>{item.name}:</strong> {item.reason}
                        </div>
                      ))}
                      {bulkResult.skippedDetails.length > 50 && (
                        <p className="text-yellow-600 italic">... and {bulkResult.skippedDetails.length - 50} more</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setBulkResult(null);
                      setBulkStep(1);
                      setStudentCsvFile(null);
                      setBulkMetadata({
                        emailCsvId: "",
                        program: "",
                        dept: "",
                        year: "",
                        division: ""
                      });
                    }}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Create More
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkStep(1);
                      setBulkResult(null);
                      setEmailCsvFile(null);
                      setEmailCsvLabel("");
                      setStudentCsvFile(null);
                      setBulkMetadata({
                        emailCsvId: "",
                        program: "",
                        dept: "",
                        year: "",
                        division: ""
                      });
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : bulkStep === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email CSV File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setEmailCsvFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">CSV format: Name,Email</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={emailCsvLabel}
                    onChange={(e) => setEmailCsvLabel(e.target.value)}
                    placeholder="e.g., Batch 2024 Emails"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Uploaded Email CSVs</h4>
                  {emailCsvs.length === 0 ? (
                    <p className="text-sm text-gray-500">No email CSVs uploaded yet</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {emailCsvs.map((csv) => (
                        <div key={csv._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <div>
                            <p className="text-sm font-medium">{csv.label || csv.filename || "Untitled"}</p>
                            <p className="text-xs text-gray-500">
                              {csv.records?.length || 0} records • {new Date(csv.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteEmailCsv(csv._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleUploadEmailCsv}
                    disabled={!emailCsvFile || bulkLoading}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkLoading ? "Uploading..." : "Upload Email CSV"}
                  </button>
                  <button
                    onClick={() => {
                      if (emailCsvs.length > 0) {
                        setBulkStep(2);
                      } else {
                        alert("Please upload at least one Email CSV first");
                      }
                    }}
                    disabled={emailCsvs.length === 0}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Upload Student CSV
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkStep(1);
                      setEmailCsvFile(null);
                      setEmailCsvLabel("");
                    }}
                    disabled={bulkLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student CSV File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setStudentCsvFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    CSV format: Batch markers (A-D) as standalone rows, then uid,name rows. Example:<br/>
                    A<br/>
                    1,2024300001,Student Name<br/>
                    B<br/>
                    2,2024300002,Another Student
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email CSV Dataset <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bulkMetadata.emailCsvId}
                    onChange={(e) => setBulkMetadata({ ...bulkMetadata, emailCsvId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                  >
                    <option value="">Select Email CSV</option>
                    {emailCsvs.map((csv) => (
                      <option key={csv._id} value={csv._id}>
                        {csv.label || csv.filename || "Untitled"} ({csv.records?.length || 0} records)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bulkMetadata.program}
                      onChange={(e) => setBulkMetadata({ ...bulkMetadata, program: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                    >
                      <option value="">Select Program</option>
                      <option value="BTECH">B.Tech</option>
                      <option value="MTECH">M.Tech</option>
                      <option value="MCA">MCA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bulkMetadata.dept}
                      onChange={(e) => setBulkMetadata({ ...bulkMetadata, dept: e.target.value })}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bulkMetadata.year}
                      onChange={(e) => setBulkMetadata({ ...bulkMetadata, year: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                    >
                      <option value="">Select Year</option>
                      <option value="FE">FE</option>
                      <option value="SE">SE</option>
                      <option value="TE">TE</option>
                      <option value="BE">BE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Division <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bulkMetadata.division}
                      onChange={(e) => setBulkMetadata({ ...bulkMetadata, division: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
                    >
                      <option value="">Select Division</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setBulkStep(1)}
                    disabled={bulkLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBulkCreate}
                    disabled={!studentCsvFile || !bulkMetadata.emailCsvId || !bulkMetadata.program || !bulkMetadata.dept || !bulkMetadata.year || !bulkMetadata.division || bulkLoading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkLoading ? "Processing..." : "Create Students"}
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkStep(1);
                      setStudentCsvFile(null);
                      setBulkMetadata({
                        emailCsvId: "",
                        program: "",
                        dept: "",
                        year: "",
                        division: ""
                      });
                    }}
                    disabled={bulkLoading}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
