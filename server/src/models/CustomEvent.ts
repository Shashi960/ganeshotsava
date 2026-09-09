import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomEvent extends Document {
  title: string;
  titleKannada: string;
  slug: string;
  description?: string;
  descriptionKannada?: string;
  accessPermission: 'PUBLIC' | 'ADMIN_ONLY';
  status: 'ACTIVE' | 'CLOSED';
  showInNavbar: boolean;
  categoryOptions: string[];
  enableQuantity: boolean;
  year: string;
  registrationsCount: number;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomEventSchema = new Schema<ICustomEvent>(
  {
    title: { type: String, required: true, trim: true },
    titleKannada: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    description: { type: String, trim: true },
    descriptionKannada: { type: String, trim: true },
    accessPermission: {
      type: String,
      enum: ['PUBLIC', 'ADMIN_ONLY'],
      default: 'PUBLIC',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    showInNavbar: { type: Boolean, default: true },
    categoryOptions: [{ type: String, trim: true }],
    enableQuantity: { type: Boolean, default: false },
    year: { type: String, required: true, default: '2026', index: true },
    registrationsCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

export const CustomEvent = model<ICustomEvent>('CustomEvent', CustomEventSchema);
