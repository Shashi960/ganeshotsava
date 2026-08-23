import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user: string | Types.ObjectId; // Email or ObjectId
  role: string;
  action: string; // e.g. "CREATE_EVENT", "UPDATE_PRASADA", etc.
  entity: string; // e.g. "Event", "PrasadaDelivery"
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  ip?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  user: { type: Schema.Types.Mixed, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
  ip: { type: String }
});

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
