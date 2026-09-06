import { Schema, model, Document, Types } from 'mongoose';

export interface IVideo extends Document {
  youtubeVideoId: string;
  title: string;
  year: string;
  // Legacy optional fields for backward compatibility with existing records
  youtubeUrl?: string;
  thumbnail?: string;
  description?: string;
  event?: Types.ObjectId;
}

const VideoSchema = new Schema<IVideo>({
  youtubeVideoId: { type: String, required: true, trim: true, index: true },
  title: { type: String, required: true, trim: true },
  year: { type: String, required: true, default: '2026', index: true },
  // Legacy fields (optional, not stored in new records)
  youtubeUrl: { type: String },
  thumbnail: { type: String },
  description: { type: String },
  event: { type: Schema.Types.ObjectId, ref: 'Event' }
}, { timestamps: true });

export const Video = model<IVideo>('Video', VideoSchema);

