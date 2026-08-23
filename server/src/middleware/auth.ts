import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
  };
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided. Please log in.', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction';
    const decoded = jwt.verify(token, secret) as any;

    (req as AuthRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
};

export const requireRole = (roles: Array<'ADMIN' | 'SUPER_ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
};
