import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';

import * as AuthController from '../controllers/AuthController';
import * as EventController from '../controllers/EventController';
import * as MemberController from '../controllers/MemberController';
import * as KatheController from '../controllers/KatheController';
import * as FinancialController from '../controllers/FinancialController';
import * as SystemController from '../controllers/SystemController';
import * as UploadController from '../controllers/UploadController';

const router = Router();

// ================= AUTHENTICATION & ADMINS =================
router.post('/auth/login', AuthController.login);
router.get('/auth/admins', authenticateJWT, requireRole(['SUPER_ADMIN']), AuthController.getAdmins);
router.post('/auth/admins/new', authenticateJWT, requireRole(['SUPER_ADMIN']), AuthController.createAdmin);
router.put('/auth/admins/:id', authenticateJWT, requireRole(['SUPER_ADMIN']), AuthController.updateAdmin);

// ================= OPERATIONAL YEARS =================
router.get('/years', SystemController.getYears);
router.post('/years/new', authenticateJWT, requireRole(['SUPER_ADMIN']), SystemController.createYear);
router.put('/years/:year/current', authenticateJWT, requireRole(['SUPER_ADMIN']), SystemController.setCurrentYear);
router.put('/years/:year/archive', authenticateJWT, requireRole(['SUPER_ADMIN']), SystemController.archiveYear);

// ================= EVENTS =================
router.get('/events', EventController.getEvents);
router.get('/events/today', EventController.getTodayEvents);
router.get('/events/upcoming', EventController.getUpcomingEvents);
router.get('/events/:id', EventController.getEventById);
router.post('/events', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), EventController.createEvent);
router.put('/events/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), EventController.updateEvent);
router.delete('/events/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), EventController.deleteEvent);
router.post('/events/:id/duplicate', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), EventController.duplicateEvent);

// ================= MEMBERS, TEAMS, VOLUNTEERS =================
router.get('/members', MemberController.getMembers);
router.get('/members/:id', MemberController.getMemberById);
router.post('/members', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.createMember);
router.put('/members/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.updateMember);
router.delete('/members/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.deleteMember);

router.get('/teams', MemberController.getTeams);
router.get('/teams/:id', MemberController.getTeamById);
router.post('/teams', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.createTeam);
router.put('/teams/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.updateTeam);
router.delete('/teams/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.deleteTeam);

router.get('/volunteers', MemberController.getVolunteers);
router.get('/volunteers/:id', MemberController.getVolunteerById);
router.post('/volunteers', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.createVolunteer);
router.put('/volunteers/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.updateVolunteer);
router.delete('/volunteers/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), MemberController.deleteVolunteer);

// ================= PLACES =================
router.get('/places', KatheController.getPlaces);
router.get('/places/:id', KatheController.getPlaceById);
router.post('/places', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), KatheController.createPlace);
router.put('/places/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), KatheController.updatePlace);
router.delete('/places/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), KatheController.deletePlace);

// ================= KATHE PARTICIPANTS =================
router.get('/kathe', KatheController.getKatheParticipants);
router.get('/kathe/:id', KatheController.getKatheParticipantById);
router.post('/kathe', KatheController.createKatheParticipant); // Register is open to public
router.put('/kathe/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), KatheController.updateKatheParticipant);
router.delete('/kathe/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), KatheController.deleteKatheParticipant);

// ================= PRASADA OPERATIONS =================
router.get('/prasada', KatheController.getPrasadaDeliveries);
router.get('/prasada/stats', KatheController.getPrasadaStats);
router.get('/prasada/:id', KatheController.getPrasadaDeliveryById);
router.put('/prasada/:id/status', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), KatheController.updatePrasadaDelivery);

// ================= AUCTIONS =================
router.get('/auction', FinancialController.getAuctions);
router.get('/auction/:id', FinancialController.getAuctionById);
router.post('/auction', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), FinancialController.createAuction);
router.put('/auction/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), FinancialController.updateAuction);
router.delete('/auction/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), FinancialController.deleteAuction);

// ================= FINANCIAL RECORDS =================
router.get('/financials', FinancialController.getFinancials);
router.get('/financials/summary', FinancialController.getFinancialsSummary);
router.post('/financials', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), FinancialController.createFinancialRecord);
router.put('/financials/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), FinancialController.updateFinancialRecord);
router.delete('/financials/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), FinancialController.deleteFinancialRecord);

// ================= ANNOUNCEMENTS =================
router.get('/announcements', SystemController.getAnnouncements);
router.post('/announcements', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.createAnnouncement);
router.put('/announcements/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.updateAnnouncement);
router.delete('/announcements/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.deleteAnnouncement);

// ================= MEDIA GALLERIES =================
router.get('/gallery', SystemController.getPhotos);
router.post('/gallery/new', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.createPhoto);
router.delete('/gallery/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.deletePhoto);

router.get('/videos', SystemController.getVideos);
router.post('/videos/new', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.createVideo);
router.delete('/videos/:id', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.deleteVideo);

// ================= FILE UPLOADS =================
router.post('/upload', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), UploadController.uploadBase64);

// ================= SETTINGS =================
router.get('/settings', SystemController.getSettings);
router.put('/settings/edit', authenticateJWT, requireRole(['SUPER_ADMIN']), SystemController.updateSettings);

// ================= DASHBOARD & AUDIT =================
router.get('/dashboard/stats', authenticateJWT, requireRole(['ADMIN', 'SUPER_ADMIN']), SystemController.getDashboardStats);
router.get('/audit-logs', authenticateJWT, requireRole(['SUPER_ADMIN']), SystemController.getAuditLogs);

export default router;
