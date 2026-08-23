import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';

export const logActivity = async (
  user: string | any,
  role: string,
  action: string,
  entity: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
  req?: Request
) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress) : undefined;
    await AuditLog.create({
      user,
      role,
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      ip
    });
  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
};
