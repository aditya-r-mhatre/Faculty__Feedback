import connectDB from "@/lib/db";
import Course from "@/models/Course";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get("deptId");
    const program = searchParams.get("program");
    const search = searchParams.get("search");

    let query: any = {};
    if (deptId) query.dept = deptId;
    if (program) query.program = program;
    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: "i" } },
        { courseName: { $regex: search, $options: "i" } }
      ];
    }

    const courses = await Course.find(query)
      .populate("dept", "name")
      .sort({ courseCode: 1 })
      .lean();

    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseCode, courseName, dept, program } = body;

    if (!courseCode || !courseName || !dept || !program) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ courseCode });
    
    if (existingCourse) {
      return NextResponse.json({ error: "Course with this code already exists" }, { status: 400 });
    }

    const newCourse = await Course.create({
      courseCode,
      courseName,
      dept,
      program
    });

    return NextResponse.json({ message: "Course added successfully", course: newCourse }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
