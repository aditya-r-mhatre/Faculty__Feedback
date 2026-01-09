import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  uid: string;
  name: string;
  email: string;
  year: 'FE' | 'SE' | 'TE' | 'BE';
  program: 'BTECH' | 'MTECH' | 'MCA';
  dept: mongoose.Types.ObjectId | string;
  division: 'A' | 'B' | 'C' | 'D';
  batch: 'A' | 'B' | 'C' | 'D';
  password: string;
}

const StudentSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  year: { type: String, enum: ['FE', 'SE', 'TE', 'BE'], required: true },
  program: { type: String, enum: ['BTECH', 'MTECH', 'MCA'], required: true },
  dept: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  division: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  batch: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
