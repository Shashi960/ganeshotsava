import { Request, Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Year } from '../models/Year';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';

export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const s = timeStr.trim().toLowerCase();

  const isKnMorning = s.includes('ಬೆಳಿಗ್ಗೆ') || s.includes('ಮುಂಜಾನೆ');
  const isKnAfternoon = s.includes('ಮಧ್ಯಾಹ್ನ');
  const isKnEvening = s.includes('ಸಂಜೆ');
  const isKnNight = s.includes('ರಾತ್ರಿ');

  const isPM = s.includes('pm') || isKnAfternoon || isKnEvening || isKnNight;
  const isAM = s.includes('am') || isKnMorning;

  const match = s.match(/(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, category, date, status, featured } = req.query;
  const filter: any = {};

  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) {
        filter.year = activeYear.year;
      }
    }

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (featured) filter.featured = featured === 'true';

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const events = await Event.find(filter)
      .populate('team')
      .populate('volunteers');

    // Chronological sort: Date first, then time (Morning 9am, 10am, afternoon, evening, night)
    events.sort((a, b) => {
      const dateA = new Date(a.date).setHours(0, 0, 0, 0);
      const dateB = new Date(b.date).setHours(0, 0, 0, 0);
      if (dateA !== dateB) return dateA - dateB;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });

    res.status(200).json({ status: 'success', events });
  } catch (error) {
    next(error);
  }
};

export const getTodayEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const todayStr = req.query.date as string || new Date().toISOString().split('T')[0];
    const start = new Date(todayStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(todayStr);
    end.setHours(23, 59, 59, 999);

    const activeYear = await Year.findOne({ isCurrent: true });
    const yearQuery = activeYear ? activeYear.year : new Date(todayStr).getFullYear().toString();

    const events = await Event.find({
      year: yearQuery,
      date: { $gte: start, $lte: end }
    }).populate('team').populate('volunteers');

    events.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    res.status(200).json({ status: 'success', events });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activeYear = await Year.findOne({ isCurrent: true });
    const filter: any = {};
    if (activeYear) {
      filter.year = activeYear.year;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filter.date = { $gte: today };

    const events = await Event.find(filter)
      .populate('team')
      .populate('volunteers');

    events.sort((a, b) => {
      const dateA = new Date(a.date).setHours(0, 0, 0, 0);
      const dateB = new Date(b.date).setHours(0, 0, 0, 0);
      if (dateA !== dateB) return dateA - dateB;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });

    const top5 = events.slice(0, 5);

    res.status(200).json({ status: 'success', events: top5 });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id).populate('team').populate('volunteers');
    if (!event) {
      return next(new AppError('Event not found', 404));
    }
    res.status(200).json({ status: 'success', event });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body, createdBy: req.user?.id };
    const event = await Event.create(data);

    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_EVENT', 'Event', event._id.toString(), null, event, req);

    res.status(201).json({ status: 'success', event });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldEvent = await Event.findById(id);
    if (!oldEvent) {
      return next(new AppError('Event not found', 404));
    }

    const data = { ...req.body, updatedBy: req.user?.id };
    const event = await Event.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_EVENT', 'Event', id, oldEvent, event, req);

    res.status(200).json({ status: 'success', event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    await Event.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_EVENT', 'Event', id, event, null, req);

    res.status(200).json({ status: 'success', message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const duplicateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { targetDate, targetYear } = req.body;
  try {
    const sourceEvent = await Event.findById(id);
    if (!sourceEvent) {
      return next(new AppError('Source event not found', 404));
    }

    const duplicatedData = {
      title: sourceEvent.title,
      titleKannada: sourceEvent.titleKannada,
      description: sourceEvent.description,
      descriptionKannada: sourceEvent.descriptionKannada,
      date: targetDate ? new Date(targetDate) : sourceEvent.date,
      startTime: sourceEvent.startTime,
      endTime: sourceEvent.endTime,
      location: sourceEvent.location,
      category: sourceEvent.category,
      image: sourceEvent.image,
      year: targetYear || sourceEvent.year,
      status: 'Upcoming',
      featured: sourceEvent.featured,
      createdBy: req.user?.id
    };

    const newEvent = await Event.create(duplicatedData);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DUPLICATE_EVENT', 'Event', newEvent._id.toString(), null, newEvent, req);

    res.status(201).json({ status: 'success', event: newEvent });
  } catch (error) {
    next(error);
  }
};
