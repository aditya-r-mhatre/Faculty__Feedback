import connectDB from "@/lib/db";
import EmailUpload from "@/models/EmailUpload";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const deleted = await EmailUpload.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Email CSV not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Email CSV deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
