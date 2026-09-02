import { Schema, model, Document, Types } from 'mongoose';

export type ApplicationStage = 'Saved' | 'Applied' | 'Assessment' | 'Interview' | 'Decision';
export type DecisionStatus = 'Selected' | 'Rejected' | 'Withdrawn';
export type WorkType = 'Remote' | 'Hybrid' | 'On-site';

export interface IDeadline {
  title: string;
  date: Date;
  completed: boolean;
}

export interface IApplication extends Document {
  userId: Types.ObjectId;
  company: string;
  role: string;
  location: string;
  workType: WorkType;
  source: string;
  stage: ApplicationStage;
  decisionStatus?: DecisionStatus;
  deadlines: IDeadline[];
  jobDescription?: string;
  requirements: string[];
  notes?: string;
  matchScore?: number;
  appliedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeadlineSchema = new Schema<IDeadline>(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    location: { type: String, default: 'Colombo' },
    workType: { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Hybrid' },
    source: { type: String, default: 'LinkedIn' },
    stage: {
      type: String,
      enum: ['Saved', 'Applied', 'Assessment', 'Interview', 'Decision'],
      default: 'Saved',
      index: true,
    },
    decisionStatus: {
      type: String,
      enum: ['Selected', 'Rejected', 'Withdrawn'],
    },
    deadlines: { type: [DeadlineSchema], default: [] },
    jobDescription: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    notes: { type: String, default: '' },
    matchScore: { type: Number, min: 0, max: 100 },
    appliedDate: { type: Date },
  },
  { timestamps: true }
);

export const Application = model<IApplication>('Application', ApplicationSchema);