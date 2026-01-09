import connectDB from "@/lib/db";
import Department from "@/models/Department";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    // Check if department already exists
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 400 }
      );
    }

    // Create the Department
    const dept = await Department.create({ name });

    return NextResponse.json({
      message: "Department created successfully",
      dept
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create department" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const depts = await Department.find({});
    return NextResponse.json(depts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const { deptId, name } = await req.json();
    if (!deptId || !name) {
      return NextResponse.json({ error: 'deptId and name are required' }, { status: 400 });
    }

    const dept = await Department.findByIdAndUpdate(
      deptId,
      { name },
      { new: true }
    );

    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

    return NextResponse.json({ message: 'Department updated', dept });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update department' }, { status: 500 });
  }
}