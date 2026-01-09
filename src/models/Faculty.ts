import mongoose, { Schema, Document } from 'mongoose';

export interface IFaculty extends Document {
  facultyId: string;
  name: string;
  dept: mongoose.Types.ObjectId | string;
}

const FacultySchema: Schema = new Schema({
  facultyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dept: { type: Schema.Types.ObjectId, ref: 'Department', required: true }
}, { timestamps: true });

export default mongoose.models.Faculty || mongoose.model<IFaculty>('Faculty', FacultySchema);
