import { Schema, model, Document } from 'mongoose';

export interface IYear extends Document {
  year: string;
  isCurrent: boolean;
  status: 'active' | 'archived';
  createdAt: Date;
}

const YearSchema = new Schema<IYear>({
  year: { type: String, required: true, unique: true, index: true },
  isCurrent: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

export const Year = model<IYear>('Year', YearSchema);
