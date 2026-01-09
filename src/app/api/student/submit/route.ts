import connectDB from "@/lib/db";
import SubmissionStatus from "@/models/SubmissionStatus";
import FeedbackResponse from "@/models/FeedbackResponse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export async function POST(req: Request) { 
  await connectDB();
  const session = await getServerSession(authOptions);
  
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    
    // DEBUG: Look at your terminal to see exactly what the frontend is sending
    console.log("SUBMISSION BODY:", body);

    // Support both naming conventions to be safe
    const mappingId = body.mappingId || body.formId;
    const { ratings, lectureRatings, labRatings, comments } = body;

    // 1. Precise Validation
    if (!mappingId) {
      return NextResponse.json({ error: "mappingId is missing in request" }, { status: 400 });
    }

    // Validate that at least one section has ratings
    const hasRatings = (ratings && Object.keys(ratings).length > 0) ||
                      (lectureRatings && Object.keys(lectureRatings).length > 0) ||
                      (labRatings && Object.keys(labRatings).length > 0);

    if (!hasRatings) {
      return NextResponse.json({ error: "Ratings are required for at least one section" }, { status: 400 });
    }

    // 2. Double Submission Check using the ID from our Session Fix
    const alreadySubmitted = await SubmissionStatus.findOne({ 
      studentId: session.user.id, 
      mappingId 
    });

    if (alreadySubmitted) {
      return NextResponse.json({ error: "You have already submitted this form." }, { status: 400 });
    }

    // 3. Database Operations
    // Mark the status first
    await SubmissionStatus.create({ 
      studentId: session.user.id, 
      mappingId 
    });

    // Create the actual response record with section-wise ratings
    const responseData: any = {
      mappingId, 
      studentId: session.user.id, 
      comments: comments || ''
    };

    // Store section-wise ratings for MSE/ESE, or legacy ratings for Course Exit
    if (lectureRatings || labRatings) {
      if (lectureRatings) responseData.lectureRatings = lectureRatings;
      if (labRatings) responseData.labRatings = labRatings;
      // Also store combined for backward compatibility
      responseData.ratings = { ...lectureRatings, ...labRatings };
    } else {
      // Course Exit uses general ratings
      responseData.ratings = ratings;
    }

    await FeedbackResponse.create(responseData);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Submission error:', err);
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'Already submitted (Duplicate Key)' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}