import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  active: boolean;
  lastLogin?: Date;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'SUPER_ADMIN'], default: 'ADMIN' },
  active: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

export const Admin = model<IAdmin>('Admin', AdminSchema);
