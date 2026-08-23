import { Schema, model, Document, Types } from 'mongoose';

export interface IPrasadaDelivery extends Document {
  participant: Types.ObjectId;
  homeName?: string;
  address?: string;
  place: Types.ObjectId;
  assignedVolunteer?: Types.ObjectId;
  status: 'PENDING' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'UNABLE_TO_DELIVER';
  assignedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  year: string;
}

const PrasadaDeliverySchema = new Schema<IPrasadaDelivery>({
  participant: { type: Schema.Types.ObjectId, ref: 'KatheParticipant', required: true },
  homeName: { type: String },
  address: { type: String },
  place: { type: Schema.Types.ObjectId, ref: 'Place', required: true, index: true },
  assignedVolunteer: { type: Schema.Types.ObjectId, ref: 'Volunteer' },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'UNABLE_TO_DELIVER'],
    default: 'PENDING',
    index: true
  },
  assignedAt: { type: Date },
  deliveredAt: { type: Date },
  notes: { type: String },
  year: { type: String, required: true, index: true }
}, { timestamps: true });

export const PrasadaDelivery = model<IPrasadaDelivery>('PrasadaDelivery', PrasadaDeliverySchema);
