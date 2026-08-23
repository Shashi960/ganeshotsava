import { Schema, model, Document, Types } from 'mongoose';

export interface IVolunteer extends Document {
  name: string;
  photo?: string;
  phone?: string;
  team?: Types.ObjectId;
  areas: Types.ObjectId[];
  events: Types.ObjectId[];
  availability?: string;
  active: boolean;
  year: string;
}

const VolunteerSchema = new Schema<IVolunteer>({
  name: { type: String, required: true },
  photo: { type: String },
  phone: { type: String },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  areas: [{ type: Schema.Types.ObjectId, ref: 'Place' }],
  events: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
  availability: { type: String },
  active: { type: Boolean, default: true },
  year: { type: String, required: true, index: true }
}, { timestamps: true });

export const Volunteer = model<IVolunteer>('Volunteer', VolunteerSchema);
