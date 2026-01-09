import connectDB from "@/lib/db";
import EmailUpload from "@/models/EmailUpload";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uploads = await EmailUpload.find()
      .sort({ uploadedAt: -1 })
      .select("_id label filename uploadedAt records")
      .lean();

    return NextResponse.json(uploads);
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const label = (formData.get("label") as string) || file.name || "Untitled Upload";

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

    let rowObjects: any[] = [];

    if (isExcel) {
      // Excel: use xlsx, first worksheet only, convert to row objects compatible with CSV parsing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      // header:1 returns 2D array (rows)
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "No data found in Excel file" }, { status: 400 });
      }

      const headerRow = rows[0].map((h: any) => String(h || "").trim().toLowerCase());
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj: any = {};
        headerRow.forEach((key: string, idx: number) => {
          if (!key) return;
          obj[key] = row[idx];
        });
        rowObjects.push(obj);
      }
    } else {
      // CSV: keep existing PapaParse logic
      const text = await file.text();

      const parseResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase()
      });

      if (parseResult.errors.length > 0) {
        return NextResponse.json(
          { error: "CSV parsing error: " + parseResult.errors[0].message },
          { status: 400 }
        );
      }

      rowObjects = parseResult.data as any[];
    }

    const records: Array<{ name: string; email: string }> = [];
    const emailSet = new Set<string>();

    for (const row of rowObjects as any[]) {
      const name = (row.name || "").trim();
      const email = (row.email || "").trim().toLowerCase();

      if (!name || !email) continue;

      // Normalize name (trim + lowercase for matching)
      const normalizedName = name.toLowerCase().trim();

      // Check for duplicate emails within this dataset
      if (emailSet.has(email)) {
        continue; // Skip duplicate email
      }

      emailSet.add(email);
      records.push({
        name: normalizedName,
        email
      });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "No valid records found in CSV" }, { status: 400 });
    }

    const upload = await EmailUpload.create({
      label,
      filename: file.name,
      records
    });

    return NextResponse.json({ 
      message: "Email CSV uploaded successfully", 
      upload: {
        _id: upload._id,
        label: upload.label,
        filename: upload.filename,
        uploadedAt: upload.uploadedAt,
        recordCount: records.length
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
