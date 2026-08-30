import { Request, Response, NextFunction } from 'express';
import { Place } from '../models/Place';
import { KatheParticipant } from '../models/KatheParticipant';
import { PrasadaDelivery } from '../models/PrasadaDelivery';
import { Year } from '../models/Year';
import { AppError } from '../middleware/errorHandler';
import { logActivity } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';

// ----------------- PLACES CONTROLLERS -----------------
export const getPlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const places = await Place.find(filter).sort({ name: 1 });
    res.status(200).json({ status: 'success', places });
  } catch (error) {
    next(error);
  }
};

export const getPlaceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const place = await Place.findById(id);
    if (!place) return next(new AppError('Place not found', 404));
    res.status(200).json({ status: 'success', place });
  } catch (error) {
    next(error);
  }
};

export const createPlace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body, createdBy: req.user?.id };
    const place = await Place.create(data);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'CREATE_PLACE', 'Place', place._id.toString(), null, place, req);
    res.status(201).json({ status: 'success', place });
  } catch (error) {
    next(error);
  }
};

export const updatePlace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldPlace = await Place.findById(id);
    if (!oldPlace) return next(new AppError('Place not found', 404));

    const place = await Place.findByIdAndUpdate(id, req.body, { new: true });
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_PLACE', 'Place', id, oldPlace, place, req);

    res.status(200).json({ status: 'success', place });
  } catch (error) {
    next(error);
  }
};

export const deletePlace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const place = await Place.findById(id);
    if (!place) return next(new AppError('Place not found', 404));

    await Place.findByIdAndDelete(id);
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_PLACE', 'Place', id, place, null, req);

    res.status(200).json({ status: 'success', message: 'Place deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- KATHE PARTICIPANTS CONTROLLERS -----------------
export const getKatheParticipants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, confirmed, place, search, page = 1, limit = 50 } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (confirmed) filter.confirmed = confirmed === 'true';
    if (place) filter.place = place;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { homeName: { $regex: search, $options: 'i' } },
        { bookNo: { $regex: search, $options: 'i' } }
      ];
    }

    const p = parseInt(page as string);
    const l = parseInt(limit as string);
    const skipIndex = (p - 1) * l;

    const total = await KatheParticipant.countDocuments(filter);
    const participants = await KatheParticipant.find(filter)
      .populate('place')
      .sort({ firstName: 1 })
      .limit(l)
      .skip(skipIndex);

    res.status(200).json({
      status: 'success',
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
      participants
    });
  } catch (error) {
    next(error);
  }
};

export const getKatheParticipantById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const participant = await KatheParticipant.findById(id).populate('place');
    if (!participant) return next(new AppError('Participant not found', 404));
    res.status(200).json({ status: 'success', participant });
  } catch (error) {
    next(error);
  }
};

export const createKatheParticipant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const participant = await KatheParticipant.create(req.body);

    // If confirmed, automatically create a Prasada Delivery record
    if (participant.confirmed) {
      await PrasadaDelivery.create({
        participant: participant._id,
        homeName: participant.homeName,
        address: participant.address,
        place: participant.place,
        status: 'PENDING',
        year: participant.year
      });
    }

    res.status(201).json({ status: 'success', participant });
  } catch (error) {
    next(error);
  }
};

export const updateKatheParticipant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const oldPart = await KatheParticipant.findById(id);
    if (!oldPart) return next(new AppError('Participant not found', 404));

    const participant = await KatheParticipant.findByIdAndUpdate(id, req.body, { new: true });
    if (!participant) return next(new AppError('Participant update failed', 400));

    // If confirmation flipped to true, create Prasada Delivery record if it doesn't exist
    if (!oldPart.confirmed && participant.confirmed) {
      const existing = await PrasadaDelivery.findOne({ participant: participant._id });
      if (!existing) {
        await PrasadaDelivery.create({
          participant: participant._id,
          homeName: participant.homeName,
          address: participant.address,
          place: participant.place,
          status: 'PENDING',
          year: participant.year
        });
      }
    } else if (oldPart.confirmed && !participant.confirmed) {
      // If unconfirmed, delete its pending prasada delivery
      await PrasadaDelivery.findOneAndDelete({ participant: participant._id, status: 'PENDING' });
    }

    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_KATHE_PARTICIPANT', 'KatheParticipant', id, oldPart, participant, req);

    res.status(200).json({ status: 'success', participant });
  } catch (error) {
    next(error);
  }
};

export const deleteKatheParticipant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const participant = await KatheParticipant.findById(id);
    if (!participant) return next(new AppError('Participant not found', 404));

    await KatheParticipant.findByIdAndDelete(id);
    // Remove delivery records as well
    await PrasadaDelivery.deleteMany({ participant: id });

    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'DELETE_KATHE_PARTICIPANT', 'KatheParticipant', id, participant, null, req);

    res.status(200).json({ status: 'success', message: 'Participant and related deliveries deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ----------------- PRASADA DELIVERY CONTROLLERS -----------------
export const getPrasadaDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, place, assignedVolunteer, status } = req.query;
  const filter: any = {};
  try {
    if (year) {
      filter.year = year;
    } else {
      const activeYear = await Year.findOne({ isCurrent: true });
      if (activeYear) filter.year = activeYear.year;
    }
    if (place) filter.place = place;
    if (assignedVolunteer) filter.assignedVolunteer = assignedVolunteer;
    if (status) filter.status = status;

    const deliveries = await PrasadaDelivery.find(filter)
      .populate({ path: 'participant', populate: { path: 'place' } })
      .populate('place')
      .populate('assignedVolunteer')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', deliveries });
  } catch (error) {
    next(error);
  }
};

export const getPrasadaDeliveryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    const delivery = await PrasadaDelivery.findById(id)
      .populate({ path: 'participant', populate: { path: 'place' } })
      .populate('place')
      .populate('assignedVolunteer');
    if (!delivery) return next(new AppError('Delivery record not found', 404));
    res.status(200).json({ status: 'success', delivery });
  } catch (error) {
    next(error);
  }
};

export const updatePrasadaDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { status, assignedVolunteer, notes } = req.body;
  try {
    const delivery = await PrasadaDelivery.findById(id);
    if (!delivery) return next(new AppError('Delivery record not found', 404));

    const oldVal = { status: delivery.status, assignedVolunteer: delivery.assignedVolunteer, notes: delivery.notes };

    if (status) {
      delivery.status = status;
      if (status === 'DELIVERED') {
        delivery.deliveredAt = new Date();
      } else if (status === 'ASSIGNED') {
        delivery.assignedAt = new Date();
      }
    }
    if (assignedVolunteer !== undefined) {
      delivery.assignedVolunteer = assignedVolunteer || undefined;
      if (assignedVolunteer && delivery.status === 'PENDING') {
        delivery.status = 'ASSIGNED';
        delivery.assignedAt = new Date();
      }
    }
    if (notes !== undefined) delivery.notes = notes;

    await delivery.save();
    await logActivity(req.user?.email || 'ADMIN', req.user?.role || 'ADMIN', 'UPDATE_PRASADA_STATUS', 'PrasadaDelivery', id, oldVal, delivery, req);

    res.status(200).json({ status: 'success', delivery });
  } catch (error) {
    next(error);
  }
};

export const getPrasadaStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year } = req.query;
  try {
    let activeYear = year as string;
    if (!activeYear) {
      const yearDoc = await Year.findOne({ isCurrent: true });
      activeYear = yearDoc ? yearDoc.year : new Date().getFullYear().toString();
    }

    // Overall stats
    const total = await PrasadaDelivery.countDocuments({ year: activeYear });
    const pending = await PrasadaDelivery.countDocuments({ year: activeYear, status: 'PENDING' });
    const assigned = await PrasadaDelivery.countDocuments({ year: activeYear, status: 'ASSIGNED' });
    const outForDelivery = await PrasadaDelivery.countDocuments({ year: activeYear, status: 'OUT_FOR_DELIVERY' });
    const delivered = await PrasadaDelivery.countDocuments({ year: activeYear, status: 'DELIVERED' });
    const unableToDeliver = await PrasadaDelivery.countDocuments({ year: activeYear, status: 'UNABLE_TO_DELIVER' });

    // Area-wise breakdown
    const places = await Place.find({ year: activeYear });
    const areaBreakdown = await Promise.all(
      places.map(async (place) => {
        const areaTotal = await PrasadaDelivery.countDocuments({ year: activeYear, place: place._id });
        const areaDelivered = await PrasadaDelivery.countDocuments({ year: activeYear, place: place._id, status: 'DELIVERED' });
        const areaPending = areaTotal - areaDelivered;
        return {
          placeId: place._id,
          name: place.name,
          nameKannada: place.nameKannada,
          total: areaTotal,
          delivered: areaDelivered,
          pending: areaPending
        };
      })
    );

    res.status(200).json({
      status: 'success',
      stats: {
        total,
        pending,
        assigned,
        outForDelivery,
        delivered,
        unableToDeliver,
        progress: total > 0 ? Math.round((delivered / total) * 100) : 0
      },
      areaBreakdown
    });
  } catch (error) {
    next(error);
  }
};
