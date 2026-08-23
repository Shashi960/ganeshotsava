import { Schema, model, Document, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  titleKannada: string;
  description: string;
  descriptionKannada: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdBy?: Types.ObjectId;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  titleKannada: { type: String, required: true },
  description: { type: String, required: true },
  descriptionKannada: { type: String, required: true },
  priority: { type: String, enum: ['NORMAL', 'IMPORTANT', 'URGENT'], default: 'NORMAL' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

export const Announcement = model<IAnnouncement>('Announcement', AnnouncementSchema);
