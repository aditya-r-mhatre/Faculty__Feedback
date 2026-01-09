import connectDB from "@/lib/db";
import Student from "@/models/Student";
import EmailUpload from "@/models/EmailUpload";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import bcrypt from "bcryptjs";
import Papa from "papaparse";
import * as XLSX from "xlsx";

function matchesName(emailName: string, studentName: string): boolean {
  const normalize = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const emailTokens = new Set(normalize(emailName));
  const studentTokens = new Set(normalize(studentName));

  if (emailTokens.size === 0 || studentTokens.size === 0) return false;

  // Every token from email name must exist in student name
  for (const token of emailTokens) {
    if (!studentTokens.has(token)) return false;
  }

  return true;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const emailCsvId = formData.get("emailCsvId") as string;
    const program = formData.get("program") as string;
    const dept = formData.get("dept") as string;
    const year = formData.get("year") as string;
    const division = formData.get("division") as string;

    // Validation
    if (!file || !emailCsvId || !program || !dept || !year || !division) {
      return NextResponse.json({ 
        error: "All fields are required: file, emailCsvId, program, dept, year, division" 
      }, { status: 400 });
    }

    // Load email CSV dataset
    const emailUpload = await EmailUpload.findById(emailCsvId);
    if (!emailUpload) {
      return NextResponse.json({ error: "Email CSV not found" }, { status: 404 });
    }

    // Prepare email records for matching
    const emailRecords = (emailUpload.records || []).map((r: any) => ({
      name: (r.name || "").toString(),
      email: (r.email || "").toString()
    }));

    // Determine file type
    const filename = file.name || "";
    const lowerName = filename.toLowerCase();
    const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");
    const isCsv = lowerName.endsWith(".csv");

    if (!isExcel && !isCsv) {
      return NextResponse.json(
        { error: "Supported formats: CSV, XLSX, XLS" },
        { status: 400 }
      );
    }

    let rows: any[][] = [];

    if (isExcel) {
      // Excel: use xlsx, first worksheet only, convert to 2D rows
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
    } else {
      // CSV: keep existing PapaParse logic
      const text = await file.text();
      const parseResult = Papa.parse(text, {
        header: false,
        skipEmptyLines: true
      });
      rows = parseResult.data as any[][];
    }

    const results = {
      totalRows: 0,
      created: 0,
      skipped: [] as Array<{ name: string; reason: string }>
    };

    let currentBatch: string | null = null;
    const createdUids = new Set<string>();
    const createdEmails = new Set<string>();

    for (const row of rows as any[]) {
      results.totalRows++;

      // Trim all cells
      const cells = (row as any[]).map((cell: any) => String(cell || "").trim()).filter((cell: string) => cell.length > 0);

      // Skip empty rows
      if (cells.length === 0) continue;

      // Check if this is a batch marker (single cell, A-D)
      if (cells.length === 1 && /^[A-D]$/.test(cells[0])) {
        currentBatch = cells[0];
        continue;
      }

      // This should be a student row (uid, name format, possibly with index as first column)
      if (cells.length < 2) {
        results.skipped.push({
          name: cells[0] || "Unknown",
          reason: "Invalid row format (expected: uid, name or index, uid, name)"
        });
        continue;
      }

      // Check if batch is set
      if (!currentBatch) {
        results.skipped.push({
          name: cells[cells.length - 1] || "Unknown",
          reason: "Batch not defined before student row"
        });
        continue;
      }

      // Handle both formats: "uid,name" or "index,uid,name"
      // Take the last 2 cells as uid and name
      const uid = cells[cells.length - 2];
      const name = cells[cells.length - 1];

      // Find email in email CSV using token-based matching
      let email: string | null = null;
      for (const rec of emailRecords) {
        if (matchesName(rec.name, name)) {
          email = rec.email;
          break;
        }
      }
      if (!email) {
        results.skipped.push({
          name,
          reason: `Email not found for "${name}"`
        });
        continue;
      }

      // Check for duplicates
      if (createdUids.has(uid)) {
        results.skipped.push({
          name,
          reason: "Duplicate UID"
        });
        continue;
      }

      if (createdEmails.has(email)) {
        results.skipped.push({
          name,
          reason: "Duplicate email"
        });
        continue;
      }

      // Check if student already exists in DB
      const existingByUid = await Student.findOne({ uid });
      if (existingByUid) {
        results.skipped.push({
          name,
          reason: "UID already exists in database"
        });
        continue;
      }

      const existingByEmail = await Student.findOne({ email });
      if (existingByEmail) {
        results.skipped.push({
          name,
          reason: "Email already exists in database"
        });
        continue;
      }

      // Create student
      try {
        const hashedPassword = await bcrypt.hash(uid, 10);
        
        await Student.create({
          uid,
          name,
          email,
          password: hashedPassword,
          program,
          dept,
          year,
          division,
          batch: currentBatch
        });

        createdUids.add(uid);
        createdEmails.add(email);
        results.created++;
      } catch (error: any) {
        results.skipped.push({
          name,
          reason: `Database error: ${error.message}`
        });
      }
    }

    return NextResponse.json({
      message: "Bulk creation completed",
      summary: {
        totalRows: results.totalRows,
        created: results.created,
        skipped: results.skipped.length,
        skippedDetails: results.skipped
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
