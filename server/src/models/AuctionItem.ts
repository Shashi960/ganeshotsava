import { Schema, model, Document } from 'mongoose';

export interface IAuctionItem extends Document {
  year: string;
  itemName: string;
  itemNameKannada: string;
  buyer?: string;
  amount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
  paymentDate?: Date;
  notes?: string;
}

const AuctionItemSchema = new Schema<IAuctionItem>({
  year: { type: String, required: true, index: true },
  itemName: { type: String, required: true },
  itemNameKannada: { type: String, required: true },
  buyer: { type: String },
  amount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'UNPAID', 'PARTIALLY_PAID'],
    default: 'UNPAID',
    index: true
  },
  paymentDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

export const AuctionItem = model<IAuctionItem>('AuctionItem', AuctionItemSchema);
