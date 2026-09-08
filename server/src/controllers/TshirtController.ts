import { Request, Response, NextFunction } from 'express';
import { TshirtOrder } from '../models/TshirtOrder';
import { Member } from '../models/Member';
import { Setting } from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/audit';

const VALID_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;
type TshirtSize = typeof VALID_SIZES[number];

// Helper to determine active operational year
const getTargetYear = async (req: Request): Promise<string> => {
  if (req.query.year && typeof req.query.year === 'string') {
    return req.query.year;
  }
  const setting = await Setting.findOne({ key: 'currentYear' });
  return (setting?.value as string) || '2026';
};

/**
 * GET /tshirt
 * Returns all recorded T-shirt orders and size breakdown summary for the year
 */
export const getTshirtOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = await getTargetYear(req);
    const orders = await TshirtOrder.find({ year })
      .populate('member', 'firstName lastName homeName memberType photo')
      .sort({ createdAt: -1 });

    const breakdown: Record<TshirtSize, number> = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
    };

    const typeBreakdown: Record<string, number> = {
      Member: 0,
      'Junior Member': 0,
      'Senior Member': 0,
      'Committee Member': 0,
      Volunteer: 0,
      Other: 0,
    };

    orders.forEach((ord) => {
      const s = ord.size as TshirtSize;
      if (breakdown[s] !== undefined) {
        breakdown[s] = (breakdown[s] || 0) + 1;
      }
      const t = ord.memberType || 'Other';
      typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
    });

    res.status(200).json({
      status: 'success',
      orders,
      stats: {
        total: orders.length,
        breakdown,
        typeBreakdown,
        year,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /tshirt/available-members
 * Returns active members who have NOT yet registered a T-shirt for the year
 */
export const getAvailableMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = await getTargetYear(req);

    // Find all member IDs that already have a T-shirt order for this year
    const existingOrders = await TshirtOrder.find(
      { year, member: { $exists: true, $ne: null } },
      { member: 1 }
    ).lean();

    const existingMemberIds = existingOrders
      .map((o) => o.member?.toString())
      .filter((id): id is string => Boolean(id));

    // Fetch members who do NOT yet have an order
    const availableMembers = await Member.find({
      _id: { $nin: existingMemberIds },
      active: true,
      year,
    })
      .sort({ memberType: 1, firstName: 1, lastName: 1 })
      .select('firstName lastName homeName memberType photo phone role');

    res.status(200).json({
      status: 'success',
      members: availableMembers,
      totalAvailable: availableMembers.length,
      year,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /tshirt
 * Create single or bulk T-shirt size orders
 */
export const createTshirtOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = req.body.year || (await getTargetYear(req));

    // Support single item or multiple items in one request
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [req.body];

    if (!rawItems || rawItems.length === 0) {
      return next(new AppError('No T-shirt items provided', 400));
    }

    const createdOrders = [];

    for (const item of rawItems) {
      const size = (item.size || '').trim().toUpperCase();
      if (!VALID_SIZES.includes(size as TshirtSize)) {
        return next(new AppError(`Invalid T-shirt size: "${item.size}". Must be one of: ${VALID_SIZES.join(', ')}`, 400));
      }

      if (item.memberId) {
        // Link to existing member
        const member = await Member.findById(item.memberId);
        if (!member) {
          return next(new AppError(`Member not found for ID: ${item.memberId}`, 404));
        }

        // Check if member already registered for this year
        const existing = await TshirtOrder.findOne({ member: member._id, year });
        if (existing) {
          return next(new AppError(`Member "${member.firstName} ${member.lastName}" already has a recorded T-shirt order`, 400));
        }

        const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
        const order = await TshirtOrder.create({
          member: member._id,
          name: fullName,
          homeName: member.homeName || item.homeName,
          memberType: member.memberType,
          size,
          phone: member.phone || item.phone,
          notes: item.notes,
          year,
        });

        createdOrders.push(order);
      } else {
        // Custom "Other" entry
        const customName = (item.name || '').trim();
        if (!customName) {
          return next(new AppError('Devotee / Member name is required when selecting "Other"', 400));
        }

        const order = await TshirtOrder.create({
          name: customName,
          homeName: (item.homeName || '').trim(),
          memberType: 'Other',
          size,
          phone: (item.phone || '').trim(),
          notes: item.notes,
          year,
        });

        createdOrders.push(order);
      }
    }

    res.status(201).json({
      status: 'success',
      message: `${createdOrders.length} T-shirt size order(s) recorded successfully`,
      orders: createdOrders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /tshirt/:id
 * Update an existing T-shirt order
 */
export const updateTshirtOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const existing = await TshirtOrder.findById(id);
    if (!existing) {
      return next(new AppError('T-shirt order not found', 404));
    }

    if (req.body.size) {
      const size = req.body.size.trim().toUpperCase();
      if (!VALID_SIZES.includes(size as TshirtSize)) {
        return next(new AppError(`Invalid size: ${req.body.size}. Must be: ${VALID_SIZES.join(', ')}`, 400));
      }
      existing.size = size as TshirtSize;
    }

    if (req.body.name && !existing.member) {
      existing.name = req.body.name.trim();
    }
    if (req.body.homeName !== undefined) existing.homeName = req.body.homeName.trim();
    if (req.body.phone !== undefined) existing.phone = req.body.phone.trim();
    if (req.body.notes !== undefined) existing.notes = req.body.notes.trim();

    await existing.save();

    res.status(200).json({
      status: 'success',
      message: 'T-shirt order updated successfully',
      order: existing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /tshirt/:id
 * Delete a T-shirt order (returns member back to unassigned list)
 */
export const deleteTshirtOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const order = await TshirtOrder.findById(id);
    if (!order) {
      return next(new AppError('T-shirt order not found', 404));
    }

    await TshirtOrder.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: `T-shirt order for "${order.name}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /tshirt/clear/all
 * Admin only: Clear all T-shirt orders for the active year
 */
export const clearAllTshirtOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = await getTargetYear(req);
    const result = await TshirtOrder.deleteMany({ year });

    if (req.user) {
      await logActivity(
        req.user.email || 'ADMIN',
        req.user.role || 'ADMIN',
        'CLEAR_TSHIRT_ORDERS',
        'TshirtOrder',
        'ALL',
        null,
        { year, deletedCount: result.deletedCount },
        req
      );
    }

    res.status(200).json({
      status: 'success',
      message: `All ${result.deletedCount} T-shirt orders for ${year} cleared successfully`,
    });
  } catch (error) {
    next(error);
  }
};
