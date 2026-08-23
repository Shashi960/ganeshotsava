import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !admin.active) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    admin.lastLogin = new Date();
    await admin.save();

    const secret = process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction';
    const expires = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      secret,
      { expiresIn: expires } as any
    );

    await logActivity(admin.email, admin.role, 'LOGIN', 'Admin', admin._id.toString(), null, null, req);

    res.status(200).json({
      status: 'success',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmins = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admins = await Admin.find().select('-passwordHash');
    res.status(200).json({ status: 'success', admins });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { email, password, role } = req.body;
  try {
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return next(new AppError('Admin email already exists', 400));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'ADMIN',
      active: true
    });

    await logActivity(req.user?.email || 'SYSTEM', req.user?.role || 'SUPER_ADMIN', 'CREATE_ADMIN', 'Admin', newAdmin._id.toString(), null, { email: newAdmin.email, role: newAdmin.role }, req);

    res.status(201).json({
      status: 'success',
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role,
        active: newAdmin.active
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { role, active, password } = req.body;
  try {
    const admin = await Admin.findById(id);
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    const oldValue = { role: admin.role, active: admin.active };
    if (role) admin.role = role;
    if (active !== undefined) admin.active = active;
    if (password) {
      admin.passwordHash = await bcrypt.hash(password, 10);
    }

    await admin.save();
    await logActivity(req.user?.email || 'SYSTEM', req.user?.role || 'SUPER_ADMIN', 'UPDATE_ADMIN', 'Admin', admin._id.toString(), oldValue, { role: admin.role, active: admin.active }, req);

    res.status(200).json({
      status: 'success',
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        active: admin.active
      }
    });
  } catch (error) {
    next(error);
  }
};
