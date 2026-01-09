// Fixed questions for MSE_FEEDBACK and ESE_FEEDBACK forms
// These questions are MANDATORY and NON-EDITABLE

export const LECTURE_QUESTIONS = [
  "Subject Knowledge",
  "Regularity & Punctuality",
  "Communication Skills",
  "Syllabus Coverage",
  "Interest Generated in Subject",
  "Faculty Preparation",
  "Overall Acceptance"
];

export const LAB_QUESTIONS = [
  "Time Management",
  "Depth of Lab Experiment",
  "Department Infrastructure to Conduct Lab Course",
  "Practical Knowledge of Faculty"
];

// Helper function to get fixed questions for MSE/ESE
export function getFixedQuestionsForMSEESE() {
  return {
    lecture: LECTURE_QUESTIONS.map(q => ({ questionText: q, type: "rating" as const })),
    lab: LAB_QUESTIONS.map(q => ({ questionText: q, type: "rating" as const }))
  };
}
