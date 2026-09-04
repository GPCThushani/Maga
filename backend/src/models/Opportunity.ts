import mongoose, { Document, Schema } from 'mongoose';

export interface IOpportunity extends Document {
  company: string;
  role: string;
  location: string;
  workType: string;
  url: string;
  requirements: string[];
  salary?: string;
  isLocal: boolean;
  createdAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>({
  company: { type: String, required: true },
  role: { type: String, required: true },
  location: { type: String, default: 'Colombo, Sri Lanka' },
  workType: { type: String, default: 'Hybrid' },
  url: { type: String, required: true },
  requirements: [{ type: String }],
  salary: { type: String, default: 'LKR Stipend' },
  isLocal: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);