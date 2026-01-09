import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Admin from "@/models/Admin";
import Student from "@/models/Student";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body || {};
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword required" },
        { status: 400 },
      );
    }

    await connectDB();

    const role = session.user.role;
    let user: any = null;

    if (role === "ADMIN") {
      user = await Admin.findById(session.user.id);
    } else if (role === "STUDENT") {
      user = await Student.findById(session.user.id);
    }

    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password incorrect" },
        { status: 403 },
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    return NextResponse.json({ message: "Password changed" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to change password" },
      { status: 500 },
    );
  }
}
