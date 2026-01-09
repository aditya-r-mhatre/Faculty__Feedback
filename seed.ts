const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Please define MONGODB_URI in .env.local");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    const now = new Date();

    const adminCollection = db.collection("admins");
    const studentCollection = db.collection("students");
    const facultyCollection = db.collection("faculties");
    const courseCollection = db.collection("courses");
    const deptCollection = db.collection("departments");

    // --- Seed Departments ---
    const deptNames = ["Computer Engineering", "Mechanical Engineering"];
    const deptIds = {};

    for (const name of deptNames) {
      let dept = await deptCollection.findOne({ name });
      if (!dept) {
        const insertRes = await deptCollection.insertOne({
          name,
          createdAt: now,
          updatedAt: now,
        });
        dept = { _id: insertRes.insertedId, name };
        console.log(`Created department: ${name}`);
      }
      deptIds[name] = dept._id;
    }

    // --- Seed Admins ---
    const admins = [
      {
        username: "admin.primary",
        email: "admin.primary@example.com",
        password: "AdminPrimary123!",
      },
      {
        username: "admin.secondary",
        email: "admin.secondary@example.com",
        password: "AdminSecondary123!",
      },
    ];

    for (const admin of admins) {
      const exists = await adminCollection.findOne({
        $or: [{ username: admin.username }, { email: admin.email }],
      });
      if (exists) {
        console.log(`Admin ${admin.username} already exists. Skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await adminCollection.insertOne({
        username: admin.username,
        email: admin.email,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created admin: ${admin.username}`);
    }

    // --- Seed Students (with programs) ---
    const students = [
      {
        uid: "FE-CE-BTECH-001",
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        year: "FE",
        program: "BTECH",
        deptName: "Computer Engineering",
        division: "A",
        batch: "A",
        password: "StudentAlice123!",
      },
      {
        uid: "SE-ME-BTECH-002",
        name: "Bob Smith",
        email: "bob.smith@example.com",
        year: "SE",
        program: "BTECH",
        deptName: "Mechanical Engineering",
        division: "B",
        batch: "B",
        password: "StudentBob123!",
      },
      {
        uid: "TE-CE-MTECH-003",
        name: "Charlie Brown",
        email: "charlie.brown@example.com",
        year: "TE",
        program: "MTECH",
        deptName: "Computer Engineering",
        division: "C",
        batch: "C",
        password: "StudentCharlie123!",
      },
      {
        uid: "FE-CE-MCA-004",
        name: "Diana Prince",
        email: "diana.prince@example.com",
        year: "FE",
        program: "MCA",
        deptName: "Computer Engineering",
        division: "D",
        batch: "D",
        password: "StudentDiana123!",
      },
    ];

    for (const student of students) {
      const exists = await studentCollection.findOne({
        $or: [{ uid: student.uid }, { email: student.email }],
      });
      if (exists) {
        console.log(`Student ${student.uid} already exists. Skipping.`);
        continue;
      }

      const deptId = deptIds[student.deptName];
      const hashedPassword = await bcrypt.hash(student.password, 10);

      await studentCollection.insertOne({
        uid: student.uid,
        name: student.name,
        email: student.email,
        year: student.year,
        program: student.program,
        dept: new ObjectId(deptId),
        division: student.division,
        batch: student.batch,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created student: ${student.uid}`);
    }

    // --- Seed Faculty Directory (at least 2) ---
    const faculties = [
      {
        facultyId: "FAC-CE-001",
        name: "Dr. Emily Carter",
        deptName: "Computer Engineering",
      },
      {
        facultyId: "FAC-ME-002",
        name: "Prof. Daniel Lewis",
        deptName: "Mechanical Engineering",
      },
      {
        facultyId: "FAC-CE-003",
        name: "Dr. Sarah Williams",
        deptName: "Computer Engineering",
      },
    ];

    for (const fac of faculties) {
      const exists = await facultyCollection.findOne({ facultyId: fac.facultyId });
      if (exists) {
        console.log(`Faculty ${fac.facultyId} already exists. Skipping.`);
        continue;
      }

      const deptId = deptIds[fac.deptName];

      await facultyCollection.insertOne({
        facultyId: fac.facultyId,
        name: fac.name,
        dept: new ObjectId(deptId),
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created faculty: ${fac.facultyId}`);
    }

    // --- Seed Courses (at least 3) ---
    const courses = [
      {
        courseCode: "CS101",
        courseName: "Data Structures and Algorithms",
        deptName: "Computer Engineering",
        program: "BTECH",
      },
      {
        courseCode: "CS201",
        courseName: "Database Management Systems",
        deptName: "Computer Engineering",
        program: "BTECH",
      },
      {
        courseCode: "CS301",
        courseName: "Machine Learning",
        deptName: "Computer Engineering",
        program: "MTECH",
      },
      {
        courseCode: "CS401",
        courseName: "Web Technologies",
        deptName: "Computer Engineering",
        program: "MCA",
      },
      {
        courseCode: "ME101",
        courseName: "Thermodynamics",
        deptName: "Mechanical Engineering",
        program: "BTECH",
      },
    ];

    for (const course of courses) {
      const exists = await courseCollection.findOne({ courseCode: course.courseCode });
      if (exists) {
        console.log(`Course ${course.courseCode} already exists. Skipping.`);
        continue;
      }

      const deptId = deptIds[course.deptName];

      await courseCollection.insertOne({
        courseCode: course.courseCode,
        courseName: course.courseName,
        dept: new ObjectId(deptId),
        program: course.program,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Created course: ${course.courseCode}`);
    }

    // --- Seed Feedback Forms (MSE and ESE) ---
    const feedbackFormCollection = db.collection("feedbackforms");
    const feedbackResponseCollection = db.collection("feedbackresponses");
    const submissionStatusCollection = db.collection("submissionstatuses");

    // Get fixed questions
    const LECTURE_QUESTIONS = [
      "Subject Knowledge",
      "Regularity & Punctuality",
      "Communication Skills",
      "Syllabus Coverage",
      "Interest Generated in Subject",
      "Faculty Preparation",
      "Overall Acceptance"
    ];

    const LAB_QUESTIONS = [
      "Time Management",
      "Depth of Lab Experiment",
      "Department Infrastructure to Conduct Lab Course",
      "Practical Knowledge of Faculty"
    ];

    // Get IDs for seeding
    const ceDeptId = deptIds["Computer Engineering"];
    const cs101Course = await courseCollection.findOne({ courseCode: "CS101" });
    const cs201Course = await courseCollection.findOne({ courseCode: "CS201" });
    const fac001 = await facultyCollection.findOne({ facultyId: "FAC-CE-001" });
    const fac002 = await facultyCollection.findOne({ facultyId: "FAC-ME-002" });

    // Get student IDs
    const studentIds: Record<string, any> = {};
    const studentDocs = await studentCollection.find({}).toArray();
    for (const s of studentDocs) {
      studentIds[s.uid] = s._id;
    }

    // Create MSE Feedback Form with section-wise targeting
    const mseForm = {
      title: "MSE Feedback - Semester 1",
      feedbackType: "MSE_FEEDBACK",
      deptId: new ObjectId(ceDeptId),
      program: "BTECH",
      year: "FE",
      courseId: new ObjectId(cs101Course._id),
      courseName: cs101Course.courseName,
      facultyId: fac001.facultyId,
      facultyName: fac001.name,
      lectureTargets: [
        { division: "A", batches: ["A"] }
      ],
      labTargets: [
        { division: "A", batches: ["A"] }
      ],
      questions: {
        lecture: LECTURE_QUESTIONS.map(q => ({ questionText: q, type: "rating" })),
        lab: LAB_QUESTIONS.map(q => ({ questionText: q, type: "rating" }))
      },
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    let mseFormDoc = await feedbackFormCollection.findOne({ title: mseForm.title });
    if (!mseFormDoc) {
      const mseInsert = await feedbackFormCollection.insertOne(mseForm);
      mseFormDoc = { _id: mseInsert.insertedId, ...mseForm };
      console.log(`Created MSE feedback form`);
    }

    // Create ESE Feedback Form with section-wise targeting
    const eseForm = {
      title: "ESE Feedback - Semester 1",
      feedbackType: "ESE_FEEDBACK",
      deptId: new ObjectId(ceDeptId),
      program: "BTECH",
      year: "SE",
      courseId: new ObjectId(cs201Course._id),
      courseName: cs201Course.courseName,
      facultyId: fac001.facultyId,
      facultyName: fac001.name,
      lectureTargets: [
        { division: "B", batches: ["B"] }
      ],
      labTargets: [
        { division: "B", batches: ["B"] }
      ],
      questions: {
        lecture: LECTURE_QUESTIONS.map(q => ({ questionText: q, type: "rating" })),
        lab: LAB_QUESTIONS.map(q => ({ questionText: q, type: "rating" }))
      },
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    let eseFormDoc = await feedbackFormCollection.findOne({ title: eseForm.title });
    if (!eseFormDoc) {
      const eseInsert = await feedbackFormCollection.insertOne(eseForm);
      eseFormDoc = { _id: eseInsert.insertedId, ...eseForm };
      console.log(`Created ESE feedback form`);
    }

    // Create sample responses for MSE form
    if (studentIds["FE-CE-BTECH-001"]) {
      const mseMappingId = mseFormDoc._id;
      const studentId = studentIds["FE-CE-BTECH-001"];

      // Check if already submitted
      const existingStatus = await submissionStatusCollection.findOne({
        studentId: new ObjectId(studentId),
        mappingId: new ObjectId(mseMappingId)
      });

      if (!existingStatus) {
        // Create section-wise ratings (5-point scale: 1-5)
        const lectureRatings: any = {};
        const labRatings: any = {};
        LECTURE_QUESTIONS.forEach((_, idx) => {
          lectureRatings[`lecture_${idx}`] = Math.floor(Math.random() * 3) + 3; // 3-5
        });
        LAB_QUESTIONS.forEach((_, idx) => {
          labRatings[`lab_${idx}`] = Math.floor(Math.random() * 3) + 3; // 3-5
        });

        await submissionStatusCollection.insertOne({
          studentId: new ObjectId(studentId),
          mappingId: new ObjectId(mseMappingId),
          isSubmitted: true,
          createdAt: now,
          updatedAt: now
        });

        await feedbackResponseCollection.insertOne({
          mappingId: new ObjectId(mseMappingId),
          studentId: new ObjectId(studentId),
          lectureRatings,
          labRatings,
          ratings: { ...lectureRatings, ...labRatings }, // Legacy field for backward compatibility
          comments: "Great teaching methodology and clear explanations.",
          createdAt: now,
          updatedAt: now
        });
        console.log(`Created MSE feedback response for student FE-CE-BTECH-001`);
      }
    }

    // Create sample responses for ESE form
    if (studentIds["SE-ME-BTECH-002"]) {
      const eseMappingId = eseFormDoc._id;
      const studentId = studentIds["SE-ME-BTECH-002"];

      const existingStatus = await submissionStatusCollection.findOne({
        studentId: new ObjectId(studentId),
        mappingId: new ObjectId(eseMappingId)
      });

      if (!existingStatus) {
        const lectureRatings2: any = {};
        const labRatings2: any = {};
        LECTURE_QUESTIONS.forEach((_, idx) => {
          lectureRatings2[`lecture_${idx}`] = Math.floor(Math.random() * 3) + 3; // 3-5
        });
        LAB_QUESTIONS.forEach((_, idx) => {
          labRatings2[`lab_${idx}`] = Math.floor(Math.random() * 3) + 3; // 3-5
        });

        await submissionStatusCollection.insertOne({
          studentId: new ObjectId(studentId),
          mappingId: new ObjectId(eseMappingId),
          isSubmitted: true,
          createdAt: now,
          updatedAt: now
        });

        await feedbackResponseCollection.insertOne({
          mappingId: new ObjectId(eseMappingId),
          studentId: new ObjectId(studentId),
          lectureRatings: lectureRatings2,
          labRatings: labRatings2,
          ratings: { ...lectureRatings2, ...labRatings2 }, // Legacy field for backward compatibility
          comments: "Excellent course content and well-structured lab sessions.",
          createdAt: now,
          updatedAt: now
        });
        console.log(`Created ESE feedback response for student SE-ME-BTECH-002`);
      }
    }

    console.log("✅ Seeding completed.");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await client.close();
  }
}

seed();
