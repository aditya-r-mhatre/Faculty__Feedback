import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedbackResponse extends Document {
  mappingId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  ratings?: any; // Legacy field for backward compatibility
  lectureRatings?: any; // Section-wise ratings for MSE/ESE
  labRatings?: any; // Section-wise ratings for MSE/ESE
  comments?: string;
}

const FeedbackResponseSchema: Schema = new Schema({
  mappingId: { type: Schema.Types.ObjectId, ref: 'Mapping', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ratings: { type: Schema.Types.Mixed }, // Legacy - kept for backward compatibility
  lectureRatings: { type: Schema.Types.Mixed }, // Section-wise ratings
  labRatings: { type: Schema.Types.Mixed }, // Section-wise ratings
  comments: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.FeedbackResponse || mongoose.model<IFeedbackResponse>('FeedbackResponse', FeedbackResponseSchema);
