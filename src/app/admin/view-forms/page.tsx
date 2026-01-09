"use client";
import { useEffect, useState } from "react";

export default function ViewForms() {
  const [forms, setForms] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    deptId: "",
    program: "",
    year: "",
    feedbackType: "",
    facultyId: "",
    facultyName: "",
    courseId: "",
    division: "",
    batch: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dept")
      .then((r) => r.json())
      .then((d) => setDepts(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/admin/faculty")
      .then((r) => r.json())
      .then((f) => setFaculty(Array.isArray(f) ? f : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.deptId && filters.program) {
      fetch(`/api/admin/courses?deptId=${filters.deptId}&program=${filters.program}`)
        .then((r) => r.json())
        .then((c) => setCourses(Array.isArray(c) ? c : []))
        .catch(() => {});
    } else {
      setCourses([]);
    }
  }, [filters.deptId, filters.program]);

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filters.deptId) qs.set("deptId", filters.deptId);
    if (filters.program) qs.set("program", filters.program);
    if (filters.year) qs.set("year", filters.year);
    if (filters.feedbackType) qs.set("feedbackType", filters.feedbackType);
    if (filters.facultyId) qs.set("facultyId", filters.facultyId);
    if (filters.facultyName) qs.set("facultyName", filters.facultyName);
    if (filters.courseId) qs.set("courseId", filters.courseId);
    if (filters.division) qs.set("division", filters.division);
    if (filters.batch) qs.set("batch", filters.batch);

    const res = await fetch("/api/admin/forms?" + qs.toString());
    const data = await res.json();
    setForms(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch("/api/admin/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !current }),
    });

    if (res.ok) {
      load();
    } else {
      const err = await res.json();
      alert("Failed: " + (err?.error || "Unknown error"));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Manage Feedback Forms
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        View, filter, and activate feedback forms across departments.
      </p>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.deptId}
              onChange={(e) => setFilters({ ...filters, deptId: e.target.value, program: "", courseId: "" })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="">All</option>
              {depts.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program
            </label>
            <select
              value={filters.program}
              onChange={(e) => setFilters({ ...filters, program: e.target.value, courseId: "" })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="">All</option>
              <option value="BTECH">B.Tech</option>
              <option value="MTECH">M.Tech</option>
              <option value="MCA">MCA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="">All</option>
              <option value="FE">FE</option>
              <option value="SE">SE</option>
              <option value="TE">TE</option>
              <option value="BE">BE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback Type
            </label>
            <select
              value={filters.feedbackType}
              onChange={(e) => setFilters({ ...filters, feedbackType: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="">All</option>
              <option value="MSE_FEEDBACK">MSE Feedback</option>
              <option value="ESE_FEEDBACK">ESE Feedback</option>
              <option value="COURSE_EXIT">Course Exit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              disabled={!filters.deptId || !filters.program}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black disabled:opacity-50"
            >
              <option value="">All</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.courseCode} - {c.courseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Faculty ID
            </label>
            <select
              value={filters.facultyId}
              onChange={(e) => setFilters({ ...filters, facultyId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="">All</option>
              {faculty.map((f) => (
                <option key={f._id} value={f.facultyId}>
                  {f.facultyId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Faculty Name
            </label>
            <input
              type="text"
              placeholder="Search by name"
              value={filters.facultyName}
              onChange={(e) => setFilters({ ...filters, facultyName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Division
            </label>
            <select
              value={filters.division}
              onChange={(e) => setFilters({ ...filters, division: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch
            </label>
            <select
              value={filters.batch}
              onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-black"
            >
              <option value="">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={load}
              className="w-full h-10 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-gray-600">Loading feedback forms…</div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-500">
          No feedback forms found.
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((f) => (
            <div
              key={f._id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Type: <span className="font-medium">{f.feedbackType?.replace('_', ' ')}</span> · 
                  Course: <span className="font-medium">{f.courseId?.courseCode || f.courseName || "N/A"}</span> · 
                  Program: {f.program} · Year: {f.year} · Dept: {f.deptId?.name || "N/A"}
                </p>
                {f.facultyName && (
                  <p className="text-sm text-gray-500 mt-1">
                    Faculty: {f.facultyName} {f.facultyId ? `(${f.facultyId})` : ''}
                  </p>
                )}

                {/* Section-wise targets for MSE/ESE */}
                {(f.feedbackType === "MSE_FEEDBACK" || f.feedbackType === "ESE_FEEDBACK") ? (
                  <div className="mt-1 space-y-1 text-xs text-gray-400">
                    {f.lectureTargets && f.lectureTargets.length > 0 && (
                      <p>
                        Lecture Targets:{" "}
                        {f.lectureTargets.map((t: any) =>
                          `Div ${t.division} (${!t.batches || t.batches.length === 0 ? 'All' : t.batches.join(',')})`
                        ).join(', ')}
                      </p>
                    )}
                    {f.labTargets && f.labTargets.length > 0 && (
                      <p>
                        Lab Targets:{" "}
                        {f.labTargets.map((t: any) =>
                          `Div ${t.division} (${!t.batches || t.batches.length === 0 ? 'All' : t.batches.join(',')})`
                        ).join(', ')}
                      </p>
                    )}
                    {/* Backward compatibility: if no section targets, show legacy targets */}
                    {(!f.lectureTargets || f.lectureTargets.length === 0) &&
                     (!f.labTargets || f.labTargets.length === 0) &&
                     f.targets && f.targets.length > 0 && (
                      <p>
                        Targets:{" "}
                        {f.targets.map((t: any) =>
                          `Div ${t.division} (${!t.batches || t.batches.length === 0 ? 'All' : t.batches.join(',')})`
                        ).join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  f.targets && f.targets.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Targets:{" "}
                      {f.targets.map((t: any) =>
                        `Div ${t.division} (${!t.batches || t.batches.length === 0 ? 'All' : t.batches.join(',')})`
                      ).join(', ')}
                    </p>
                  )
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    f.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {f.isActive ? "Active" : "Inactive"}
                </span>

                <button
                  onClick={() => toggleActive(f._id, f.isActive)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                  Toggle Active
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
