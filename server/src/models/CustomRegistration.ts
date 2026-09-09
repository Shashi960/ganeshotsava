import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomRegistration extends Document {
  eventId: Types.ObjectId;
  name: string;
  phone?: string;
  homeName?: string;
  category?: string;
  quantity: number;
  notes?: string;
  registeredBy: 'PUBLIC' | 'ADMIN';
  year: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomRegistrationSchema = new Schema<ICustomRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'CustomEvent', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    homeName: { type: String, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1, required: true },
    notes: { type: String, trim: true },
    registeredBy: {
      type: String,
      enum: ['PUBLIC', 'ADMIN'],
      default: 'PUBLIC',
      required: true,
    },
    year: { type: String, required: true, default: '2026', index: true },
  },
  { timestamps: true }
);

CustomRegistrationSchema.index({ eventId: 1, createdAt: -1 });

export const CustomRegistration = model<ICustomRegistration>('CustomRegistration', CustomRegistrationSchema);
