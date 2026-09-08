import { Schema, model, Document, Types } from 'mongoose';

export interface ITshirtOrder extends Document {
  member?: Types.ObjectId;
  name: string;
  nameKannada?: string;
  homeName?: string;
  memberType: 'Member' | 'Junior Member' | 'Senior Member' | 'Committee Member' | 'Volunteer' | 'Other';
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
  phone?: string;
  notes?: string;
  year: string;
  createdAt: Date;
  updatedAt: Date;
}

const TshirtOrderSchema = new Schema<ITshirtOrder>(
  {
    member: { type: Schema.Types.ObjectId, ref: 'Member' },
    name: { type: String, required: true, trim: true },
    nameKannada: { type: String, trim: true },
    homeName: { type: String, trim: true },
    memberType: {
      type: String,
      enum: ['Member', 'Junior Member', 'Senior Member', 'Committee Member', 'Volunteer', 'Other'],
      default: 'Member',
      required: true,
    },
    size: {
      type: String,
      enum: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
      required: true,
    },
    phone: { type: String, trim: true },
    notes: { type: String, trim: true },
    year: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Compound index to avoid duplicates for the same member in the same year
TshirtOrderSchema.index({ member: 1, year: 1 }, { unique: true, sparse: true });
TshirtOrderSchema.index({ year: 1, size: 1 });

export const TshirtOrder = model<ITshirtOrder>('TshirtOrder', TshirtOrderSchema);
