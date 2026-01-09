import connectDB from "@/lib/db";
import Faculty from "@/models/Faculty";
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
    const facultyId = searchParams.get("facultyId");

    let query: any = {};
    
    if (facultyId) {
      query.facultyId = { $regex: facultyId, $options: "i" };
    } else if (search) {
      query.$or = [
        { facultyId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const faculty = await Faculty.find(query)
      .populate("dept", "name")
      .sort({ facultyId: 1 })
      .lean();

    return NextResponse.json(faculty);
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
    const { facultyId, name, dept } = body;

    if (!facultyId || !name || !dept) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if faculty already exists
    const existingFaculty = await Faculty.findOne({ facultyId });
    
    if (existingFaculty) {
      return NextResponse.json({ error: "Faculty with this ID already exists" }, { status: 400 });
    }

    const newFaculty = await Faculty.create({
      facultyId,
      name,
      dept
    });

    return NextResponse.json({ message: "Faculty added successfully", faculty: newFaculty }, { status: 201 });
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
      return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
    }

    const deletedFaculty = await Faculty.findByIdAndDelete(id);

    if (!deletedFaculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Faculty deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
