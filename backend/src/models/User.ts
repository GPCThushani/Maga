import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  university?: string;
  degree?: string;
  gradYear?: number;
  targetRole?: string;
  skills: string[];
  cvUrl?: string;
  cvRawText?: string;
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    university: { type: String, default: '' },
    degree: { type: String, default: '' },
    gradYear: { type: Number },
    targetRole: { type: String, default: 'Full Stack Developer Intern' },
    skills: { type: [String], default: [] },
    cvUrl: { type: String, default: '' },
    cvRawText: { type: String, default: '' },
    resetPasswordOtp: { type: String, default: null },
    resetPasswordOtpExpires: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', UserSchema);