import { Schema, model, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  titleKannada: string;
  description?: string;
  descriptionKannada?: string;
  date: Date;
  startTime: string;
  endTime?: string;
  location: string;
  category: 'Puja' | 'Religious' | 'Cultural' | 'Community' | 'Food' | 'Volunteer' | 'Procession' | 'Immersion' | 'Other';
  image?: string;
  year: string;
  status: 'Upcoming' | 'Starting Soon' | 'Happening Now' | 'Completed';
  team?: Types.ObjectId;
  volunteers: Types.ObjectId[];
  featured: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  titleKannada: { type: String, required: true },
  description: { type: String },
  descriptionKannada: { type: String },
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  location: { type: String, required: true },
  category: {
    type: String,
    enum: ['Puja', 'Religious', 'Cultural', 'Community', 'Food', 'Volunteer', 'Procession', 'Immersion', 'Other'],
    required: true,
    index: true
  },
  image: { type: String },
  year: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['Upcoming', 'Starting Soon', 'Happening Now', 'Completed'],
    default: 'Upcoming'
  },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  volunteers: [{ type: Schema.Types.ObjectId, ref: 'Volunteer' }],
  featured: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

export const Event = model<IEvent>('Event', EventSchema);
