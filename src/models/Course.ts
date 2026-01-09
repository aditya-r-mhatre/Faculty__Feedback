import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  courseCode: string;
  courseName: string;
  dept: mongoose.Types.ObjectId | string;
  program: 'BTECH' | 'MTECH' | 'MCA';
}

const CourseSchema: Schema = new Schema({
  courseCode: { type: String, required: true, unique: true },
  courseName: { type: String, required: true },
  dept: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  program: { type: String, enum: ['BTECH', 'MTECH', 'MCA'], required: true }
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
