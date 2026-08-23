import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuctionItem } from '../models/AuctionItem';
import { FinancialRecord } from '../models/FinancialRecord';
import { Year } from '../models/Year';
import { Setting } from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';

// Helper to determine role from token (optional)
const getRoleFromToken = (req: Request): 'PUBLIC' | 'ADMIN' | 'SUPER_ADMIN' => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return 'PUBLIC';
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction';
    const decoded = jwt.verify(token, secret) as any;
    return decoded.role || 'ADMIN';
  } catch {
    return 'PUBLIC';
  }
};

// ----------------- AUCTION CONTROLLERS -----------------
export const getAuctions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, paymentStatus, search, page = 1, limit = 50 } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemNameKannada: { $regex: search, $options: 'i' } },
        { buyer: { $regex: search, $options: 'i' } }
      ];
    }

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const skipIndex = (p - 1) * l;

    const total = await AuctionItem.countDocuments(filter);
    const auctions = await AuctionItem.find(filter)
      .sort({ createdAt: -1 })
      .limit(l)
      .skip(skipIndex);

    res.status(200).json({
      status: 'success',
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
      auctions
    });
  } catch (error) {
    next(error);
  }
};

export const getAuctionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const auction = await AuctionItem.findById(id);
    if (!auction) return next(new AppError('Auction item not found', 404));
    res.status(200).json({ status: 'success', auction });
  } catch (error) {
    next(error);
  }
};

export const createAuction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auction = await AuctionItem.create(req.body);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_AUCTION', 'AuctionItem', auction._id.toString(), null, auction, req);
    res.status(201).json({ status: 'success', auction });
  } catch (error) {
    next(error);
  }
};

export const updateAuction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldAuction = await AuctionItem.findById(id);
    if (!oldAuction) return next(new AppError('Auction item not found', 404));

    const data = { ...req.body };
    if (data.paymentStatus === 'PAID' && oldAuction.paymentStatus !== 'PAID') {
      data.paymentDate = new Date();
    }

    const auction = await AuctionItem.findByIdAndUpdate(id, data, { new: true });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_AUCTION', 'AuctionItem', id, oldAuction, auction, req);

    res.status(200).json({ status: 'success', auction });
  } catch (error) {
    next(error);
  }
};

export const deleteAuction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const auction = await AuctionItem.findById(id);
    if (!auction) return next(new AppError('Auction item not found', 404));

    await AuctionItem.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_AUCTION', 'AuctionItem', id, auction, null, req);

    res.status(200).json({ status: 'success', message: 'Auction item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- FINANCIALS CONTROLLERS -----------------
export const getFinancials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, type } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (type) filter.type = type;

    // Apply security filtering based on client authorization role
    const clientRole = getRoleFromToken(req);
    const settingGlobalVis = await Setting.findOne({ key: 'financialVisibility' });
    const globalVis = settingGlobalVis ? settingGlobalVis.value : 'PUBLIC';

    // If global settings restricts financial visibility to admins, and requester is public, block access
    if (globalVis === 'ADMIN_ONLY' && clientRole === 'PUBLIC') {
      res.status(200).json({ status: 'success', financials: [], message: 'Financials are restricted to Administrators.' });
      return;
    }
    if (globalVis === 'SUPER_ADMIN_ONLY' && clientRole !== 'SUPER_ADMIN') {
      res.status(200).json({ status: 'success', financials: [], message: 'Financials are restricted to Super Administrators.' });
      return;
    }

    // Role-based document level filters
    if (clientRole === 'PUBLIC') {
      filter.visibility = 'PUBLIC';
    } else if (clientRole === 'ADMIN') {
      filter.visibility = { $in: ['PUBLIC', 'ADMIN_ONLY'] };
    } // SUPER_ADMIN can see everything (no filter.visibility)

    const financials = await FinancialRecord.find(filter).sort({ type: 1, amount: -1 });
    res.status(200).json({ status: 'success', financials });
  } catch (error) {
    next(error);
  }
};

export const getFinancialsSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year } = req.query;
  try {
    let activeYear = year as string;
    if (!activeYear) {
      const yearDoc = await Year.findOne({ isCurrent: true });
      activeYear = yearDoc ? yearDoc.year : new Date().getFullYear().toString();
    }

    const clientRole = getRoleFromToken(req);
    const settingGlobalVis = await Setting.findOne({ key: 'financialVisibility' });
    const globalVis = settingGlobalVis ? settingGlobalVis.value : 'PUBLIC';

    if (globalVis === 'ADMIN_ONLY' && clientRole === 'PUBLIC') {
      res.status(200).json({ status: 'success', summary: { totalIncome: 0, totalExpenses: 0, balance: 0, categories: [] } });
      return;
    }
    if (globalVis === 'SUPER_ADMIN_ONLY' && clientRole !== 'SUPER_ADMIN') {
      res.status(200).json({ status: 'success', summary: { totalIncome: 0, totalExpenses: 0, balance: 0, categories: [] } });
      return;
    }

    const filter: any = { year: activeYear };
    if (clientRole === 'PUBLIC') {
      filter.visibility = 'PUBLIC';
    } else if (clientRole === 'ADMIN') {
      filter.visibility = { $in: ['PUBLIC', 'ADMIN_ONLY'] };
    }

    const records = await FinancialRecord.find(filter);

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryGroupMap: { [key: string]: { income: number; expense: number } } = {};

    records.forEach(rec => {
      const isIncome = rec.type === 'INCOME';
      if (isIncome) {
        totalIncome += rec.amount;
      } else {
        // Carry forward balance is recorded in our brochure as an expense category (ಶಿಲ್ಕು)
        // We will exclude it from actual operational expenses computation so balance logic holds.
        if (rec.category !== 'Carry Forward Balance') {
          totalExpenses += rec.amount;
        }
      }

      if (!categoryGroupMap[rec.category]) {
        categoryGroupMap[rec.category] = { income: 0, expense: 0 };
      }
      if (isIncome) {
        categoryGroupMap[rec.category].income += rec.amount;
      } else {
        categoryGroupMap[rec.category].expense += rec.amount;
      }
    });

    const categories = Object.keys(categoryGroupMap).map(catName => ({
      name: catName,
      income: categoryGroupMap[catName].income,
      expense: categoryGroupMap[catName].expense
    }));

    res.status(200).json({
      status: 'success',
      summary: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createFinancialRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await FinancialRecord.create(req.body);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_FINANCIAL_RECORD', 'FinancialRecord', record._id.toString(), null, record, req);
    res.status(201).json({ status: 'success', record });
  } catch (error) {
    next(error);
  }
};

export const updateFinancialRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldRec = await FinancialRecord.findById(id);
    if (!oldRec) return next(new AppError('Financial record not found', 404));

    const record = await FinancialRecord.findByIdAndUpdate(id, req.body, { new: true });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_FINANCIAL_RECORD', 'FinancialRecord', id, oldRec, record, req);

    res.status(200).json({ status: 'success', record });
  } catch (error) {
    next(error);
  }
};

export const deleteFinancialRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const record = await FinancialRecord.findById(id);
    if (!record) return next(new AppError('Financial record not found', 404));

    await FinancialRecord.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_FINANCIAL_RECORD', 'FinancialRecord', id, record, null, req);

    res.status(200).json({ status: 'success', message: 'Financial record deleted successfully' });
  } catch (error) {
    next(error);
  }
};
