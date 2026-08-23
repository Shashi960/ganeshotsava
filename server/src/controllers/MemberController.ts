import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Member } from '../models/Member';
import { Team } from '../models/Team';
import { Volunteer } from '../models/Volunteer';
import { Year } from '../models/Year';
import { Setting } from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';

// Helper to check if requester is logged in as admin
const isUserAdmin = (req: Request): boolean => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction';
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
};

// ----------------- MEMBERS CONTROLLERS -----------------
export const getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, memberType, active, search, page = 1, limit = 50 } = req.query;
  const filter: any = {};

  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }

    if (memberType) filter.memberType = memberType;
    if (active) filter.active = active === 'true';

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { homeName: { $regex: search, $options: 'i' } }
      ];
    }

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const skipIndex = (p - 1) * l;

    const total = await Member.countDocuments(filter);
    let query: any = Member.find(filter).populate('team').sort({ firstName: 1 }).limit(l).skip(skipIndex);

    // Apply privacy settings if public user
    const privacy = await Setting.findOne({ key: 'memberPrivacy' });
    const shouldHideContacts = privacy ? privacy.value === 'HIDE_CONTACT' : true;
    const isAdmin = isUserAdmin(req);

    if (shouldHideContacts && !isAdmin) {
      query = query.select('-phone -email -notes');
    }

    const members = await query;

    res.status(200).json({
      status: 'success',
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
      members
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    let query: any = Member.findById(id).populate('team');
    const privacy = await Setting.findOne({ key: 'memberPrivacy' });
    const shouldHideContacts = privacy ? privacy.value === 'HIDE_CONTACT' : true;
    const isAdmin = isUserAdmin(req);

    if (shouldHideContacts && !isAdmin) {
      query = query.select('-phone -email -notes');
    }

    const member = await query;
    if (!member) {
      return next(new AppError('Member not found', 404));
    }
    res.status(200).json({ status: 'success', member });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const member = await Member.create(req.body);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_MEMBER', 'Member', member._id.toString(), null, member, req);
    res.status(201).json({ status: 'success', member });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldMember = await Member.findById(id);
    if (!oldMember) return next(new AppError('Member not found', 404));

    const member = await Member.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_MEMBER', 'Member', id, oldMember, member, req);

    res.status(200).json({ status: 'success', member });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const member = await Member.findById(id);
    if (!member) return next(new AppError('Member not found', 404));

    await Member.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_MEMBER', 'Member', id, member, null, req);

    res.status(200).json({ status: 'success', message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- TEAMS CONTROLLERS -----------------
export const getTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, active } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (active) filter.active = active === 'true';

    const teams = await Team.find(filter)
      .populate('leader')
      .populate('members')
      .sort({ name: 1 });

    res.status(200).json({ status: 'success', teams });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const team = await Team.findById(id).populate('leader').populate('members');
    if (!team) return next(new AppError('Team not found', 404));
    res.status(200).json({ status: 'success', team });
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await Team.create(req.body);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_TEAM', 'Team', team._id.toString(), null, team, req);
    res.status(201).json({ status: 'success', team });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldTeam = await Team.findById(id);
    if (!oldTeam) return next(new AppError('Team not found', 404));

    const team = await Team.findByIdAndUpdate(id, req.body, { new: true });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_TEAM', 'Team', id, oldTeam, team, req);

    res.status(200).json({ status: 'success', team });
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const team = await Team.findById(id);
    if (!team) return next(new AppError('Team not found', 404));

    await Team.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_TEAM', 'Team', id, team, null, req);

    res.status(200).json({ status: 'success', message: 'Team deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- VOLUNTEERS CONTROLLERS -----------------
export const getVolunteers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, active } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (active) filter.active = active === 'true';

    const volunteers = await Volunteer.find(filter)
      .populate('team')
      .populate('areas')
      .populate('events')
      .sort({ name: 1 });

    res.status(200).json({ status: 'success', volunteers });
  } catch (error) {
    next(error);
  }
};

export const getVolunteerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const volunteer = await Volunteer.findById(id).populate('team').populate('areas').populate('events');
    if (!volunteer) return next(new AppError('Volunteer not found', 404));
    res.status(200).json({ status: 'success', volunteer });
  } catch (error) {
    next(error);
  }
};

export const createVolunteer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const volunteer = await Volunteer.create(req.body);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_VOLUNTEER', 'Volunteer', volunteer._id.toString(), null, volunteer, req);
    res.status(201).json({ status: 'success', volunteer });
  } catch (error) {
    next(error);
  }
};

export const updateVolunteer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldVol = await Volunteer.findById(id);
    if (!oldVol) return next(new AppError('Volunteer not found', 404));

    const volunteer = await Volunteer.findByIdAndUpdate(id, req.body, { new: true });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_VOLUNTEER', 'Volunteer', id, oldVol, volunteer, req);

    res.status(200).json({ status: 'success', volunteer });
  } catch (error) {
    next(error);
  }
};

export const deleteVolunteer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const volunteer = await Volunteer.findById(id);
    if (!volunteer) return next(new AppError('Volunteer not found', 404));

    await Volunteer.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_VOLUNTEER', 'Volunteer', id, volunteer, null, req);

    res.status(200).json({ status: 'success', message: 'Volunteer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
