import { Schema, model, Document, Types } from 'mongoose';

export interface IMember extends Document {
  firstName: string;
  lastName: string;
  homeName?: string;
  photo?: string;
  address?: string;
  phone?: string;
  email?: string;
  memberType: 'Senior Member' | 'Member' | 'Junior Member' | 'Committee Member' | 'Volunteer';
  team?: Types.ObjectId;
  role?: string;
  yearJoined?: number;
  active: boolean;
  notes?: string;
  year: string;
}

const MemberSchema = new Schema<IMember>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  homeName: { type: String },
  photo: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  memberType: {
    type: String,
    enum: ['Senior Member', 'Member', 'Junior Member', 'Committee Member', 'Volunteer'],
    required: true
  },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  role: { type: String },
  yearJoined: { type: Number },
  active: { type: Boolean, default: true },
  notes: { type: String },
  year: { type: String, required: true, index: true }
}, { timestamps: true });

// Index name and year
MemberSchema.index({ firstName: 1, lastName: 1, year: 1 });

export const Member = model<IMember>('Member', MemberSchema);
