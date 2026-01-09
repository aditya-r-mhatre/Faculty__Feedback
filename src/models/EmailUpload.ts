import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailUpload extends Document {
  label: string;
  filename?: string;
  uploadedAt: Date;
  records: Array<{
    name: string;
    email: string;
  }>;
}

const EmailUploadSchema: Schema = new Schema({
  label: { type: String, required: true },
  filename: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  records: [{
    name: { type: String, required: true },
    email: { type: String, required: true }
  }]
}, { timestamps: true });

export default mongoose.models.EmailUpload || mongoose.model<IEmailUpload>('EmailUpload', EmailUploadSchema);
