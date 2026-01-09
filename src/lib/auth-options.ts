import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "./db";
import Admin from "@/models/Admin";
import Student from "@/models/Student";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username/Email/UID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectDB();

        // Try Admin first (by username or email)
        const admin = await Admin.findOne({
          $or: [
            { username: credentials.username },
            { email: credentials.username }
          ]
        });

        if (admin) {
          const isValid = await bcrypt.compare(credentials.password, admin.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }
          return {
            id: admin._id.toString(),
            username: admin.username,
            email: admin.email,
            role: "ADMIN",
          };
        }

        // Try Student (by uid or email)
        const student = await Student.findOne({
          $or: [
            { uid: credentials.username },
            { email: credentials.username }
          ]
        });

        if (student) {
          const isValid = await bcrypt.compare(credentials.password, student.password);
          if (!isValid) {
            throw new Error("Invalid password");
          }
          return {
            id: student._id.toString(),
            username: student.uid,
            email: student.email,
            name: student.name,
            role: "STUDENT",
            uid: student.uid,
            deptId: student.dept ? String(student.dept) : undefined,
            program: student.program,
            year: student.year,
            division: student.division,
            batch: student.batch,
          };
        }

        throw new Error("User not found");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      await connectDB();

      // Initial login
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
        if (user.role === "STUDENT") {
          token.uid = (user as any).uid;
          token.name = (user as any).name;
          token.deptId = (user as any).deptId;
          token.program = (user as any).program;
          token.year = (user as any).year;
          token.division = (user as any).division;
          token.batch = (user as any).batch;
        }
        return token;
      }

      // Refresh token data from DB on every session update
      if (token?.id && token?.role) {
        if (token.role === "ADMIN") {
          const dbAdmin = await Admin.findById(token.id).lean();
          if (dbAdmin) {
            token.username = dbAdmin.username;
            token.email = dbAdmin.email;
            token.role = "ADMIN";
          }
        } else if (token.role === "STUDENT") {
          const dbStudent = await Student.findById(token.id).lean();
          if (dbStudent) {
            token.username = dbStudent.uid;
            token.email = dbStudent.email;
            token.name = dbStudent.name;
            token.uid = dbStudent.uid;
            // dept is ObjectId, convert to string
            token.deptId = dbStudent.dept ? String(dbStudent.dept) : undefined;
            token.program = dbStudent.program;
            token.year = dbStudent.year;
            token.division = dbStudent.division;
            token.batch = dbStudent.batch;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        if (token.role === "STUDENT") {
          (session.user as any).uid = token.uid as string;
          (session.user as any).name = token.name as string;
          (session.user as any).deptId = token.deptId as string;
          (session.user as any).program = token.program as string;
          (session.user as any).year = token.year as string;
          (session.user as any).division = token.division as string;
          (session.user as any).batch = token.batch as string;
        }
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};