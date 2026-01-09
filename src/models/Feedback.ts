import mongoose, { Schema } from 'mongoose';

const FeedbackFormSchema = new Schema({
  title: { type: String, required: true },
  feedbackType: { 
    type: String, 
    enum: ['MSE_FEEDBACK', 'ESE_FEEDBACK', 'COURSE_EXIT'], 
    required: true 
  },
  deptId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  program: { type: String, enum: ['BTECH', 'MTECH', 'MCA'], required: true },
  year: { type: String, enum: ['FE', 'SE', 'TE', 'BE'], required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  courseName: { type: String }, // Cached for display
  facultyId: { type: String }, // Faculty directory facultyId (optional, only for MSE/ESE)
  facultyName: { type: String }, // Cached for display
  // Legacy targeting (for COURSE_EXIT and backward compatibility)
  targets: [{
    division: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    batches: [{ type: String, enum: ['A', 'B', 'C', 'D'] }] // Empty array means all batches
  }],
  // Section-wise targeting for MSE/ESE feedback
  lectureTargets: [{
    division: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    batches: [{ type: String, enum: ['A', 'B', 'C', 'D'] }] // Empty array means all batches
  }],
  labTargets: [{
    division: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    batches: [{ type: String, enum: ['A', 'B', 'C', 'D'] }] // Empty array means all batches
  }],
  // Questions structure: for MSE/ESE has lecture and lab sections, for COURSE_EXIT just array
  questions: {
    lecture: [{
      questionText: { type: String, required: true },
      type: { type: String, enum: ['rating', 'text'], default: 'rating' }
    }],
    lab: [{
      questionText: { type: String, required: true },
      type: { type: String, enum: ['rating', 'text'], default: 'rating' }
    }],
    // For COURSE_EXIT, use general array
    general: [{
      questionText: { type: String, required: true },
      type: { type: String, enum: ['rating', 'text'], default: 'rating' }
    }]
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.FeedbackForm || mongoose.model('FeedbackForm', FeedbackFormSchema);
