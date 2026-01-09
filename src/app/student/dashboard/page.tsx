"use client";
import { useState, useEffect , useRef} from "react";
import { useSession } from "next-auth/react";

export default function StudentDashboard() {
  // 🔥 CHANGE 1: include update
  const { data: session, status, update } = useSession();
  const hasUpdatedSession = useRef(false);
  const [forms, setForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [ratings, setRatings] = useState<any>({});
  const [comment, setComment] = useState("");

  // 🔥 CHANGE 2: force refresh session from DB
  useEffect(() => {
    if (status === "authenticated" && !hasUpdatedSession.current) {
      hasUpdatedSession.current = true;
      update();
    }
  }, [status, update]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetch("/api/student/get-forms")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setForms(data);
        })
        .catch(err => console.error("Fetch error:", err));
    }
  }, [status, session]);

  // Initialize ratings when form opens - only for eligible sections
  useEffect(() => {
    if (selectedForm?.questions) {
      const initialRatings: any = {};
      const eligibleSections = selectedForm.eligibleSections || [];
      
      // Handle MSE/ESE structure (lecture + lab) - only if eligible
      if (eligibleSections.includes('lecture') && selectedForm.questions.lecture) {
        selectedForm.questions.lecture.forEach((_: any, idx: number) => {
          initialRatings[`lecture_${idx}`] = 3;
        });
      }
      if (eligibleSections.includes('lab') && selectedForm.questions.lab) {
        selectedForm.questions.lab.forEach((_: any, idx: number) => {
          initialRatings[`lab_${idx}`] = 3;
        });
      }
      
      // Handle COURSE_EXIT structure (general)
      if (eligibleSections.includes('general') && selectedForm.questions.general) {
        selectedForm.questions.general.forEach((_: any, idx: number) => {
          initialRatings[`general_${idx}`] = 3;
        });
      }
      
      setRatings(initialRatings);
      setComment("");
    }
  }, [selectedForm]);

  const handleSubmit = async () => {
    if (!selectedForm?._id) return;

    // Separate lecture and lab ratings for MSE/ESE
    const eligibleSections = selectedForm.eligibleSections || [];
    let lectureRatings: any = undefined;
    let labRatings: any = undefined;
    let generalRatings: any = undefined;

    if (selectedForm.feedbackType === "MSE_FEEDBACK" || selectedForm.feedbackType === "ESE_FEEDBACK") {
      // Extract lecture ratings
      if (eligibleSections.includes('lecture')) {
        lectureRatings = {};
        Object.keys(ratings).forEach(key => {
          if (key.startsWith('lecture_')) {
            lectureRatings[key] = ratings[key];
          }
        });
        if (Object.keys(lectureRatings).length === 0) lectureRatings = undefined;
      }

      // Extract lab ratings
      if (eligibleSections.includes('lab')) {
        labRatings = {};
        Object.keys(ratings).forEach(key => {
          if (key.startsWith('lab_')) {
            labRatings[key] = ratings[key];
          }
        });
        if (Object.keys(labRatings).length === 0) labRatings = undefined;
      }

      if (!lectureRatings && !labRatings) {
        alert("Please provide ratings for at least one section before submitting.");
        return;
      }
    } else {
      // Course Exit uses general ratings
      generalRatings = ratings;
      if (Object.keys(generalRatings).length === 0) {
        alert("Please provide ratings before submitting.");
        return;
      }
    }

    const res = await fetch("/api/student/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mappingId: selectedForm._id,
        ratings: generalRatings, // Legacy field for Course Exit
        lectureRatings,
        labRatings,
        comments: comment,
      }),
    });

    if (res.ok) {
      alert("Feedback submitted successfully!");
      setForms(prev => prev.filter((f: any) => f._id !== selectedForm._id));
      setSelectedForm(null);
      setRatings({});
    } else {
      const errData = await res.json();
      alert(`Error: ${errData.error || "Submission failed"}`);
    }
  };

  if (status === "loading") {
    return <div className="p-10 text-center">Loading Profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-emerald-800">
        Available Feedbacks
      </h2>

      {session?.user && (
        <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <h3 className="text-lg font-bold text-emerald-800 mb-3">
            Student Profile
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm text-emerald-900">
            <p>
              <strong className="text-emerald-700">Username:</strong>{" "}
              <span className="font-medium">{session.user.username}</span>
            </p>

            <p>
              <strong className="text-emerald-700">Role:</strong>{" "}
              <span className="font-medium">{session.user.role}</span>
            </p>

            <p>
              <strong className="text-emerald-700">UID:</strong>{" "}
              <span className="font-medium">{(session.user as any).uid ?? session.user.username ?? "—"}</span>
            </p>
            <p>
              <strong className="text-emerald-700">Name:</strong>{" "}
              <span className="font-medium">{(session.user as any).name ?? "—"}</span>
            </p>

            <p>
              <strong className="text-emerald-700">Program:</strong>{" "}
              <span className="font-medium">
                {(session.user as any).program ?? "—"}
              </span>
            </p>
            <p>
              <strong className="text-emerald-700">Year:</strong>{" "}
              <span className="font-medium">
                {(session.user as any).year ?? "—"}
              </span>
            </p>

            <p>
              <strong className="text-emerald-700">Division:</strong>{" "}
              <span className="font-medium">{session.user.division}</span>
            </p>

            <p>
              <strong className="text-emerald-700">Batch:</strong>{" "}
              <span className="font-medium">
                {session.user.batch || "All"}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {forms.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-gray-500 italic">
              No pending feedbacks for your division.
            </p>
          </div>
        ) : (
          forms.map((form: any) => (
            <div
              key={form._id}
              className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-lg text-emerald-700">
                  {form.title}
                </p>
                <p className="text-sm text-gray-600">
                  Course: {form.courseId?.courseCode || form.courseName || "N/A"} · 
                  Type: {form.feedbackType?.replace('_', ' ') || "N/A"}
                </p>
              </div>
              <button
                onClick={() => setSelectedForm(form)}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Fill Feedback
              </button>
            </div>
          ))
        )}
      </div>

      {selectedForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl">{selectedForm.title}</h3>
              <button
                onClick={() => setSelectedForm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-500 mb-6 text-sm">
              Rating Scale: 1 (Poor) to 5 (Excellent)
            </p>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
              {/* MSE/ESE: Lecture Section - only if eligible */}
              {selectedForm.eligibleSections?.includes('lecture') && 
               selectedForm.questions?.lecture && 
               selectedForm.questions.lecture.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Lecture Section</h4>
                  {selectedForm.questions.lecture.map((q: any, index: number) => (
                    <div key={`lecture_${index}`} className="space-y-3 p-3 bg-slate-50 rounded-lg mb-3">
                      <label className="block text-sm font-semibold text-gray-800">
                        {index + 1}. {q.questionText}
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">1</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          value={ratings[`lecture_${index}`] || 3}
                          onChange={e =>
                            setRatings({
                              ...ratings,
                              [`lecture_${index}`]: parseInt(e.target.value),
                            })
                          }
                        />
                        <span className="text-xs text-gray-400">5</span>
                        <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md font-bold text-sm min-w-8 text-center">
                          {ratings[`lecture_${index}`] || 3}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MSE/ESE: Lab Section - only if eligible */}
              {selectedForm.eligibleSections?.includes('lab') && 
               selectedForm.questions?.lab && 
               selectedForm.questions.lab.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Lab Section</h4>
                  {selectedForm.questions.lab.map((q: any, index: number) => (
                    <div key={`lab_${index}`} className="space-y-3 p-3 bg-slate-50 rounded-lg mb-3">
                      <label className="block text-sm font-semibold text-gray-800">
                        {index + 1}. {q.questionText}
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">1</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          value={ratings[`lab_${index}`] || 3}
                          onChange={e =>
                            setRatings({
                              ...ratings,
                              [`lab_${index}`]: parseInt(e.target.value),
                            })
                          }
                        />
                        <span className="text-xs text-gray-400">5</span>
                        <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md font-bold text-sm min-w-8 text-center">
                          {ratings[`lab_${index}`] || 3}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* COURSE_EXIT: General Questions - only if eligible */}
              {selectedForm.eligibleSections?.includes('general') && 
               selectedForm.questions?.general && 
               selectedForm.questions.general.length > 0 && (
                selectedForm.questions.general.map((q: any, index: number) => (
                  <div key={`general_${index}`} className="space-y-3 p-3 bg-slate-50 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-800">
                      {index + 1}. {q.questionText}
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">1</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        value={ratings[`general_${index}`] || 3}
                        onChange={e =>
                          setRatings({
                            ...ratings,
                            [`general_${index}`]: parseInt(e.target.value),
                          })
                        }
                      />
                      <span className="text-xs text-gray-400">5</span>
                      <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md font-bold text-sm min-w-8 text-center">
                        {ratings[`general_${index}`] || 3}
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Comments (Optional)
                </label>
                <textarea
                  className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={3}
                  placeholder="Share your thoughts..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
              >
                Submit Feedback
              </button>
              <button
                onClick={() => {
                  setSelectedForm(null);
                  setRatings({});
                }}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
