"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LECTURE_QUESTIONS, LAB_QUESTIONS, getFixedQuestionsForMSEESE } from "@/lib/feedback-questions";

export default function ManageForms() {
  const [data, setData] = useState({ depts: [], courses: [], faculty: [] });
  const [feedbackType, setFeedbackType] = useState<"MSE_FEEDBACK" | "ESE_FEEDBACK" | "COURSE_EXIT" | "">("");
  const [selections, setSelections] = useState({
    deptId: "",
    program: "",
    year: "",
    courseId: "",
    facultyId: ""
  });
  const [targets, setTargets] = useState<Array<{ division: string; batches: string[] }>>([]);
  const [lectureTargets, setLectureTargets] = useState<Array<{ division: string; batches: string[] }>>([]);
  const [labTargets, setLabTargets] = useState<Array<{ division: string; batches: string[] }>>([]);
  const [title, setTitle] = useState("");
  const [courseExitQuestions, setCourseExitQuestions] = useState([{ questionText: "", type: "rating" }]);
  const [lectureCollapsed, setLectureCollapsed] = useState(false);
  const [labCollapsed, setLabCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/dept")
      .then(res => res.json())
      .then(depts => setData(prev => ({ ...prev, depts })))
      .catch(() => console.error("Failed to load departments"));
    fetch('/api/admin/faculty')
      .then(res => res.json())
      .then(list => setData(prev => ({ ...prev, faculty: list || [] })))
      .catch(() => console.error('Failed to load faculty list'));
  }, []);

  useEffect(() => {
    if (selections.deptId && selections.program) {
      fetch(`/api/admin/courses?deptId=${selections.deptId}&program=${selections.program}`)
        .then(res => res.json())
        .then(courses => setData(prev => ({ ...prev, courses })))
        .catch(() => console.error("Failed to load courses"));
    }
  }, [selections.deptId, selections.program]);

  // Helper functions for Course Exit targets
  const addTarget = () => {
    setTargets([...targets, { division: "", batches: [] }]);
  };

  const removeTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const updateTargetDivision = (index: number, division: string) => {
    const updated = [...targets];
    updated[index].division = division;
    setTargets(updated);
  };

  const toggleBatch = (targetIndex: number, batch: string) => {
    const updated = [...targets];
    const batchIndex = updated[targetIndex].batches.indexOf(batch);
    if (batchIndex > -1) {
      updated[targetIndex].batches.splice(batchIndex, 1);
    } else {
      updated[targetIndex].batches.push(batch);
    }
    setTargets(updated);
  };

  // Helper functions for Lecture targets
  const addLectureTarget = () => {
    setLectureTargets([...lectureTargets, { division: "", batches: [] }]);
  };

  const removeLectureTarget = (index: number) => {
    setLectureTargets(lectureTargets.filter((_, i) => i !== index));
  };

  const updateLectureTargetDivision = (index: number, division: string) => {
    const updated = [...lectureTargets];
    updated[index].division = division;
    setLectureTargets(updated);
  };

  const toggleLectureBatch = (targetIndex: number, batch: string) => {
    const updated = [...lectureTargets];
    const batchIndex = updated[targetIndex].batches.indexOf(batch);
    if (batchIndex > -1) {
      updated[targetIndex].batches.splice(batchIndex, 1);
    } else {
      updated[targetIndex].batches.push(batch);
    }
    setLectureTargets(updated);
  };

  // Helper functions for Lab targets
  const addLabTarget = () => {
    setLabTargets([...labTargets, { division: "", batches: [] }]);
  };

  const removeLabTarget = (index: number) => {
    setLabTargets(labTargets.filter((_, i) => i !== index));
  };

  const updateLabTargetDivision = (index: number, division: string) => {
    const updated = [...labTargets];
    updated[index].division = division;
    setLabTargets(updated);
  };

  const toggleLabBatch = (targetIndex: number, batch: string) => {
    const updated = [...labTargets];
    const batchIndex = updated[targetIndex].batches.indexOf(batch);
    if (batchIndex > -1) {
      updated[targetIndex].batches.splice(batchIndex, 1);
    } else {
      updated[targetIndex].batches.push(batch);
    }
    setLabTargets(updated);
  };

  const addCourseExitQuestion = () => {
    setCourseExitQuestions([...courseExitQuestions, { questionText: "", type: "rating" }]);
  };

  const removeCourseExitQuestion = (index: number) => {
    if (courseExitQuestions.length > 1) {
      setCourseExitQuestions(courseExitQuestions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...courseExitQuestions];
    updated[index].questionText = value;
    setCourseExitQuestions(updated);
  };

  // Helper to generate batch selection indicator
  const getBatchIndicator = (batches: string[]) => {
    if (batches.length === 0) {
      return "All batches selected";
    }
    return `Selected batches: ${batches.sort().join(', ')}`;
  };

  // Helper to generate target summary
  const getTargetSummary = (division: string, batches: string[]) => {
    if (!division) return "";
    if (batches.length === 0) {
      return `Applies to: Division ${division} → All batches`;
    }
    return `Applies to: Division ${division} → Batches ${batches.sort().join(', ')}`;
  };

  // Check if form is valid for publishing
  const isFormValid = () => {
    if (!title || !feedbackType || !selections.deptId || !selections.program || !selections.year || !selections.courseId) {
      return false;
    }

    if (feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK") {
      if (!selections.facultyId) return false;
      // At least one section must have valid targets
      const hasValidLecture = lectureTargets.length > 0 && lectureTargets.every(t => t.division);
      const hasValidLab = labTargets.length > 0 && labTargets.every(t => t.division);
      return hasValidLecture || hasValidLab;
    }

    if (feedbackType === "COURSE_EXIT") {
      return targets.length > 0 && targets.every(t => t.division);
    }

    return true;
  };

  // Get validation message for MSE/ESE
  const getValidationMessage = () => {
    if (feedbackType !== "MSE_FEEDBACK" && feedbackType !== "ESE_FEEDBACK") return null;

    const hasValidLecture = lectureTargets.length > 0 && lectureTargets.every(t => t.division);
    const hasValidLab = labTargets.length > 0 && labTargets.every(t => t.division);

    if (!hasValidLecture && !hasValidLab) {
      return { type: 'error', text: 'Add at least one Lecture or Lab target to publish this form' };
    }

    if (hasValidLecture && !hasValidLab) {
      return { type: 'info', text: 'Only Lecture feedback will be collected' };
    }

    if (!hasValidLecture && hasValidLab) {
      return { type: 'info', text: 'Only Lab feedback will be collected' };
    }

    return null;
  };


  const handleSaveForm = async () => {
    // Validation
    if (!title || !feedbackType || !selections.deptId || !selections.program || !selections.year || !selections.courseId) {
      alert("Please complete all required fields.");
      return;
    }

    // Validation for Course Exit
    if (feedbackType === "COURSE_EXIT" && (targets.length === 0 || targets.some(t => !t.division))) {
      alert("Please add at least one target division for Course Exit feedback.");
      return;
    }

    // Validation for MSE/ESE - need at least one section target
    if ((feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK")) {
      if (!selections.facultyId) {
        alert("Faculty is required for MSE/ESE feedback.");
        return;
      }
      if ((lectureTargets.length === 0 || lectureTargets.some(t => !t.division)) &&
        (labTargets.length === 0 || labTargets.some(t => !t.division))) {
        alert("Please add at least one target division for Lecture or Lab section.");
        return;
      }
    }

    if (feedbackType === "COURSE_EXIT" && courseExitQuestions.some(q => !q.questionText)) {
      alert("Please fill all course exit questions.");
      return;
    }

    const formData: any = {
      title,
      feedbackType,
      deptId: selections.deptId,
      program: selections.program,
      year: selections.year,
      courseId: selections.courseId,
    };

    if (feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK") {
      formData.facultyId = selections.facultyId;
      // Use fixed questions - non-editable
      formData.questions = getFixedQuestionsForMSEESE();
      // Section-wise targeting
      formData.lectureTargets = lectureTargets.map(t => ({
        division: t.division,
        batches: t.batches.length > 0 ? t.batches : ['A', 'B', 'C', 'D'] // Empty means all batches
      }));
      formData.labTargets = labTargets.map(t => ({
        division: t.division,
        batches: t.batches.length > 0 ? t.batches : ['A', 'B', 'C', 'D'] // Empty means all batches
      }));
    } else {
      // Course Exit uses regular targets
      formData.targets = targets.map(t => ({
        division: t.division,
        batches: t.batches.length > 0 ? t.batches : ['A', 'B', 'C', 'D'] // Empty means all batches
      }));
      formData.questions = {
        general: courseExitQuestions
      };
    }

    const res = await fetch("/api/admin/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert("Feedback Form Published Successfully!");
      setTitle("");
      setFeedbackType("");
      setSelections({ deptId: "", program: "", year: "", courseId: "", facultyId: "" });
      setTargets([]);
      setCourseExitQuestions([{ questionText: "", type: "rating" }]);
      router.push("/admin/dashboard");
    } else {
      const err = await res.json();
      alert("Failed: " + (err?.error || "Unknown error"));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Create Targeted Feedback Form</h2>

      {/* Feedback Type Selection */}
      <div className="mb-8 bg-slate-50 p-4 rounded-xl">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback Type *</label>
        <select
          className="w-full p-3 border rounded-lg bg-white text-sm text-black"
          value={feedbackType}
          onChange={(e) => {
            setFeedbackType(e.target.value as any);
            setSelections({ ...selections, facultyId: "" });
          }}
        >
          <option value="">Select Feedback Type</option>
          <option value="MSE_FEEDBACK">MSE Feedback</option>
          <option value="ESE_FEEDBACK">ESE Feedback</option>
          <option value="COURSE_EXIT">Course Exit Feedback</option>
        </select>
      </div>

      {/* Basic Selections */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl">
        <select
          className="p-3 border rounded-lg bg-white text-sm text-black"
          value={selections.deptId}
          onChange={(e) => setSelections({ ...selections, deptId: e.target.value, program: "", courseId: "" })}
        >
          <option value="">Select Dept</option>
          {data.depts.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>

        <select
          className="p-3 border rounded-lg bg-white text-sm text-black"
          disabled={!selections.deptId}
          value={selections.program}
          onChange={(e) => setSelections({ ...selections, program: e.target.value, courseId: "" })}
        >
          <option value="">Select Program</option>
          <option value="BTECH">B.Tech</option>
          <option value="MTECH">M.Tech</option>
          <option value="MCA">MCA</option>
        </select>

        <select
          className="p-3 border rounded-lg bg-white text-sm text-black"
          disabled={!selections.program}
          value={selections.year}
          onChange={(e) => setSelections({ ...selections, year: e.target.value })}
        >
          <option value="">Select Year</option>
          <option value="FE">FE</option>
          <option value="SE">SE</option>
          <option value="TE">TE</option>
          <option value="BE">BE</option>
        </select>

        <select
          className="p-3 border rounded-lg bg-white text-sm text-black"
          disabled={!selections.program || !selections.deptId}
          value={selections.courseId}
          onChange={(e) => setSelections({ ...selections, courseId: e.target.value })}
        >
          <option value="">Select Course</option>
          {data.courses.map((c: any) => (
            <option key={c._id} value={c._id}>{c.courseCode} - {c.courseName}</option>
          ))}
        </select>
      </div>

      {/* Faculty Selection (only for MSE/ESE) */}
      {(feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK") && (
        <div className="mb-8 bg-slate-50 p-4 rounded-xl">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Faculty *</label>
          <select
            className="w-full p-3 border rounded-lg bg-white text-sm text-black"
            value={selections.facultyId}
            onChange={(e) => setSelections({ ...selections, facultyId: e.target.value })}
          >
            <option value="">Select Faculty</option>
            {data.faculty.map((f: any) => (
              <option key={f._id} value={f.facultyId}>{f.name} ({f.facultyId})</option>
            ))}
          </select>
        </div>
      )}

      {/* Questions Preview (MSE/ESE) */}
      {(feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK") && (
        <div className="mb-6 border-t pt-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-slate-700">🔒 Predefined questions (cannot be edited)</span>
          </div>
          <div className="space-y-4 opacity-75">
            <div>
              <h4 className="font-semibold mb-2 text-base text-slate-800">Lecture Section</h4>
              <ul className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                {LECTURE_QUESTIONS.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-base text-slate-800">Lab Section</h4>
              <ul className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                {LAB_QUESTIONS.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Course Exit Questions */}
      {feedbackType === "COURSE_EXIT" && (
        <div className="mb-8 border-t pt-6">
          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Course Exit Questions
          </label>
          {courseExitQuestions.map((q, idx) => (
            <div key={idx} className="flex gap-4 items-start group mb-4">
              <span className="mt-3 font-bold text-slate-300">{idx + 1}.</span>
              <div className="flex-1">
                <input
                  className="w-full p-3 bg-slate-50 border border-transparent focus:border-rose-200 focus:bg-white rounded-xl transition-all outline-none text-black"
                  placeholder="Enter your question..."
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeCourseExitQuestion(idx)}
                className="mt-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCourseExitQuestion}
            className="px-6 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-medium hover:bg-slate-50 transition-colors"
          >
            + Add Another Question
          </button>
        </div>
      )}

      {/* Targeting Section */}
      {(feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK") ? (
        <div className="mb-8 border-t pt-7">
          {/* Lecture Targeting */}
          <div className="mb-8 border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => setLectureCollapsed(!lectureCollapsed)}
                className="flex items-center gap-2 text-base font-semibold text-slate-800 hover:text-slate-900"
              >
                <span>{lectureCollapsed ? '▲' : '▼'}</span>
                <span>Lecture Target Students</span>
              </button>
              <button
                type="button"
                onClick={addLectureTarget}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                + Add Division Target
              </button>
            </div>

            <p className="text-xs text-slate-700 mb-3">Who will see lecture questions</p>

            {!lectureCollapsed && (
              <div className="space-y-3">
                {lectureTargets.length === 0 ? (
                  <div className="p-3 bg-slate-100/50 rounded-lg">
                    <p className="text-sm text-slate-600 italic">No lecture targets added yet</p>
                  </div>
                ) : (
                  lectureTargets.map((target, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center mb-2">
                        <select
                          className="p-2 border rounded-lg bg-white text-sm text-black"
                          value={target.division}
                          onChange={(e) => updateLectureTargetDivision(idx, e.target.value)}
                        >
                          <option value="">Select Division</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <div className="md:col-span-3 flex gap-2">
                          {['A', 'B', 'C', 'D'].map(batch => (
                            <label key={batch} className="flex items-center gap-1 text-sm text-slate-800">
                              <input
                                type="checkbox"
                                checked={target.batches.includes(batch)}
                                onChange={() => toggleLectureBatch(idx, batch)}
                                className="rounded"
                              />
                              {batch}
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLectureTarget(idx)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove Division
                        </button>
                      </div>

                      {/* Batch Selection Indicator */}
                      {target.division && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                            {getBatchIndicator(target.batches)}
                          </span>
                        </div>
                      )}

                      {/* Target Summary */}
                      {target.division && (
                        <p className="text-xs text-slate-700 mt-2">
                          {getTargetSummary(target.division, target.batches)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Lab Targeting */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => setLabCollapsed(!labCollapsed)}
                className="flex items-center gap-2 text-base font-semibold text-slate-800 hover:text-slate-900"
              >
                <span>{labCollapsed ? '▲' : '▼'}</span>
                <span>Lab Target Students</span>
              </button>
              <button
                type="button"
                onClick={addLabTarget}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                + Add Division Target
              </button>
            </div>

            <p className="text-xs text-slate-700 mb-3">Who will see lab questions</p>

            {!labCollapsed && (
              <div className="space-y-3">
                {labTargets.length === 0 ? (
                  <div className="p-3 bg-slate-100/50 rounded-lg">
                    <p className="text-sm text-slate-600 italic">No lab targets added yet</p>
                  </div>
                ) : (
                  labTargets.map((target, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center mb-2">
                        <select
                          className="p-2 border rounded-lg bg-white text-sm text-black"
                          value={target.division}
                          onChange={(e) => updateLabTargetDivision(idx, e.target.value)}
                        >
                          <option value="">Select Division</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <div className="md:col-span-3 flex gap-2">
                          {['A', 'B', 'C', 'D'].map(batch => (
                            <label key={batch} className="flex items-center gap-1 text-sm text-slate-800">
                              <input
                                type="checkbox"
                                checked={target.batches.includes(batch)}
                                onChange={() => toggleLabBatch(idx, batch)}
                                className="rounded"
                              />
                              {batch}
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLabTarget(idx)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove Division
                        </button>
                      </div>

                      {/* Batch Selection Indicator */}
                      {target.division && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                            {getBatchIndicator(target.batches)}
                          </span>
                        </div>
                      )}

                      {/* Target Summary */}
                      {target.division && (
                        <p className="text-xs text-slate-700 mt-2">
                          {getTargetSummary(target.division, target.batches)}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Target Students (Division + Batches)
            </label>
            <button
              type="button"
              onClick={addTarget}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              + Add Division Target
            </button>
          </div>
          {targets.map((target, idx) => (
            <div key={idx} className="mb-4 p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <select
                  className="p-2 border rounded-lg bg-white text-sm text-black"
                  value={target.division}
                  onChange={(e) => updateTargetDivision(idx, e.target.value)}
                >
                  <option value="">Select Division</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                <div className="md:col-span-3 flex gap-2">
                  {['A', 'B', 'C', 'D'].map(batch => (
                    <label key={batch} className="flex items-center gap-1 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={target.batches.includes(batch)}
                        onChange={() => toggleBatch(idx, batch)}
                        className="rounded"
                      />
                      {batch}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => removeTarget(idx)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove Division
                </button>
              </div>
              {target.batches.length === 0 && (
                <p className="text-xs text-slate-600 mt-2">No batches selected = All batches in this division</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Title and Submit */}
      <div className="sticky bottom-0 bg-white border-t-2 border-slate-300 shadow-lg mt-10 pt-5 pb-4 -mx-8 px-8">
        <input
          className="w-full p-4 border-b-2 text-xl font-bold mb-4 focus:border-rose-500 outline-none text-black"
          placeholder="Form Title (e.g., MSE Feedback - Semester 1)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Validation Message */}
        {(() => {
          const validationMsg = getValidationMessage();
          if (validationMsg) {
            return (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${validationMsg.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                {validationMsg.text}
              </div>
            );
          }
          return null;
        })()}

        <button
          type="button"
          onClick={handleSaveForm}
          disabled={!isFormValid()}
          className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] ${isFormValid()
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          Publish Targeted Form
        </button>
      </div>
    </div>
  );
}
