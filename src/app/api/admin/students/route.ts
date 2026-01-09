import connectDB from "@/lib/db";
import Student from "@/models/Student";
import bcrypt from "bcryptjs";
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
    const search = searchParams.get("search");
    const searchBy = searchParams.get("searchBy"); // uid, email, name

    let query: any = {};
    
    if (search && searchBy) {
      if (searchBy === "uid") {
        query.uid = { $regex: search, $options: "i" };
      } else if (searchBy === "email") {
        query.email = { $regex: search, $options: "i" };
      } else if (searchBy === "name") {
        query.name = { $regex: search, $options: "i" };
      }
    }

    const students = await Student.find(query)
      .select("-password")
      .populate("dept", "name")
      .sort({ uid: 1 })
      .lean();

    return NextResponse.json(students);
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
    const { uid, name, email, year, program, dept, division, batch, password } = body;

    // Validation
    if (!uid || !name || !email || !year || !program || !dept || !division || !batch || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if student already exists
    const existingByUid = await Student.findOne({ uid });
    if (existingByUid) {
      return NextResponse.json({ error: "Student with this UID already exists" }, { status: 400 });
    }
    
    const existingByEmail = await Student.findOne({ email });
    if (existingByEmail) {
      return NextResponse.json({ error: "Student with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await Student.create({
      uid,
      name,
      email,
      year,
      program,
      dept,
      division,
      batch,
      password: hashedPassword
    });

    return NextResponse.json({ message: "Student created successfully", student: newStudent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, year, program, dept, division, batch } = body;

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (year) updateData.year = year;
    if (program) updateData.program = program;
    if (dept) updateData.dept = dept;
    if (division) updateData.division = division;
    if (batch) updateData.batch = batch;

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password").populate("dept", "name").lean();

    if (!updatedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Student updated successfully", student: updatedStudent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
