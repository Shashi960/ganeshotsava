import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  nameKannada: string;
  description?: string;
  leader?: Types.ObjectId;
  members: Types.ObjectId[];
  active: boolean;
  year: string;
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  nameKannada: { type: String, required: true },
  description: { type: String },
  leader: { type: Schema.Types.ObjectId, ref: 'Member' },
  members: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
  active: { type: Boolean, default: true },
  year: { type: String, required: true, index: true }
}, { timestamps: true });

TeamSchema.index({ name: 1, year: 1 }, { unique: true });

export const Team = model<ITeam>('Team', TeamSchema);
