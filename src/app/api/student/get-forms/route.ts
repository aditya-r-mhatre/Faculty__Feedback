import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    
    const FeedbackForm = (await import("@/models/Feedback")).default;
    const SubmissionStatus = (await import("@/models/SubmissionStatus")).default;

    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Ensure deptId is a valid string/ObjectId
    if (!user.deptId || !user.program || !user.year) {
      return NextResponse.json({ error: "Missing user attributes" }, { status: 400 });
    }

    // Fetch IDs of forms already submitted
    const submittedRecords = await SubmissionStatus.find({ 
      studentId: user.id 
    }).select("mappingId");
    
    const submittedIds = submittedRecords.map(rec => rec.mappingId.toString());

    // Import mongoose for ObjectId conversion
    const mongoose = (await import("mongoose")).default;

    // Find forms that match student's attributes exactly by deptId + program + year
    const allForms = await FeedbackForm.find({
      deptId: new mongoose.Types.ObjectId(user.deptId),
      program: user.program,
      year: user.year,
      isActive: true,
      _id: { $nin: submittedIds.map(id => new mongoose.Types.ObjectId(id)) }
    })
      .populate("courseId", "courseCode courseName")
      .lean();

    // Debug logging
    console.log(`[get-forms] Student: ${user.uid}, Dept: ${user.deptId}, Program: ${user.program}, Year: ${user.year}, Division: ${user.division}, Batch: ${user.batch}`);
    console.log(`[get-forms] Found ${allForms.length} forms matching dept/program/year`);
    allForms.forEach((f: any) => {
      console.log(`[get-forms] Form "${f.title}": Type=${f.feedbackType}, DeptId: ${f.deptId}, LectureTargets=`, JSON.stringify(f.lectureTargets), `LabTargets=`, JSON.stringify(f.labTargets));
    });

    // Filter forms by targeting logic and determine eligible sections
    const matchingForms = allForms.map((form: any) => {
      let eligibleSections: string[] = [];

      // Course Exit uses regular targets
      if (form.feedbackType === "COURSE_EXIT") {
        const matches = form.targets && Array.isArray(form.targets) && form.targets.some((target: any) => {
          if (!target || target.division !== user.division) return false;
          if (!target.batches || target.batches.length === 0) return true;
          return Array.isArray(target.batches) && target.batches.includes(user.batch);
        });
        if (matches) {
          eligibleSections.push('general');
        }
      }
      // MSE/ESE use section-wise targeting
      else if (form.feedbackType === "MSE_FEEDBACK" || form.feedbackType === "ESE_FEEDBACK") {
        // Check Lecture targeting - ensure lectureTargets exists and is an array
        if (form.lectureTargets && Array.isArray(form.lectureTargets) && form.lectureTargets.length > 0) {
          const matchesLecture = form.lectureTargets.some((target: any) => {
            if (!target || target.division !== user.division) return false;
            // Empty batches array means all batches
            if (!target.batches || !Array.isArray(target.batches) || target.batches.length === 0) return true;
            return target.batches.includes(user.batch);
          });
          if (matchesLecture) {
            eligibleSections.push('lecture');
          }
        }

        // Check Lab targeting - ensure labTargets exists and is an array
        if (form.labTargets && Array.isArray(form.labTargets) && form.labTargets.length > 0) {
          const matchesLab = form.labTargets.some((target: any) => {
            if (!target || target.division !== user.division) return false;
            // Empty batches array means all batches
            if (!target.batches || !Array.isArray(target.batches) || target.batches.length === 0) return true;
            return target.batches.includes(user.batch);
          });
          if (matchesLab) {
            eligibleSections.push('lab');
          }
        }

        // Backward compatibility: if no section targets defined but legacy targets exist, treat as both
        const hasLectureTargets = Array.isArray(form.lectureTargets) && form.lectureTargets.length > 0;
        const hasLabTargets = Array.isArray(form.labTargets) && form.labTargets.length > 0;
        if (!hasLectureTargets && !hasLabTargets && eligibleSections.length === 0 && form.targets && Array.isArray(form.targets) && form.targets.length > 0) {
          const matchesLegacy = form.targets.some((target: any) => {
            if (!target || target.division !== user.division) return false;
            if (!target.batches || !Array.isArray(target.batches) || target.batches.length === 0) return true;
            return target.batches.includes(user.batch);
          });
          if (matchesLegacy) {
            eligibleSections = ['lecture', 'lab']; // Default to both for legacy forms
          }
        }
      }

      // Only include form if student is eligible for at least one section
      if (eligibleSections.length > 0) {
        console.log(`[get-forms] Form "${form.title}" matched with sections:`, eligibleSections);
        return {
          ...form,
          eligibleSections // Add which sections student can see
        };
      } else {
        console.log(`[get-forms] Form "${form.title}" did NOT match any sections`);
      }
      return null;
    }).filter((form: any) => form !== null);

    console.log(`[get-forms] Returning ${matchingForms.length} matching forms`);
    return NextResponse.json(matchingForms || []);
  } catch (error: any) {
    console.error("Fetch error:", error); 
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
