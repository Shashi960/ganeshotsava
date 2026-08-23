import { Schema, model, Document, Types } from 'mongoose';

export interface IPhoto extends Document {
  image: string;
  caption?: string;
  year: string;
  event?: Types.ObjectId;
  category?: string;
  uploadedBy?: Types.ObjectId;
}

const PhotoSchema = new Schema<IPhoto>({
  image: { type: String, required: true },
  caption: { type: String },
  year: { type: String, required: true, index: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  category: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

export const Photo = model<IPhoto>('Photo', PhotoSchema);
