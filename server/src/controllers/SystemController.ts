import { Request, Response, NextFunction } from 'express';
import { Year } from '../models/Year';
import { Announcement } from '../models/Announcement';
import { Setting } from '../models/Setting';
import { Photo } from '../models/Photo';
import { Video } from '../models/Video';
import { AuditLog } from '../models/AuditLog';
import { Event } from '../models/Event';
import { Member } from '../models/Member';
import { Volunteer } from '../models/Volunteer';
import { KatheParticipant } from '../models/KatheParticipant';
import { PrasadaDelivery } from '../models/PrasadaDelivery';
import { AuctionItem } from '../models/AuctionItem';
import { FinancialRecord } from '../models/FinancialRecord';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';

// ----------------- YEARS CONTROLLERS -----------------
export const getYears = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const years = await Year.find().sort({ year: -1 });
    res.status(200).json({ status: 'success', years });
  } catch (error) {
    next(error);
  }
};

export const createYear = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { year } = req.body;
  try {
    const existing = await Year.findOne({ year });
    if (existing) return next(new AppError('Year already exists', 400));

    const newYear = await Year.create({ year, isCurrent: false, status: 'active' });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_YEAR', 'Year', newYear._id.toString(), null, newYear, req);

    res.status(201).json({ status: 'success', year: newYear });
  } catch (error) {
    next(error);
  }
};

export const setCurrentYear = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { year } = req.params;
  try {
    const yearDoc = await Year.findOne({ year });
    if (!yearDoc) return next(new AppError('Year not found', 404));

    // Reset current year for all other years
    await Year.updateMany({}, { isCurrent: false });
    yearDoc.isCurrent = true;
    await yearDoc.save();

    // Update global settings key 'currentYear' to match
    await Setting.findOneAndUpdate({ key: 'currentYear' }, { value: year }, { upsert: true });

    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'SET_CURRENT_YEAR', 'Year', yearDoc._id.toString(), null, { year }, req);

    res.status(200).json({ status: 'success', message: `Current year set to ${year}` });
  } catch (error) {
    next(error);
  }
};

export const archiveYear = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { year } = req.params;
  try {
    const yearDoc = await Year.findOne({ year });
    if (!yearDoc) return next(new AppError('Year not found', 404));

    yearDoc.status = 'archived';
    await yearDoc.save();

    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'ARCHIVE_YEAR', 'Year', yearDoc._id.toString(), null, { year }, req);

    res.status(200).json({ status: 'success', message: `Year ${year} archived` });
  } catch (error) {
    next(error);
  }
};

// ----------------- ANNOUNCEMENTS CONTROLLERS -----------------
export const getAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { activeOnly } = req.query;
  const filter: any = {};
  try {
    if (activeOnly === 'true') {
      const today = new Date();
      filter.active = true;
      filter.startDate = { $lte: today };
      filter.endDate = { $gte: today };
    }

    const announcements = await Announcement.find(filter).sort({ priority: -1, createdAt: -1 });
    res.status(200).json({ status: 'success', announcements });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body, createdBy: req.user?.id };
    const announcement = await Announcement.create(data);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_ANNOUNCEMENT', 'Announcement', announcement._id.toString(), null, announcement, req);
    res.status(201).json({ status: 'success', announcement });
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldAnn = await Announcement.findById(id);
    if (!oldAnn) return next(new AppError('Announcement not found', 404));

    const announcement = await Announcement.findByIdAndUpdate(id, req.body, { new: true });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_ANNOUNCEMENT', 'Announcement', id, oldAnn, announcement, req);

    res.status(200).json({ status: 'success', announcement });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) return next(new AppError('Announcement not found', 404));

    await Announcement.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_ANNOUNCEMENT', 'Announcement', id, announcement, null, req);

    res.status(200).json({ status: 'success', message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- SETTINGS CONTROLLERS -----------------
export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settingsList = await Setting.find();
    const settings: { [key: string]: any } = {};
    settingsList.forEach(s => {
      settings[s.key] = s.value;
    });
    res.status(200).json({ status: 'success', settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const updates = req.body; // e.g. { festivalName: "New Name", currentYear: "2026" }
  try {
    const keys = Object.keys(updates);
    const oldSettings = await Setting.find({ key: { $in: keys } });

    await Promise.all(
      keys.map(async (key) => {
        return Setting.findOneAndUpdate(
          { key },
          { value: updates[key] },
          { upsert: true, new: true }
        );
      })
    );

    await logActivity(req.user?.email || 'SUPER_ADMIN', req.user?.role || 'SUPER_ADMIN', 'UPDATE_SETTINGS', 'Setting', 'GLOBAL', oldSettings, updates, req);

    res.status(200).json({ status: 'success', message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- PHOTO GALLERY CONTROLLERS -----------------
export const getPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, event, category } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (event) filter.event = event;
    if (category) filter.category = category;

    const photos = await Photo.find(filter).populate('event').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', photos });
  } catch (error) {
    next(error);
  }
};

export const createPhoto = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const photo = await Photo.create({ ...req.body, uploadedBy: req.user?.id });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPLOAD_PHOTO', 'Photo', photo._id.toString(), null, photo, req);
    res.status(201).json({ status: 'success', photo });
  } catch (error) {
    next(error);
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const photo = await Photo.findById(id);
    if (!photo) return next(new AppError('Photo not found', 404));

    await Photo.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_PHOTO', 'Photo', id, photo, null, req);

    res.status(200).json({ status: 'success', message: 'Photo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- VIDEO GALLERY CONTROLLERS -----------------
export const getVideos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, event } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (event) filter.event = event;

    const videos = await Video.find(filter).populate('event').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', videos });
  } catch (error) {
    next(error);
  }
};

export const createVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { youtubeUrl, title, description, year, event } = req.body;
  try {
    // Extract video ID from youtubeUrl
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;

    if (!videoId) {
      return next(new AppError('Invalid YouTube URL. Please check the URL.', 400));
    }

    const video = await Video.create({
      youtubeUrl,
      youtubeVideoId: videoId,
      title,
      description,
      year,
      event: event || undefined,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    });

    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'ADD_VIDEO', 'Video', video._id.toString(), null, video, req);

    res.status(201).json({ status: 'success', video });
  } catch (error) {
    next(error);
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const video = await Video.findById(id);
    if (!video) return next(new AppError('Video not found', 404));

    await Video.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_VIDEO', 'Video', id, video, null, req);

    res.status(200).json({ status: 'success', message: 'Video deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- AUDIT LOGS CONTROLLERS -----------------
export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { page = 1, limit = 50 } = req.query;
  try {
    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const skipIndex = (p - 1) * l;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(l)
      .skip(skipIndex);

    res.status(200).json({
      status: 'success',
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
      logs
    });
  } catch (error) {
    next(error);
  }
};

// ----------------- SYSTEM DASHBOARD OVERVIEW -----------------
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activeYearDoc = await Year.findOne({ isCurrent: true });
    const currentYear = activeYearDoc ? activeYearDoc.year : new Date().getFullYear().toString();

    // 1. Event stats
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);
    
    const todayEventsCount = await Event.countDocuments({ year: currentYear, date: { $gte: todayStart, $lte: todayEnd } });
    const upcomingEventsCount = await Event.countDocuments({ year: currentYear, date: { $gt: todayEnd } });

    // 2. Members & Volunteers stats
    const totalMembers = await Member.countDocuments({ year: currentYear, memberType: { $ne: 'Junior Member' } });
    const juniorMembers = await Member.countDocuments({ year: currentYear, memberType: 'Junior Member' });
    const volunteersCount = await Volunteer.countDocuments({ year: currentYear });

    // 3. Operations (Kathe and Prasada)
    const katheCount = await KatheParticipant.countDocuments({ year: currentYear });
    const prasadaPending = await PrasadaDelivery.countDocuments({ year: currentYear, status: 'PENDING' });
    const prasadaDelivered = await PrasadaDelivery.countDocuments({ year: currentYear, status: 'DELIVERED' });

    // 4. Financial items
    const auctionUnpaid = await AuctionItem.countDocuments({ year: currentYear, paymentStatus: 'UNPAID' });

    // 5. Recent Admin Activities
    const recentLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(10);

    res.status(200).json({
      status: 'success',
      stats: {
        todayEvents: todayEventsCount,
        upcomingEvents: upcomingEventsCount,
        membersCount: totalMembers,
        juniorsCount: juniorMembers,
        volunteersCount,
        katheCount,
        prasadaPending,
        prasadaDelivered,
        auctionUnpaid
      },
      recentLogs
    });
  } catch (error) {
    next(error);
  }
};
