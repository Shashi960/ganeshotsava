import { Schema, model, Document } from 'mongoose';

export interface IFinancialRecord extends Document {
  year: string;
  category: string; // e.g. Donations, Offerings, Printing, etc.
  description: string; // e.g. "ದೇಣಿಗೆ" or "ಪ್ರಿಂಟಿಂಗ್"
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  visibility: 'PUBLIC' | 'ADMIN_ONLY' | 'SUPER_ADMIN_ONLY';
}

const FinancialRecordSchema = new Schema<IFinancialRecord>({
  year: { type: String, required: true, index: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  visibility: {
    type: String,
    enum: ['PUBLIC', 'ADMIN_ONLY', 'SUPER_ADMIN_ONLY'],
    default: 'PUBLIC',
    index: true
  }
}, { timestamps: true });

export const FinancialRecord = model<IFinancialRecord>('FinancialRecord', FinancialRecordSchema);
