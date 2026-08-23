import { Schema, model, Document, Types } from 'mongoose';

export interface IVideo extends Document {
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  description?: string;
  year: string;
  event?: Types.ObjectId;
  thumbnail?: string;
}

const VideoSchema = new Schema<IVideo>({
  youtubeUrl: { type: String, required: true },
  youtubeVideoId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  year: { type: String, required: true, index: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event' },
  thumbnail: { type: String }
}, { timestamps: true });

export const Video = model<IVideo>('Video', VideoSchema);
