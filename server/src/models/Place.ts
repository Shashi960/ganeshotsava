import { Schema, model, Document, Types } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  nameKannada: string;
  description?: string;
  active: boolean;
  year: string;
  createdBy?: Types.ObjectId;
}

const PlaceSchema = new Schema<IPlace>({
  name: { type: String, required: true },
  nameKannada: { type: String, required: true },
  description: { type: String },
  active: { type: Boolean, default: true },
  year: { type: String, required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

// Compound index to allow same place name in different years, but unique within a year
PlaceSchema.index({ name: 1, year: 1 }, { unique: true });

export const Place = model<IPlace>('Place', PlaceSchema);
