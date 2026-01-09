import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmissionStatus extends Document {
  studentId: mongoose.Types.ObjectId;
  mappingId: mongoose.Types.ObjectId;
  isSubmitted: boolean;
}

const SubmissionStatusSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mappingId: { type: Schema.Types.ObjectId, ref: 'Mapping', required: true },
  isSubmitted: { type: Boolean, default: true }
});

// Compound index to ensure one student can only submit one feedback per mapping
SubmissionStatusSchema.index({ studentId: 1, mappingId: 1 }, { unique: true });

export default mongoose.models.SubmissionStatus || mongoose.model<ISubmissionStatus>('SubmissionStatus', SubmissionStatusSchema);