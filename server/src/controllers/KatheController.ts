import { Request, Response, NextFunction } from 'express';
import { Place } from '../models/Place';
import { KatheParticipant } from '../models/KatheParticipant';
import { PrasadaDelivery } from '../models/PrasadaDelivery';
import { Setting } from '../models/Setting';
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
    const data: any = { ...req.body };

    // Support single name field
    if (data.name && !data.firstName) {
      data.firstName = data.name.trim();
      data.lastName = data.lastName || '';
    } else if (data.firstName && !data.lastName) {
      data.lastName = '';
    }

    // Support other/custom place
    if ((data.place === 'other' || !data.place) && data.customPlace) {
      const trimmedPlace = data.customPlace.trim();
      const placeYear = data.year || '2026';

      let existingPlace = await Place.findOne({
        $or: [{ name: trimmedPlace }, { nameKannada: trimmedPlace }],
        year: placeYear
      });

      if (!existingPlace) {
        existingPlace = await Place.create({
          name: trimmedPlace,
          nameKannada: trimmedPlace,
          active: true,
          year: placeYear
        });
      }

      data.place = existingPlace._id;
    }

    const participant = await KatheParticipant.create(data);

    // Automatically create a Prasada Delivery record for every registered participant
    await PrasadaDelivery.create({
      participant: participant._id,
      homeName: participant.homeName,
      address: participant.address,
      place: participant.place,
      status: 'PENDING',
      year: participant.year || '2026'
    });

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

    const data: any = { ...req.body };
    if (data.name && !data.firstName) {
      data.firstName = data.name.trim();
      data.lastName = data.lastName || '';
    } else if (data.firstName && !data.lastName) {
      data.lastName = '';
    }

    // Support other/custom place
    if ((data.place === 'other' || !data.place) && data.customPlace) {
      const trimmedPlace = data.customPlace.trim();
      const placeYear = data.year || oldPart.year || '2026';

      let existingPlace = await Place.findOne({
        $or: [{ name: trimmedPlace }, { nameKannada: trimmedPlace }],
        year: placeYear
      });

      if (!existingPlace) {
        existingPlace = await Place.create({
          name: trimmedPlace,
          nameKannada: trimmedPlace,
          active: true,
          year: placeYear
        });
      }

      data.place = existingPlace._id;
    }

    const participant = await KatheParticipant.findByIdAndUpdate(id, data, { new: true }).populate('place');
    if (!participant) return next(new AppError('Participant update failed', 400));

    // Ensure or sync Prasada Delivery record
    const existingDelivery = await PrasadaDelivery.findOne({ participant: participant._id });
    if (!existingDelivery) {
      await PrasadaDelivery.create({
        participant: participant._id,
        homeName: participant.homeName,
        address: participant.address,
        place: participant.place,
        status: 'PENDING',
        year: participant.year || '2026'
      });
    } else {
      existingDelivery.homeName = participant.homeName;
      existingDelivery.address = participant.address;
      existingDelivery.place = participant.place;
      existingDelivery.year = participant.year || '2026';
      await existingDelivery.save();
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

const syncPrasadaDeliveriesForYear = async (activeYear: string): Promise<void> => {
  try {
    const participants = await KatheParticipant.find({ year: activeYear });
    if (!participants || participants.length === 0) return;

    const existingDeliveries = await PrasadaDelivery.find({ year: activeYear });
    const existingMap = new Map<string, any>();
    existingDeliveries.forEach(d => {
      if (d.participant) {
        existingMap.set(d.participant.toString(), d);
      }
    });

    const toCreate: any[] = [];
    for (const p of participants) {
      const existing = existingMap.get(p._id.toString());
      if (!existing) {
        toCreate.push({
          participant: p._id,
          homeName: p.homeName,
          address: p.address,
          place: p.place,
          status: 'PENDING',
          year: p.year || activeYear
        });
      }
    }

    if (toCreate.length > 0) {
      await PrasadaDelivery.insertMany(toCreate);
    }
  } catch (err) {
    console.error('Error in syncPrasadaDeliveriesForYear:', err);
  }
};

const getIsDeliveryOpen = async (): Promise<boolean> => {
  try {
    const setting = await Setting.findOne({ key: 'prasadaDeliveryOpen' });
    if (!setting) return false;
    return setting.value === true || setting.value === 'true';
  } catch {
    return false;
  }
};

export const getPrasadaDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { year, place, assignedVolunteer, status, search } = req.query;
  const filter: any = {};
  try {
    let activeYear = year as string;
    if (!activeYear) {
      const activeYearDoc = await Year.findOne({ isCurrent: true });
      activeYear = activeYearDoc ? activeYearDoc.year : '2026';
    }
    filter.year = activeYear;

    // Automatically sync so all registered Kathe participants exist in Prasada deliveries
    await syncPrasadaDeliveriesForYear(activeYear);

    if (place) filter.place = place;
    if (assignedVolunteer) filter.assignedVolunteer = assignedVolunteer;
    if (status) filter.status = status;

    let deliveries = await PrasadaDelivery.find(filter)
      .populate({ path: 'participant', populate: { path: 'place' } })
      .populate('place')
      .populate('assignedVolunteer')
      .sort({ createdAt: -1 });

    if (search && typeof search === 'string' && search.trim()) {
      const s = search.toLowerCase().trim();
      deliveries = deliveries.filter((d: any) => {
        const p = d.participant;
        const fullName = `${p?.firstName || ''} ${p?.lastName || ''}`.toLowerCase();
        const home = (d.homeName || p?.homeName || '').toLowerCase();
        const placeName = `${d.place?.name || ''} ${d.place?.nameKannada || ''} ${p?.place?.name || ''} ${p?.place?.nameKannada || ''}`.toLowerCase();
        const book = (p?.bookNo || p?.notes || '').toLowerCase();
        const phone = (p?.phone || '').toLowerCase();
        return fullName.includes(s) || home.includes(s) || placeName.includes(s) || book.includes(s) || phone.includes(s);
      });
    }

    const isDeliveryOpen = await getIsDeliveryOpen();

    res.status(200).json({ status: 'success', deliveries, isDeliveryOpen });
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
    // Check if delivery status is open
    const isDeliveryOpen = await getIsDeliveryOpen();
    if (!isDeliveryOpen && req.user?.role !== 'SUPER_ADMIN') {
      return next(new AppError('Prasada delivery is currently closed. Super Administrator must open delivery before statuses can be updated.', 403));
    }

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

    // Automatically sync so all registered Kathe participants exist in Prasada deliveries
    await syncPrasadaDeliveriesForYear(activeYear);

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

    const isDeliveryOpen = await getIsDeliveryOpen();

    res.status(200).json({
      status: 'success',
      stats: {
        total,
        pending,
        assigned,
        outForDelivery,
        delivered,
        unableToDeliver,
        progress: total > 0 ? Math.round((delivered / total) * 100) : 0,
        isDeliveryOpen
      },
      areaBreakdown,
      isDeliveryOpen
    });
  } catch (error) {
    next(error);
  }
};
