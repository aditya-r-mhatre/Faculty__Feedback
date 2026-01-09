import connectDB from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const FeedbackResponse = (await import("@/models/FeedbackResponse")).default;
    const Mapping = (await import("@/models/Mapping")).default;
    const Subject = (await import("@/models/Subject")).default;

    const user = session.user as any;
    const facultyId = user.id;

    // Find all mappings for this faculty
    const mappings = await Mapping.find({ facultyId }).lean();
    
    if (!mappings || mappings.length === 0) {
      return NextResponse.json([]);
    }

    const mappingIds = mappings.map((m: any) => m._id);

    // Get all feedback responses for these mappings
    const feedbackData = await FeedbackResponse.find({
      mappingId: { $in: mappingIds }
    }).lean();

    // Group by mapping and calculate averages
    const result = mappings.map((mapping: any) => {
      const responsesForMapping = feedbackData.filter(
        (f: any) => f.mappingId.toString() === mapping._id.toString()
      );

      let averageRating = 0;
      if (responsesForMapping.length > 0) {
        const allRatings: number[] = [];
        responsesForMapping.forEach((response: any) => {
          if (response.ratings && typeof response.ratings === 'object') {
            Object.values(response.ratings).forEach((rating: any) => {
              if (typeof rating === 'number') {
                allRatings.push(rating);
              }
            });
          }
        });

        if (allRatings.length > 0) {
          averageRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }
      }

      return {
        _id: mapping._id,
        subjectName: mapping.subjectId?.name || "Unknown Subject",
        classYear: mapping.classYear,
        division: mapping.division,
        batch: mapping.batch,
        totalSubmissions: responsesForMapping.length,
        averageRating
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
