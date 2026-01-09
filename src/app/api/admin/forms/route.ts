import connectDB from "@/lib/db";
import FeedbackForm from "@/models/Feedback"; 
import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    const { 
      title, 
      feedbackType,
      deptId, 
      program, 
      year, 
      courseId,
      facultyId,
      targets,
      lectureTargets,
      labTargets,
      questions 
    } = body;

    // Validation
    if (!title || !feedbackType || !deptId || !program || !year || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validation for Course Exit
    if (feedbackType === "COURSE_EXIT" && (!targets || targets.length === 0)) {
      return NextResponse.json({ error: "At least one target division is required for Course Exit" }, { status: 400 });
    }

    // Validation for MSE/ESE
    if ((feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK")) {
      if (!facultyId) {
        return NextResponse.json({ error: "Faculty is required for MSE/ESE feedback" }, { status: 400 });
      }
      const hasLectureTargets = lectureTargets && lectureTargets.length > 0 && lectureTargets.every((t: any) => t.division);
      const hasLabTargets = labTargets && labTargets.length > 0 && labTargets.every((t: any) => t.division);
      if (!hasLectureTargets && !hasLabTargets) {
        return NextResponse.json({ error: "At least one target division is required for Lecture or Lab section" }, { status: 400 });
      }
    }

    if (!questions || (feedbackType === "COURSE_EXIT" && (!questions.general || questions.general.length === 0))) {
      return NextResponse.json({ error: "Questions are required" }, { status: 400 });
    }

    // Fetch course and faculty names for caching
    const Course = (await import('@/models/Course')).default;
    const Faculty = (await import('@/models/Faculty')).default;
    
    const course = await Course.findById(courseId).select('courseCode courseName').lean();
    let facultyName = null;
    if (facultyId) {
      const faculty = await Faculty.findOne({ facultyId }).select('name').lean();
      facultyName = faculty?.name || null;
    }

    const formData: any = {
      title,
      feedbackType,
      deptId,
      program,
      year,
      courseId,
      courseName: course?.courseName || null,
      facultyId: facultyId || null,
      facultyName: facultyName || null,
      questions
    };

    // Add targeting based on feedback type
    if (feedbackType === "COURSE_EXIT") {
      formData.targets = targets;
    } else if (feedbackType === "MSE_FEEDBACK" || feedbackType === "ESE_FEEDBACK") {
      formData.lectureTargets = lectureTargets || [];
      formData.labTargets = labTargets || [];
    }

    const newForm = await FeedbackForm.create(formData);

    console.log(`[forms POST] Created form "${title}" with deptId: ${deptId}, program: ${program}, year: ${year}`);
    console.log(`[forms POST] LectureTargets:`, JSON.stringify(lectureTargets), `LabTargets:`, JSON.stringify(labTargets));

    return NextResponse.json(newForm, { status: 201 });
  } catch (error: any) {
    console.error("Form Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get('deptId');
    const program = searchParams.get('program');
    const year = searchParams.get('year');
    const feedbackType = searchParams.get('feedbackType');
    const facultyId = searchParams.get('facultyId');
    const facultyName = searchParams.get('facultyName');
    const courseId = searchParams.get('courseId');
    const division = searchParams.get('division');
    const batch = searchParams.get('batch');

    const query: any = {};
    if (deptId) query.deptId = deptId;
    if (program) query.program = program;
    if (year) query.year = year;
    if (feedbackType) query.feedbackType = feedbackType;
    if (facultyId) query.facultyId = facultyId;
    if (facultyName) {
      query.facultyName = { $regex: facultyName, $options: 'i' };
    }
    if (courseId) query.courseId = courseId;
    if (division) {
      query['targets.division'] = division;
    }
    if (batch) {
      query['targets.batches'] = batch;
    }

    const forms = await FeedbackForm.find(query)
      .populate('deptId', 'name')
      .populate('courseId', 'courseCode courseName')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(forms || []);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isActive } = body;
    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const updated = await FeedbackForm.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH forms error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
