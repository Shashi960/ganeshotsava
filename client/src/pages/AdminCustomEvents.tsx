import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Users,
  Lock,
  Globe,
  CheckCircle,
  XCircle,
  ExternalLink,
  X,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export interface CustomEventItem {
  _id: string;
  title: string;
  titleKannada: string;
  slug: string;
  description?: string;
  descriptionKannada?: string;
  accessPermission: 'PUBLIC' | 'ADMIN_ONLY';
  status: 'ACTIVE' | 'CLOSED';
  showInNavbar: boolean;
  categoryOptions: string[];
  enableQuantity: boolean;
  year: string;
  registrationsCount: number;
  createdAt: string;
}

export const AdminCustomEvents: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [events, setEvents] = useState<CustomEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CustomEventItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [titleKannada, setTitleKannada] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionKannada, setDescriptionKannada] = useState('');
  const [accessPermission, setAccessPermission] = useState<'PUBLIC' | 'ADMIN_ONLY'>('PUBLIC');
  const [status, setStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [showInNavbar, setShowInNavbar] = useState(true);
  const [categoryOptionsInput, setCategoryOptionsInput] = useState('');
  const [enableQuantity, setEnableQuantity] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/custom-events');
      if (res.data.status === 'success') {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error('Failed to load custom events:', err);
      showToast('Failed to load custom events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setTitle('');
    setTitleKannada('');
    setCustomSlug('');
    setDescription('');
    setDescriptionKannada('');
    setAccessPermission('PUBLIC');
    setStatus('ACTIVE');
    setShowInNavbar(true);
    setCategoryOptionsInput('');
    setEnableQuantity(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: CustomEventItem) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setTitleKannada(evt.titleKannada);
    setCustomSlug(evt.slug);
    setDescription(evt.description || '');
    setDescriptionKannada(evt.descriptionKannada || '');
    setAccessPermission(evt.accessPermission);
    setStatus(evt.status);
    setShowInNavbar(evt.showInNavbar ?? true);
    setCategoryOptionsInput(evt.categoryOptions?.join(', ') || '');
    setEnableQuantity(evt.enableQuantity || false);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !titleKannada.trim()) {
      showToast('Please enter title in both English and Kannada.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        titleKannada: titleKannada.trim(),
        description: description.trim(),
        descriptionKannada: descriptionKannada.trim(),
        accessPermission,
        status,
        showInNavbar,
        enableQuantity,
        categoryOptions: categoryOptionsInput
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      };

      if (!editingEvent && customSlug.trim()) {
        payload.slug = customSlug.trim();
      }

      if (editingEvent) {
        const res = await api.put(`/custom-events/${editingEvent._id}`, payload);
        if (res.data.status === 'success') {
          showToast('Event updated successfully!', 'success');
          setEvents((prev) =>
            prev.map((ev) => (ev._id === editingEvent._id ? res.data.event : ev))
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await api.post('/custom-events', payload);
        if (res.data.status === 'success') {
          showToast('New event created successfully!', 'success');
          setEvents((prev) => [res.data.event, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save event:', err);
      showToast(err.response?.data?.message || 'Failed to save event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = async (evt: CustomEventItem) => {
    const nextPerm = evt.accessPermission === 'PUBLIC' ? 'ADMIN_ONLY' : 'PUBLIC';
    try {
      const res = await api.put(`/custom-events/${evt._id}`, { accessPermission: nextPerm });
      if (res.data.status === 'success') {
        showToast(
          nextPerm === 'PUBLIC'
            ? 'Event is now open to Public registrations!'
            : 'Event access changed to Admin-Only!',
          'info'
        );
        setEvents((prev) =>
          prev.map((e) => (e._id === evt._id ? { ...e, accessPermission: nextPerm } : e))
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update permission.', 'error');
    }
  };

  const handleToggleStatus = async (evt: CustomEventItem) => {
    const nextStatus = evt.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      const res = await api.put(`/custom-events/${evt._id}`, { status: nextStatus });
      if (res.data.status === 'success') {
        showToast(
          nextStatus === 'ACTIVE'
            ? 'Event is now Active (Open)!'
            : 'Event is now Closed (Registration ended)!',
          'info'
        );
        setEvents((prev) =>
          prev.map((e) => (e._id === evt._id ? { ...e, status: nextStatus } : e))
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.', 'error');
    }
  };

  const handleDeleteEvent = async (evt: CustomEventItem) => {
    const confirmMsg = `WARNING: Are you sure you want to completely remove "${evt.titleKannada} / ${evt.title}"?\n\nThis will also delete ALL (${evt.registrationsCount || 0}) recorded registrations.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/custom-events/${evt._id}`);
      if (res.data.status === 'success') {
        showToast(res.data.message || 'Event and registrations removed successfully.', 'success');
        setEvents((prev) => prev.filter((e) => e._id !== evt._id));
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete event.', 'error');
    }
  };

  const filteredEvents = events.filter((e) => {
    const s = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(s) ||
      e.titleKannada.toLowerCase().includes(s) ||
      e.slug.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent-dark" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-kannada">
              {language === 'kn' ? 'ವಿಶೇಷ ನೋಂದಣಿ ಕಾರ್ಯಕ್ರಮಗಳು' : 'Special Registration Events'}
            </h1>
          </div>
          <p className="text-xs text-charcoal-light mt-1">
            {language === 'kn'
              ? 'ಕಥೆ ಮತ್ತು ಟಿ-ಶರ್ಟ್‌ನಂತೆ ಹೊಸ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ರಚಿಸಿ, ಸಾರ್ವಜನಿಕ/ಅಡ್ಮಿನ್ ಪ್ರವೇಶಾವಕಾಶ ನಿರ್ವಹಿಸಿ, ಮತ್ತು ಮುಕ್ತಾಯವಾದಾಗ ತೆಗೆದುಹಾಕಿ.'
              : 'Dynamically add registration drives (like Kathe or T-shirt), manage public/admin permissions, and remove when done.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light text-warm font-bold text-xs sm:text-sm rounded-xl shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>{language === 'kn' ? 'ಹೊಸ ಕಾರ್ಯಕ್ರಮ ರಚಿಸಿ' : 'Add New Event'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-warm-dark p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
          <input
            type="text"
            placeholder={language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ಹುಡುಕಿ...' : 'Search events...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-charcoal outline-none focus:border-accent"
          />
        </div>
        <span className="text-xs font-bold text-charcoal-light">
          {events.length} {language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳು' : 'Events'}
        </span>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-charcoal-light font-semibold">
          {language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳ ಪಟ್ಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading registration events...'}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-dark p-12 text-center text-charcoal-light space-y-3">
          <Layers className="h-10 w-10 text-charcoal-light mx-auto opacity-50" />
          <h3 className="font-bold text-base text-charcoal">
            {language === 'kn' ? 'ಯಾವುದೇ ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No Registration Events Found'}
          </h3>
          <p className="text-xs max-w-md mx-auto">
            {language === 'kn'
              ? 'ಹೊಸ ಸ್ಪರ್ಧೆ, ಸೇವೆ ಅಥವಾ ನೋಂದಣಿ ಕಾರ್ಯಕ್ರಮ ರಚಿಸಲು ಮೇಲಿನ "ಹೊಸ ಕಾರ್ಯಕ್ರಮ ರಚಿಸಿ" ಬಟನ್ ಒತ್ತಿ.'
              : 'Click "Add New Event" above to create a custom registration drive for competitions, sevas, or distribution rosters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const isPublic = evt.accessPermission === 'PUBLIC';
            const isActive = evt.status === 'ACTIVE';

            return (
              <div
                key={evt._id}
                className={`bg-white rounded-2xl border-2 transition shadow-xs flex flex-col justify-between overflow-hidden ${
                  isActive ? 'border-warm-dark hover:border-accent' : 'border-gray-200 bg-gray-50/50 opacity-80'
                }`}
              >
                <div className="p-5 space-y-4">
                  {/* Status & Permission Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(evt)}
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                          isPublic
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
                        }`}
                        title="Click to toggle access permission"
                      >
                        {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        <span>{isPublic ? 'Public (ಸಾರ್ವಜನಿಕ)' : 'Admin Only (ಅಡ್ಮಿನ್)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(evt)}
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                          isActive
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{isActive ? 'Active' : 'Closed'}</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-extrabold bg-warm-dark px-2 py-0.5 rounded text-charcoal">
                      {evt.year}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-primary font-kannada leading-tight">
                      {evt.titleKannada}
                    </h3>
                    <h4 className="font-bold text-sm text-charcoal">{evt.title}</h4>
                    {evt.description && (
                      <p className="text-xs text-charcoal-light line-clamp-2 pt-1">{evt.description}</p>
                    )}
                  </div>

                  {/* Categories Pills */}
                  {evt.categoryOptions && evt.categoryOptions.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-light block">
                        Categories / Options:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {evt.categoryOptions.map((c, i) => (
                          <span
                            key={i}
                            className="bg-warm text-charcoal border border-warm-dark text-[10px] font-bold px-2 py-0.5 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Counter */}
                  <div className="bg-warm/60 border border-warm-dark rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent-dark" />
                      <span className="text-xs font-bold text-charcoal">
                        {language === 'kn' ? 'ನೋಂದಾಯಿತರು:' : 'Registered Devotees:'}
                      </span>
                    </div>
                    <span className="text-base font-black text-primary bg-white px-2.5 py-0.5 rounded-lg border border-warm-dark shadow-xs">
                      {evt.registrationsCount || 0}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-warm-dark/40 border-t border-warm-dark flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/event-reg/${evt.slug}`}
                      target="_blank"
                      className="p-1.5 text-charcoal-light hover:text-primary hover:bg-white rounded-lg transition"
                      title="Open Public Link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(evt)}
                      className="p-1.5 text-charcoal-light hover:text-primary hover:bg-white rounded-lg transition"
                      title="Edit Event Details"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt)}
                      className="p-1.5 text-charcoal-light hover:text-rose-600 hover:bg-white rounded-lg transition"
                      title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    to={`/admin/custom-events/${evt._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-light text-warm text-xs font-extrabold rounded-lg shadow-xs transition"
                  >
                    <span>{language === 'kn' ? 'ನೋಂದಣಿ ಪಟ್ಟಿ' : 'Manage Roster'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-warm-dark p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-warm-dark pb-3">
              <h3 className="font-extrabold text-charcoal text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent-dark" />
                <span>
                  {editingEvent
                    ? language === 'kn'
                      ? 'ಕಾರ್ಯಕ್ರಮ ತಿದ್ದುಪಡಿ'
                      : 'Edit Registration Event'
                    : language === 'kn'
                    ? 'ಹೊಸ ನೋಂದಣಿ ಕಾರ್ಯಕ್ರಮ ರಚಿಸಿ'
                    : 'Create Registration Event'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-charcoal-light hover:text-charcoal rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              {/* Titles */}
              <div className="space-y-1">
                <label className="font-bold text-charcoal block">
                  ಕಾರ್ಯಕ್ರಮದ ಶೀರ್ಷಿಕೆ (ಕನ್ನಡದಲ್ಲಿ - Title Kannada) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ಉದಾ. ರಂಗೋಲಿ ಸ್ಪರ್ಧೆ / ಮೋದಕ ಸೇವೆ / ಕ್ರೀಡಾಕೂಟ"
                  value={titleKannada}
                  onChange={(e) => setTitleKannada(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-charcoal block">
                  Event Title (in English) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rangoli Competition / Modaka Seva"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal text-sm outline-none focus:border-accent"
                />
              </div>

              {!editingEvent && (
                <div className="space-y-1">
                  <label className="font-bold text-charcoal block">
                    URL Slug (ಐಚ್ಛಿಕ - Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. rangoli-competition (Auto-generated if left blank)"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal outline-none focus:border-accent"
                  />
                </div>
              )}

              {/* Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-charcoal block">ವಿವರಣೆ / ನಿಯಮಗಳು (ಕನ್ನಡ)</label>
                  <textarea
                    rows={3}
                    placeholder="ಕಾರ್ಯಕ್ರಮದ ನಿಯಮಗಳು, ಸಮಯ, ವಿಜೇತರ ಬಹುಮಾನ ಇತ್ಯಾದಿ ವಿವರ..."
                    value={descriptionKannada}
                    onChange={(e) => setDescriptionKannada(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 text-charcoal outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-charcoal block">Description / Rules (English)</label>
                  <textarea
                    rows={3}
                    placeholder="Event details, guidelines, rules, timings..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Category Options */}
              <div className="space-y-1">
                <label className="font-bold text-charcoal block">
                  ವರ್ಗಗಳು ಅಥವಾ ಆಯ್ಕೆಗಳು (Categories / Options - Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Junior (ಕಿರಿಯರು), Senior (ಹಿರಿಯರು), Open (ಮುಕ್ತ)"
                  value={categoryOptionsInput}
                  onChange={(e) => setCategoryOptionsInput(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal outline-none focus:border-accent"
                />
                <span className="text-[11px] text-charcoal-light">
                  Separate options by comma. Leave blank if no specific category selection is needed.
                </span>
              </div>

              {/* Permissions & Controls */}
              <div className="bg-warm/60 border border-warm-dark rounded-xl p-4 space-y-3">
                <span className="font-bold text-primary block">
                  ಪ್ರವೇಶಾನುಮತಿ ಮತ್ತು ಸೆಟ್ಟಿಂಗ್ಸ್ (Access Permissions & Settings)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-charcoal block">User Permission (ಪ್ರವೇಶಾವಕಾಶ):</label>
                    <select
                      value={accessPermission}
                      onChange={(e) => setAccessPermission(e.target.value as any)}
                      className="w-full bg-white border border-warm-dark rounded-lg p-2 text-charcoal font-bold outline-none"
                    >
                      <option value="PUBLIC">🌐 PUBLIC (Anyone can register online)</option>
                      <option value="ADMIN_ONLY">🔒 ADMIN ONLY (Only Committee Admins can record)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-charcoal block">Event Status (ಸ್ಥಿತಿ):</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-white border border-warm-dark rounded-lg p-2 text-charcoal font-bold outline-none"
                    >
                      <option value="ACTIVE">✅ ACTIVE (Open for registrations)</option>
                      <option value="CLOSED">⛔ CLOSED (Registration ended)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-warm-dark">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableQuantity}
                      onChange={(e) => setEnableQuantity(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-bold text-charcoal">
                      Enable Quantity field (ಸಂಖ್ಯೆ - e.g. tickets, items, units)
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showInNavbar}
                      onChange={(e) => setShowInNavbar(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="font-bold text-charcoal">
                      Show in Website Navigation
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-dark">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-charcoal-light hover:text-charcoal transition"
                >
                  {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary hover:bg-primary-light text-warm font-extrabold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {saving
                    ? language === 'kn'
                      ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...'
                      : 'Saving...'
                    : language === 'kn'
                    ? 'ಕಾರ್ಯಕ್ರಮ ಉಳಿಸಿ'
                    : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
