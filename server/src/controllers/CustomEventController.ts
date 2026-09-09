import { Request, Response, NextFunction } from 'express';
import { CustomEvent, ICustomEvent } from '../models/CustomEvent';
import { CustomRegistration } from '../models/CustomRegistration';
import { Setting } from '../models/Setting';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/audit';

// Helper to determine active year
const getTargetYear = async (req: Request): Promise<string> => {
  if (req.query.year && typeof req.query.year === 'string') {
    return req.query.year;
  }
  const setting = await Setting.findOne({ key: 'currentYear' });
  return (setting?.value as string) || '2026';
};

// Helper to slugify string
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * GET /api/custom-events
 * Lists events. Public users get active public events; Admins get all events.
 */
export const getCustomEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = await getTargetYear(req);
    const filter: any = { year };

    // If not authenticated as admin, only show active and public events
    if (!req.user) {
      filter.status = 'ACTIVE';
      filter.accessPermission = 'PUBLIC';
    }

    const events = await CustomEvent.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/custom-events/slug/:slug
 * Gets a single event by its slug.
 */
export const getCustomEventBySlug = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const event = await CustomEvent.findOne({ slug: slug.toLowerCase() });

    if (!event) {
      return next(new AppError(`Event with slug "${slug}" not found`, 404));
    }

    // If event is admin only and user is not admin
    if (event.accessPermission === 'ADMIN_ONLY' && !req.user) {
      res.status(200).json({
        status: 'restricted',
        message: 'This event registration is restricted to committee administrators.',
        event: {
          _id: event._id,
          title: event.title,
          titleKannada: event.titleKannada,
          slug: event.slug,
          accessPermission: event.accessPermission,
          status: event.status,
        },
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/custom-events/:id
 * Gets event by ID (for admin editor).
 */
export const getCustomEventById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await CustomEvent.findById(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    res.status(200).json({
      status: 'success',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/custom-events
 * Creates a new custom event (Admin only).
 */
export const createCustomEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      titleKannada,
      slug: customSlug,
      description,
      descriptionKannada,
      accessPermission = 'PUBLIC',
      status = 'ACTIVE',
      showInNavbar = true,
      categoryOptions = [],
      enableQuantity = false,
      year: inputYear,
    } = req.body;

    if (!title || !titleKannada) {
      return next(new AppError('Event title in English and Kannada are required', 400));
    }

    const year = inputYear || (await getTargetYear(req));

    // Generate unique slug
    let baseSlug = customSlug ? slugify(customSlug) : slugify(title);
    if (!baseSlug) baseSlug = `event-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await CustomEvent.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    // Process category options
    let parsedCategories: string[] = [];
    if (Array.isArray(categoryOptions)) {
      parsedCategories = categoryOptions.map((c: any) => String(c).trim()).filter(Boolean);
    } else if (typeof categoryOptions === 'string') {
      parsedCategories = categoryOptions
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }

    const event = await CustomEvent.create({
      title: title.trim(),
      titleKannada: titleKannada.trim(),
      slug: uniqueSlug,
      description: (description || '').trim(),
      descriptionKannada: (descriptionKannada || '').trim(),
      accessPermission: accessPermission === 'ADMIN_ONLY' ? 'ADMIN_ONLY' : 'PUBLIC',
      status: status === 'CLOSED' ? 'CLOSED' : 'ACTIVE',
      showInNavbar: Boolean(showInNavbar),
      categoryOptions: parsedCategories,
      enableQuantity: Boolean(enableQuantity),
      year,
      createdBy: req.user ? (req.user.id as any) : undefined,
    });

    logActivity(req, 'CREATE', 'CustomEvent', `Created custom registration event: ${event.title}`);

    res.status(201).json({
      status: 'success',
      message: 'Custom event created successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/custom-events/:id
 * Updates an existing custom event (Admin only).
 */
export const updateCustomEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await CustomEvent.findById(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    const {
      title,
      titleKannada,
      description,
      descriptionKannada,
      accessPermission,
      status,
      showInNavbar,
      categoryOptions,
      enableQuantity,
    } = req.body;

    if (title) event.title = title.trim();
    if (titleKannada) event.titleKannada = titleKannada.trim();
    if (description !== undefined) event.description = description.trim();
    if (descriptionKannada !== undefined) event.descriptionKannada = descriptionKannada.trim();
    if (accessPermission) {
      event.accessPermission = accessPermission === 'ADMIN_ONLY' ? 'ADMIN_ONLY' : 'PUBLIC';
    }
    if (status) {
      event.status = status === 'CLOSED' ? 'CLOSED' : 'ACTIVE';
    }
    if (showInNavbar !== undefined) {
      event.showInNavbar = Boolean(showInNavbar);
    }
    if (enableQuantity !== undefined) {
      event.enableQuantity = Boolean(enableQuantity);
    }
    if (categoryOptions !== undefined) {
      if (Array.isArray(categoryOptions)) {
        event.categoryOptions = categoryOptions.map((c: any) => String(c).trim()).filter(Boolean);
      } else if (typeof categoryOptions === 'string') {
        event.categoryOptions = categoryOptions
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
      }
    }

    await event.save();

    logActivity(req, 'UPDATE', 'CustomEvent', `Updated event: ${event.title}`);

    res.status(200).json({
      status: 'success',
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/custom-events/:id
 * Permanently removes a custom event and all its registrations (Admin only).
 */
export const deleteCustomEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await CustomEvent.findById(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Delete all associated registrations
    const regResult = await CustomRegistration.deleteMany({ eventId: id });
    await CustomEvent.findByIdAndDelete(id);

    logActivity(
      req,
      'DELETE',
      'CustomEvent',
      `Deleted event: ${event.title} along with ${regResult.deletedCount} registrations`
    );

    res.status(200).json({
      status: 'success',
      message: `Event "${event.title}" and ${regResult.deletedCount} registrations removed successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/custom-events/:id/registrations
 * Returns all registrations for an event with breakdown statistics.
 */
export const getEventRegistrations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await CustomEvent.findById(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check permission: if event is admin only, non-admin cannot read roster
    if (event.accessPermission === 'ADMIN_ONLY' && !req.user) {
      return next(new AppError('Unauthorized to view this event roster', 403));
    }

    const registrations = await CustomRegistration.find({ eventId: id }).sort({ createdAt: -1 });

    // Calculate breakdown
    let totalQuantity = 0;
    const categoryBreakdown: Record<string, number> = {};

    registrations.forEach((r) => {
      const q = Math.max(1, Number(r.quantity) || 1);
      totalQuantity += q;
      const cat = r.category || 'General';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + q;
    });

    res.status(200).json({
      status: 'success',
      event,
      registrations,
      stats: {
        totalRegistrations: registrations.length,
        totalQuantity,
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/custom-events/:id/registrations
 * Registers a participant for an event (Public or Admin).
 */
export const createEventRegistration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await CustomEvent.findById(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    if (event.status === 'CLOSED') {
      return next(new AppError('Registrations for this event are currently closed.', 400));
    }

    if (event.accessPermission === 'ADMIN_ONLY' && !req.user) {
      return next(new AppError('This event is restricted to committee administrator registration only.', 403));
    }

    const { name, phone, homeName, category, quantity = 1, notes } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Participant name is required', 400));
    }

    const parsedQty = event.enableQuantity ? Math.max(1, parseInt(quantity, 10) || 1) : 1;

    const registration = await CustomRegistration.create({
      eventId: event._id,
      name: name.trim(),
      phone: (phone || '').trim(),
      homeName: (homeName || '').trim(),
      category: (category || '').trim(),
      quantity: parsedQty,
      notes: (notes || '').trim(),
      registeredBy: req.user ? 'ADMIN' : 'PUBLIC',
      year: event.year,
    });

    // Increment count on event document
    await CustomEvent.findByIdAndUpdate(event._id, { $inc: { registrationsCount: 1 } });

    res.status(201).json({
      status: 'success',
      message: 'Registration recorded successfully!',
      registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/custom-events/registrations/:regId
 * Updates an individual participant registration (Admin only).
 */
export const updateEventRegistration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { regId } = req.params;
    const reg = await CustomRegistration.findById(regId);

    if (!reg) {
      return next(new AppError('Registration not found', 404));
    }

    const { name, phone, homeName, category, quantity, notes } = req.body;

    if (name) reg.name = name.trim();
    if (phone !== undefined) reg.phone = phone.trim();
    if (homeName !== undefined) reg.homeName = homeName.trim();
    if (category !== undefined) reg.category = category.trim();
    if (quantity !== undefined) reg.quantity = Math.max(1, parseInt(quantity, 10) || 1);
    if (notes !== undefined) reg.notes = notes.trim();

    await reg.save();

    res.status(200).json({
      status: 'success',
      message: 'Registration updated successfully',
      registration: reg,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/custom-events/registrations/:regId
 * Deletes an individual registration (Admin only).
 */
export const deleteEventRegistration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { regId } = req.params;
    const reg = await CustomRegistration.findById(regId);

    if (!reg) {
      return next(new AppError('Registration not found', 404));
    }

    const eventId = reg.eventId;
    await CustomRegistration.findByIdAndDelete(regId);

    // Decrement count on event
    await CustomEvent.findByIdAndUpdate(eventId, {
      $inc: { registrationsCount: -1 },
    });

    res.status(200).json({
      status: 'success',
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
