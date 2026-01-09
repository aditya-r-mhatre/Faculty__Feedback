import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; 
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    // Verify Admin Session
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get("deptId");
    const program = searchParams.get("program");
    const year = searchParams.get("year");
    const feedbackType = searchParams.get("feedbackType");
    const courseId = searchParams.get("courseId");
    const facultyId = searchParams.get("facultyId");
    const facultyName = searchParams.get("facultyName");
    const division = searchParams.get("division");
    const batch = searchParams.get("batch");

    const FeedbackResponse = (await import("@/models/FeedbackResponse")).default;
    const FeedbackForm = (await import("@/models/Feedback")).default;
    const Faculty = (await import("@/models/Faculty")).default;
    // Ensure Course model is registered for population
    await import("@/models/Course");

    const mongoose = (await import("mongoose")).default;

    // Build query for forms
    const formQuery: any = {};
    if (deptId) formQuery.deptId = new mongoose.Types.ObjectId(deptId);
    if (program) formQuery.program = program;
    if (year) formQuery.year = year;
    if (feedbackType) formQuery.feedbackType = feedbackType;
    if (courseId) formQuery.courseId = new mongoose.Types.ObjectId(courseId);
    if (facultyId) formQuery.facultyId = facultyId;

    // Find all forms matching filters
    let forms = await FeedbackForm.find(formQuery).populate('courseId', 'courseCode courseName').lean();

    // Apply division/batch filtering in-memory using section-wise targets
    if (division || batch) {
      const matchesTarget = (targets: any[] | undefined, div: string | null, b: string | null) => {
        if (!targets || targets.length === 0) return false;
        return targets.some(t => {
          if (div && t.division !== div) return false;
          if (b) {
            // If batches empty, treat as all batches
            if (!t.batches || t.batches.length === 0) return true;
            return t.batches.includes(b);
          }
          return true;
        });
      };

      forms = forms.filter((form: any) => {
        const div = division;
        const b = batch;

        if (form.feedbackType === "COURSE_EXIT") {
          // Course Exit uses generic targets
          return matchesTarget(form.targets, div, b);
        }

        if (form.feedbackType === "MSE_FEEDBACK" || form.feedbackType === "ESE_FEEDBACK") {
          const hasLectureTargets = Array.isArray(form.lectureTargets) && form.lectureTargets.length > 0;
          const hasLabTargets = Array.isArray(form.labTargets) && form.labTargets.length > 0;

          const lectureOk = matchesTarget(form.lectureTargets, div, b);
          const labOk = matchesTarget(form.labTargets, div, b);

          // Backward compatibility: if no section targets, fall back to legacy targets
          if (!hasLectureTargets && !hasLabTargets && form.targets && form.targets.length > 0) {
            return matchesTarget(form.targets, div, b);
          }

          return lectureOk || labOk;
        }

        return false;
      });
    }

    // Filter by faculty name if provided (client-side filter since it's a text search)
    if (facultyName && facultyName.trim()) {
      const facultyMatches = await Faculty.find({
        name: { $regex: facultyName.trim(), $options: 'i' }
      }).select('facultyId').lean();
      const matchingFacultyIds = facultyMatches.map(f => f.facultyId);
      forms = forms.filter((f: any) => matchingFacultyIds.includes(f.facultyId));
    }

    const results = [];

    for (const form of forms) {
      const responses = await FeedbackResponse.find({ mappingId: form._id }).lean();

      const totalSubmissions = responses.length;

      // Compute per-question averages - handle section-wise ratings
      const questionSums: Record<string, { sum: number; count: number }> = {};
      
      for (const r of responses) {
        // For MSE/ESE, use lectureRatings and labRatings separately
        if (form.feedbackType === "MSE_FEEDBACK" || form.feedbackType === "ESE_FEEDBACK") {
          // Process lecture ratings
          if (r.lectureRatings) {
            for (const [k, v] of Object.entries(r.lectureRatings)) {
              const val = Number(v) || 0;
              if (!questionSums[k]) questionSums[k] = { sum: 0, count: 0 };
              questionSums[k].sum += val;
              questionSums[k].count += 1;
            }
          }
          // Process lab ratings
          if (r.labRatings) {
            for (const [k, v] of Object.entries(r.labRatings)) {
              const val = Number(v) || 0;
              if (!questionSums[k]) questionSums[k] = { sum: 0, count: 0 };
              questionSums[k].sum += val;
              questionSums[k].count += 1;
            }
          }
          // Fallback to legacy ratings if section-wise not available
          if (!r.lectureRatings && !r.labRatings && r.ratings) {
            for (const [k, v] of Object.entries(r.ratings)) {
              const val = Number(v) || 0;
              if (!questionSums[k]) questionSums[k] = { sum: 0, count: 0 };
              questionSums[k].sum += val;
              questionSums[k].count += 1;
            }
          }
        } else {
          // Course Exit uses general ratings
          const ratingsObj = r.ratings || {};
          for (const [k, v] of Object.entries(ratingsObj)) {
            const val = Number(v) || 0;
            if (!questionSums[k]) questionSums[k] = { sum: 0, count: 0 };
            questionSums[k].sum += val;
            questionSums[k].count += 1;
          }
        }
      }

      // Compute overall average (average of per-response averages)
      let overallAverage = 0;
      if (totalSubmissions > 0) {
        const perResponseAverages = responses.map(r => {
          let allVals: number[] = [];
          if (form.feedbackType === "MSE_FEEDBACK" || form.feedbackType === "ESE_FEEDBACK") {
            if (r.lectureRatings) allVals.push(...Object.values(r.lectureRatings).map(v => Number(v) || 0));
            if (r.labRatings) allVals.push(...Object.values(r.labRatings).map(v => Number(v) || 0));
            if (allVals.length === 0 && r.ratings) {
              allVals = Object.values(r.ratings).map(v => Number(v) || 0);
            }
          } else {
            allVals = Object.values(r.ratings || {}).map(v => Number(v) || 0);
          }
          if (allVals.length === 0) return 0;
          return allVals.reduce((a,b) => a + b, 0) / allVals.length;
        });
        overallAverage = perResponseAverages.reduce((a,b) => a + b, 0) / perResponseAverages.length;
      }

      const perQuestionAverages = Object.keys(questionSums).sort().map(k => {
        const entry = questionSums[k];
        // Calculate average rating (on 5-point scale)
        const avg = entry.count ? (entry.sum / entry.count) : 0;
        // Convert to percentage (assuming 5-point scale: 1=20%, 2=40%, 3=60%, 4=80%, 5=100%)
        const percentage = Math.round(avg * 20 * 100) / 100;
        return { key: k, avg: Math.round(avg * 100) / 100, percentage };
      });

      // Calculate section averages and response counts for MSE/ESE feedback
      let lectureAverage = 0;
      let labAverage = 0;
      let lectureResponseCount = 0;
      let labResponseCount = 0;

      if (form.feedbackType === "MSE_FEEDBACK" || form.feedbackType === "ESE_FEEDBACK") {
        // Calculate Lecture section average and count
        const lectureKeys = perQuestionAverages.filter(q => q.key.startsWith('lecture_'));
        if (lectureKeys.length > 0) {
          // Count responses that have lecture ratings
          lectureResponseCount = responses.filter(r => r.lectureRatings || (r.ratings && Object.keys(r.ratings).some(k => k.startsWith('lecture_')))).length;
          const lectureSum = lectureKeys.reduce((sum, q) => sum + q.avg, 0);
          lectureAverage = lectureKeys.length > 0 ? lectureSum / lectureKeys.length : 0;
        }

        // Calculate Lab section average and count
        const labKeys = perQuestionAverages.filter(q => q.key.startsWith('lab_'));
        if (labKeys.length > 0) {
          // Count responses that have lab ratings
          labResponseCount = responses.filter(r => r.labRatings || (r.ratings && Object.keys(r.ratings).some(k => k.startsWith('lab_')))).length;
          const labSum = labKeys.reduce((sum, q) => sum + q.avg, 0);
          labAverage = labKeys.length > 0 ? labSum / labKeys.length : 0;
        }
      }

      // Collect comments
      const comments = responses.filter(r => r.comments && String(r.comments).trim().length > 0).map(r => ({ comment: r.comments, studentId: r.studentId }));

      // Resolve faculty display name: prefer stored `facultyName`, otherwise lookup Faculty model
      let facultyNameToUse = form.facultyName;
      if ((!facultyNameToUse || facultyNameToUse === '') && form.facultyId) {
        try {
          // Try to find in Faculty model by facultyId
          const faculty = await Faculty.findOne({ facultyId: form.facultyId }).lean();
          if (faculty) {
            facultyNameToUse = faculty.name || 'Assigned Faculty';
          } else {
            facultyNameToUse = 'Assigned Faculty';
          }
        } catch (e) {
          facultyNameToUse = 'Assigned Faculty';
        }
      }

      // Flatten questions for display
      const allQuestions: any[] = [];
      if (form.questions?.lecture) {
        form.questions.lecture.forEach((q: any, idx: number) => {
          allQuestions.push({ ...q, section: 'lecture', index: idx });
        });
      }
      if (form.questions?.lab) {
        form.questions.lab.forEach((q: any, idx: number) => {
          allQuestions.push({ ...q, section: 'lab', index: idx });
        });
      }
      if (form.questions?.general) {
        form.questions.general.forEach((q: any, idx: number) => {
          allQuestions.push({ ...q, section: 'general', index: idx });
        });
      }

      // Get department name
      const Department = (await import("@/models/Department")).default;
      const dept = await Department.findById(form.deptId).select('name').lean();

      results.push({
        formId: form._id,
        title: form.title,
        feedbackType: form.feedbackType,
        courseId: form.courseId,
        courseName: form.courseName,
        facultyId: form.facultyId,
        facultyName: facultyNameToUse || 'Assigned Faculty',
        questions: allQuestions,
        program: form.program,
        year: form.year,
        targets: form.targets || [],
        deptId: form.deptId,
        deptName: dept?.name || 'Unknown Department',
        totalSubmissions,
        overallAverage: Math.round(overallAverage * 100) / 100,
        perQuestionAverages,
        lectureAverage: lectureAverage > 0 ? Math.round(lectureAverage * 20 * 100) / 100 : 0, // Percentage
        labAverage: labAverage > 0 ? Math.round(labAverage * 20 * 100) / 100 : 0, // Percentage
        lectureResponseCount,
        labResponseCount,
        comments
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
