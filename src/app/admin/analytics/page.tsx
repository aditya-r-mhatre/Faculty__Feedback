"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { generateFeedbackPDF } from "@/lib/pdf-generator";

export default function AdminAnalytics() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const [depts, setDepts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    deptId: "",
    program: "",
    year: "",
    feedbackType: "",
    courseId: "",
    facultyId: "",
    facultyName: "",
    division: "",
    batch: ""
  });

  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [selectedComments, setSelectedComments] = useState<any[]>([]);

  // Load departments and faculty
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

  // Load courses when dept and program are selected
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

  // Fetch analytics with filters
  const loadAnalytics = () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filters.deptId) qs.set("deptId", filters.deptId);
    if (filters.program) qs.set("program", filters.program);
    if (filters.year) qs.set("year", filters.year);
    if (filters.feedbackType) qs.set("feedbackType", filters.feedbackType);
    if (filters.courseId) qs.set("courseId", filters.courseId);
    if (filters.facultyId) qs.set("facultyId", filters.facultyId);
    if (filters.facultyName) qs.set("facultyName", filters.facultyName);
    if (filters.division) qs.set("division", filters.division);
    if (filters.batch) qs.set("batch", filters.batch);

    fetch("/api/admin/analytics?" + qs.toString())
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading && stats.length === 0) {
    return (
      <div className="p-12 text-center text-gray-600 font-medium">
        Loading Analytics…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* PAGE HEADER */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">
          Faculty Performance Analytics
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          View feedback analytics across all departments with filters
        </p>
      </div>

      {/* FILTER BAR */}
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
              <option value="">All Departments</option>
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
              <option value="">All Programs</option>
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
              <option value="">All Years</option>
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
              <option value="">All Types</option>
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
              <option value="">All Courses</option>
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
              <option value="">All Faculty</option>
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
              <option value="">All Divisions</option>
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
              <option value="">All Batches</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadAnalytics}
              className="w-full h-10 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid gap-6">
        {stats.length > 0 ? (
          stats.map((item: any) => {
            const avg =
              item.overallAverage ??
              item.averageRating ??
              0;

            const progress = Math.round((avg / 5) * 100);

            const barColor =
              avg >= 4
                ? "bg-green-500"
                : avg >= 3
                ? "bg-indigo-500"
                : "bg-yellow-500";

            return (
              <div
                key={item.formId || item._id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                {/* TOP */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900">
                      {item.title || "Unnamed Form"}
                    </h3>

                    <p className="text-gray-600 font-medium">
                      Course: {item.courseName || item.courseId?.courseName || "N/A"} · 
                      Type: {item.feedbackType?.replace('_', ' ') || "N/A"}
                    </p>
                    {item.facultyName && (
                      <p className="text-gray-600 font-medium">
                        Faculty: {item.facultyName}
                      </p>
                    )}

                    <div className="flex gap-2 mt-1">
                      <span className="inline-block text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                        Submissions: {item.totalSubmissions}
                      </span>
                      {item.targets && item.targets.length > 0 && (
                        <span className="inline-block text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                          Targets: {item.targets.length} division(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-extrabold text-indigo-700">
                      {avg.toFixed(2)}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">
                      Average Score
                    </div>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-gray-500">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`${barColor} h-3 rounded-full transition-all duration-700`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* QUESTIONS - Section-wise for MSE/ESE */}
                {(item.feedbackType === "MSE_FEEDBACK" || item.feedbackType === "ESE_FEEDBACK") ? (
                  <div className="mt-4 space-y-6">
                    {/* Lecture Section */}
                    {item.lectureResponseCount > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-gray-600">
                            Lecture Section (Theory)
                          </h4>
                          <span className="text-xs text-gray-500">
                            Responses: {item.lectureResponseCount} | Average: {item.lectureAverage?.toFixed(2) || '0.00'}%
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.perQuestionAverages
                            ?.filter((q: any) => q.key.startsWith('lecture_'))
                            .map((q: any, idx: number) => {
                              const index = parseInt(q.key.split('_')[1] || '0', 10);
                              const question = item.questions?.find((q: any) => q.section === 'lecture' && q.index === index);
                              return (
                                <div
                                  key={q.key}
                                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                                >
                                  <span className="text-sm text-gray-700">
                                    {question?.questionText || `Lecture Q${index + 1}`}
                                  </span>
                                  <span className="text-sm font-bold text-indigo-600">
                                    {(q.percentage || q.avg * 20).toFixed(2)}%
                                  </span>
                                </div>
                              );
                            })}
                          {item.lectureAverage > 0 && (
                            <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border-2 border-indigo-200">
                              <span className="text-sm font-bold text-gray-800">
                                Average (Theory)
                              </span>
                              <span className="text-sm font-bold text-indigo-700">
                                {item.lectureAverage.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lab Section */}
                    {item.labResponseCount > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-gray-600">
                            Lab Section
                          </h4>
                          <span className="text-xs text-gray-500">
                            Responses: {item.labResponseCount} | Average: {item.labAverage?.toFixed(2) || '0.00'}%
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.perQuestionAverages
                            ?.filter((q: any) => q.key.startsWith('lab_'))
                            .map((q: any, idx: number) => {
                              const index = parseInt(q.key.split('_')[1] || '0', 10);
                              const question = item.questions?.find((q: any) => q.section === 'lab' && q.index === index);
                              return (
                                <div
                                  key={q.key}
                                  className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                                >
                                  <span className="text-sm text-gray-700">
                                    {question?.questionText || `Lab Q${index + 1}`}
                                  </span>
                                  <span className="text-sm font-bold text-indigo-600">
                                    {(q.percentage || q.avg * 20).toFixed(2)}%
                                  </span>
                                </div>
                              );
                            })}
                          {item.labAverage > 0 && (
                            <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border-2 border-indigo-200">
                              <span className="text-sm font-bold text-gray-800">
                                Average (Lab)
                              </span>
                              <span className="text-sm font-bold text-indigo-700">
                                {item.labAverage.toFixed(2)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">
                      Question-wise Averages
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(item.perQuestionAverages || []).map(
                        (q: any, idx: number) => {
                          const keyParts = String(q.key).split('_');
                          const section = keyParts[0];
                          const index = parseInt(keyParts[1] || '0', 10);
                          
                          let qText = `Question ${idx + 1}`;
                          if (item.questions && Array.isArray(item.questions)) {
                            const question = item.questions.find((q: any) => 
                              q.section === section && q.index === index
                            );
                            if (question) {
                              qText = question.questionText;
                            }
                          }

                          return (
                            <div
                              key={q.key || idx}
                              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                            >
                              <span className="text-sm text-gray-700">
                                {qText}
                              </span>
                              <span className="text-sm font-bold text-indigo-600">
                                {(q.percentage || q.avg * 20).toFixed(2)}%
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* COMMENTS & PDF */}
                <div className="mt-4 flex justify-between items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Comments: {(item.comments || []).length}
                  </span>

                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                      onClick={() => {
                        // Prepare PDF data
                        const lectureQuestions = item.questions
                          ?.filter((q: any) => q.section === 'lecture')
                          .map((q: any, idx: number) => {
                            const key = `lecture_${idx}`;
                            const questionData = item.perQuestionAverages?.find((pq: any) => pq.key === key);
                            return {
                              question: q.questionText,
                              percentage: questionData ? (questionData.percentage || questionData.avg * 20) : 0
                            };
                          }) || [];

                        const labQuestions = item.questions
                          ?.filter((q: any) => q.section === 'lab')
                          .map((q: any, idx: number) => {
                            const key = `lab_${idx}`;
                            const questionData = item.perQuestionAverages?.find((pq: any) => pq.key === key);
                            return {
                              question: q.questionText,
                              percentage: questionData ? (questionData.percentage || questionData.avg * 20) : 0
                            };
                          }) || [];

                        const generalQuestions = item.questions
                          ?.filter((q: any) => q.section === 'general')
                          .map((q: any, idx: number) => {
                            const key = `general_${idx}`;
                            const questionData = item.perQuestionAverages?.find((pq: any) => pq.key === key);
                            return {
                              question: q.questionText,
                              percentage: questionData ? (questionData.percentage || questionData.avg * 20) : 0
                            };
                          }) || [];

                        generateFeedbackPDF({
                          departmentName: item.deptName || 'Unknown Department',
                          feedbackTitle: item.title || 'Feedback Form',
                          academicTerm: `${item.program} - ${item.year}`,
                          facultyName: item.facultyName,
                          program: item.program,
                          year: item.year,
                          courseName: item.courseName,
                          lectureQuestions,
                          labQuestions,
                          generalQuestions,
                          lectureAverage: item.lectureAverage,
                          labAverage: item.labAverage,
                          feedbackType: item.feedbackType
                        });
                      }}
                    >
                      Download PDF
                    </button>
                    <button
                      className="px-4 py-2 bg-white text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-50 font-medium text-sm"
                      onClick={() => {
                        setSelectedComments(item.comments || []);
                        setShowCommentsFor(item.formId || item._id);
                      }}
                    >
                      View Comments
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-20 border-2 border-dashed border-gray-200 rounded-2xl text-center">
            <p className="text-gray-400 text-lg">
              No feedback responses found for the selected filters.
            </p>
          </div>
        )}
      </div>

      {/* COMMENTS MODAL */}
      {showCommentsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCommentsFor(null)}
          />
          <div className="relative bg-white rounded-xl shadow-lg w-11/12 max-w-2xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Student Comments</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCommentsFor(null)}
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-auto space-y-3">
              {selectedComments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No comments available.
                </p>
              ) : (
                selectedComments.map((c: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{c.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
