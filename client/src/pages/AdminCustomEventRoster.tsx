import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { exportCustomEventToPdf } from '../utils/pdfExport';
import {
  ArrowLeft,
  Users,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Search,
  X,
  Phone,
  Home,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CustomEventItem } from './AdminCustomEvents';

interface RegistrationItem {
  _id: string;
  eventId: string;
  name: string;
  phone?: string;
  homeName?: string;
  category?: string;
  quantity: number;
  notes?: string;
  registeredBy: 'PUBLIC' | 'ADMIN';
  createdAt: string;
}

export const AdminCustomEventRoster: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { showToast } = useToast();

  const [event, setEvent] = useState<CustomEventItem | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [stats, setStats] = useState<{
    totalRegistrations: number;
    totalQuantity: number;
    categoryBreakdown: Record<string, number>;
  }>({
    totalRegistrations: 0,
    totalQuantity: 0,
    categoryBreakdown: {},
  });

  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Add / Edit Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<RegistrationItem | null>(null);
  const [savingReg, setSavingReg] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formHomeName, setFormHomeName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    fetchRoster();
  }, [id]);

  const fetchRoster = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/custom-events/${id}/registrations`);
      if (res.data.status === 'success') {
        setEvent(res.data.event);
        setRegistrations(res.data.registrations || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load event roster.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingReg(null);
    setFormName('');
    setFormPhone('');
    setFormHomeName('');
    setFormCategory(event?.categoryOptions?.[0] || '');
    setFormQuantity(1);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reg: RegistrationItem) => {
    setEditingReg(reg);
    setFormName(reg.name);
    setFormPhone(reg.phone || '');
    setFormHomeName(reg.homeName || '');
    setFormCategory(reg.category || '');
    setFormQuantity(reg.quantity || 1);
    setFormNotes(reg.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Participant name is required.', 'warning');
      return;
    }

    setSavingReg(true);
    try {
      const payload: any = {
        name: formName.trim(),
        phone: formPhone.trim(),
        homeName: formHomeName.trim(),
        category: formCategory.trim(),
        quantity: Math.max(1, formQuantity || 1),
        notes: formNotes.trim(),
      };

      if (editingReg) {
        const res = await api.put(`/custom-events/registrations/${editingReg._id}`, payload);
        if (res.data.status === 'success') {
          showToast('Entry updated successfully!', 'success');
          setIsModalOpen(false);
          fetchRoster();
        }
      } else {
        const res = await api.post(`/custom-events/${id}/registrations`, payload);
        if (res.data.status === 'success') {
          showToast('Participant registered successfully!', 'success');
          setIsModalOpen(false);
          fetchRoster();
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save entry.', 'error');
    } finally {
      setSavingReg(false);
    }
  };

  const handleDeleteEntry = async (regId: string, devoteeName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${devoteeName}" from the roster?`)) return;

    try {
      const res = await api.delete(`/custom-events/registrations/${regId}`);
      if (res.data.status === 'success') {
        showToast('Registration deleted successfully.', 'success');
        fetchRoster();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete registration.', 'error');
    }
  };

  const handleDownloadPdf = async () => {
    if (!event || registrations.length === 0) {
      showToast('No registrations to download.', 'warning');
      return;
    }

    setDownloadingPdf(true);
    try {
      showToast(
        language === 'kn' ? 'ಕನ್ನಡ ಯೂನಿಕೋಡ್ ಪಿಡಿಎಫ್ ತಯಾರಾಗುತ್ತಿದೆ...' : 'Generating vector PDF document...',
        'info'
      );

      await exportCustomEventToPdf(event, registrations, language, {
        filenamePrefix: `${event.slug}_roster`,
        stats,
      });

      showToast(
        language === 'kn' ? 'ಪಿಡಿಎಫ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!' : 'PDF downloaded successfully!',
        'success'
      );
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to export PDF.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch =
        r.name.toLowerCase().includes(s) ||
        (r.phone || '').toLowerCase().includes(s) ||
        (r.homeName || '').toLowerCase().includes(s) ||
        (r.category || '').toLowerCase().includes(s);

      const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [registrations, search, categoryFilter]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-charcoal-light font-semibold">
        Loading event roster...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-charcoal">Event Not Found</h2>
        <Link
          to="/admin/custom-events"
          className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Events List</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/custom-events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal-light hover:text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'kn' ? 'ಎಲ್ಲಾ ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to All Events'}</span>
        </Link>

        <Link
          to={`/event-reg/${event.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-bold text-accent-dark hover:underline"
        >
          <span>{language === 'kn' ? 'ಸಾರ್ವಜನಿಕ ನೋಂದಣಿ ಪುಟ ವೀಕ್ಷಿಸಿ' : 'View Public Registration Page'}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Event Header Banner */}
      <div className="bg-white rounded-2xl border-2 border-accent/40 p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-primary text-warm">
                {event.year}
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                  event.accessPermission === 'PUBLIC'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                }`}
              >
                {event.accessPermission === 'PUBLIC' ? '🌐 Public Registration' : '🔒 Admin Only'}
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                  event.status === 'ACTIVE'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {event.status === 'ACTIVE' ? 'Active' : 'Closed'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-kannada mt-1">
              {event.titleKannada} ({event.title})
            </h1>
            {event.description && <p className="text-xs text-charcoal-light mt-1">{event.description}</p>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || registrations.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-accent-light text-primary-dark font-extrabold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Roster'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-light text-warm font-extrabold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'kn' ? 'ನೋಂದಣಿ ಸೇರಿಸಿ' : 'Add Entry'}</span>
            </button>
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="pt-3 border-t border-warm-dark flex flex-wrap items-center gap-3">
          <div className="bg-warm px-3 py-1.5 rounded-xl border border-warm-dark">
            <span className="text-[11px] font-bold text-charcoal-light uppercase block">Total Participants</span>
            <span className="text-lg font-black text-primary">{stats.totalRegistrations}</span>
          </div>

          {event.enableQuantity && (
            <div className="bg-warm px-3 py-1.5 rounded-xl border border-warm-dark">
              <span className="text-[11px] font-bold text-charcoal-light uppercase block">Total Quantity</span>
              <span className="text-lg font-black text-charcoal">{stats.totalQuantity}</span>
            </div>
          )}

          {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
            <div key={cat} className="bg-warm px-3 py-1.5 rounded-xl border border-warm-dark">
              <span className="text-[11px] font-bold text-charcoal-light uppercase block">{cat}</span>
              <span className="text-lg font-black text-charcoal">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-warm-dark p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
          <input
            type="text"
            placeholder={language === 'kn' ? 'ದಾಖಲಾದ ಹೆಸರು / ಮೊಬೈಲ್ ಹುಡುಕಿ...' : 'Search participant name/phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-charcoal outline-none focus:border-accent"
          />
        </div>

        {event.categoryOptions && event.categoryOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                categoryFilter === 'ALL'
                  ? 'bg-primary text-warm'
                  : 'bg-warm hover:bg-warm-dark text-charcoal border border-warm-dark'
              }`}
            >
              All
            </button>
            {event.categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-primary text-warm'
                    : 'bg-warm hover:bg-warm-dark text-charcoal border border-warm-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Roster Table */}
      {registrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-dark p-12 text-center text-charcoal-light font-medium">
          {language === 'kn'
            ? 'ಈ ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ಇನ್ನೂ ಯಾವುದೇ ನೋಂದಣಿ ದಾಖಲಾಗಿಲ್ಲ.'
            : 'No participant registrations recorded yet for this event.'}
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-warm-dark p-8 text-center text-charcoal-light font-medium">
          No entries match the filter criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-warm-dark overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-extrabold text-charcoal-light uppercase tracking-wider">
                <th className="p-4 text-center w-12">#</th>
                <th className="p-4">ಭಾಗವಹಿಸುವವರ ಹೆಸರು (Participant Name)</th>
                {event.categoryOptions && event.categoryOptions.length > 0 && (
                  <th className="p-4">ವರ್ಗ / ಆಯ್ಕೆ (Category)</th>
                )}
                <th className="p-4">ಮನೆತನ / ವಿಳಾಸ (Home)</th>
                <th className="p-4">ಸಂಪರ್ಕ (Phone)</th>
                {event.enableQuantity && <th className="p-4 text-center">ಸಂಖ್ಯೆ (Qty)</th>}
                <th className="p-4 text-right">ಕ್ರಮಗಳು (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-dark text-sm">
              {filteredRegistrations.map((reg, index) => (
                <tr key={reg._id} className="hover:bg-warm/60 transition">
                  <td className="p-4 text-center font-bold text-charcoal-light">{index + 1}</td>
                  <td className="p-4">
                    <div className="font-extrabold text-charcoal">{reg.name}</div>
                    {reg.notes && <div className="text-xs text-charcoal-light italic">{reg.notes}</div>}
                  </td>
                  {event.categoryOptions && event.categoryOptions.length > 0 && (
                    <td className="p-4">
                      {reg.category ? (
                        <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md bg-accent/20 text-accent-dark border border-accent/30">
                          {reg.category}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                  <td className="p-4 text-charcoal-light">{reg.homeName || '-'}</td>
                  <td className="p-4 text-charcoal-light font-medium">{reg.phone || '-'}</td>
                  {event.enableQuantity && (
                    <td className="p-4 text-center font-extrabold text-primary">{reg.quantity || 1}</td>
                  )}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(reg)}
                        className="p-1.5 text-primary hover:bg-warm-dark rounded-lg transition"
                        title="Edit Entry"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(reg._id, reg.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-warm-dark p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-warm-dark pb-3">
              <h3 className="font-extrabold text-charcoal text-base">
                {editingReg ? 'Edit Registration' : 'New Participant Registration'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-charcoal-light hover:text-charcoal rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-charcoal block">
                  ವ್ಯಕ್ತಿಯ ಹೆಸರು (Full Name) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter participant name..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-charcoal block">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Phone)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-charcoal block">ಮನೆತನ (Home / Address)</label>
                  <input
                    type="text"
                    placeholder="e.g. Najagara"
                    value={formHomeName}
                    onChange={(e) => setFormHomeName(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              {event.categoryOptions && event.categoryOptions.length > 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-charcoal block">ವರ್ಗ / ಆಯ್ಕೆ (Category / Option)</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal font-bold outline-none"
                  >
                    <option value="">-- Select Category --</option>
                    {event.categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {event.enableQuantity && (
                <div className="space-y-1">
                  <label className="font-bold text-charcoal block">ಸಂಖ್ಯೆ (Quantity / Count)</label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal font-bold outline-none focus:border-accent"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-charcoal block">ಟಿಪ್ಪಣಿ / ವಿವರ (Notes / Remarks)</label>
                <input
                  type="text"
                  placeholder="Optional notes or remarks..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-charcoal outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-dark">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-charcoal-light hover:text-charcoal transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReg}
                  className="px-5 py-2 bg-primary hover:bg-primary-light text-warm font-extrabold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {savingReg ? 'Saving...' : 'Save Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
