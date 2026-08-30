import { Schema, model, Document, Types } from 'mongoose';

export interface IKatheParticipant extends Document {
  firstName: string;
  lastName: string;
  homeName?: string;
  address?: string;
  place: Types.ObjectId;
  phone?: string;
  registrationStatus: 'PENDING' | 'CONFIRMED';
  confirmed: boolean;
  notes?: string;
  bookNo?: string;
  year: string;
}

const KatheParticipantSchema = new Schema<IKatheParticipant>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  homeName: { type: String },
  address: { type: String },
  place: { type: Schema.Types.ObjectId, ref: 'Place', required: true, index: true },
  phone: { type: String },
  registrationStatus: { type: String, enum: ['PENDING', 'CONFIRMED'], default: 'PENDING' },
  confirmed: { type: Boolean, default: false },
  notes: { type: String },
  bookNo: { type: String },
  year: { type: String, required: true, index: true }
}, { timestamps: true });

export const KatheParticipant = model<IKatheParticipant>('KatheParticipant', KatheParticipantSchema);
