import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Copy, Search, X, Check, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';

interface EventItem {
  _id: string;
  title: string;
  titleKannada: string;
  description?: string;
  descriptionKannada?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  category: string;
  status: string;
  year: string;
  featured: boolean;
  team?: { _id: string; name: string; nameKannada?: string };
}

interface Team {
  _id: string;
  name: string;
  nameKannada: string;
}

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

const getTimePeriodBadge = (timeStr: string) => {
  const mins = parseTimeToMinutes(timeStr);
  if (mins < 720) {
    return {
      label: '🌅 Morning (ಬೆಳಿಗ್ಗೆ)',
      color: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  } else if (mins < 1020) {
    return {
      label: '☀️ Afternoon (ಮಧ್ಯಾಹ್ನ)',
      color: 'bg-orange-100 text-orange-900 border-orange-300'
    };
  } else if (mins < 1260) {
    return {
      label: '🌆 Evening (ಸಂಜೆ)',
      color: 'bg-indigo-100 text-indigo-900 border-indigo-300'
    };
  } else {
    return {
      label: '🌙 Night (ರಾತ್ರಿ)',
      color: 'bg-purple-100 text-purple-900 border-purple-300'
    };
  }
};

const QUICK_TIME_SLOTS = [
  { label: '09:00 AM (ಬೆಳಿಗ್ಗೆ 9:00)', value: '09:00 AM' },
  { label: '10:00 AM (ಬೆಳಿಗ್ಗೆ 10:00)', value: '10:00 AM' },
  { label: '11:30 AM (ಬೆಳಿಗ್ಗೆ 11:30)', value: '11:30 AM' },
  { label: '12:30 PM (ಮಧ್ಯಾಹ್ನ 12:30)', value: '12:30 PM' },
  { label: '02:00 PM (ಮಧ್ಯಾಹ್ನ 2:00)', value: '02:00 PM' },
  { label: '04:00 PM (ಸಂಜೆ 4:00)', value: '04:00 PM' },
  { label: '06:00 PM (ಸಂಜೆ 6:00)', value: '06:00 PM' },
  { label: '07:30 PM (ರಾತ್ರಿ 7:30)', value: '07:30 PM' },
  { label: '09:00 PM (ರಾತ್ರಿ 9:00)', value: '09:00 PM' },
];

export const AdminEvents: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeYear, setActiveYear] = useState('2026');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [titleKannada, setTitleKannada] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionKannada, setDescriptionKannada] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Puja');
  const [status, setStatus] = useState('Upcoming');
  const [featured, setFeatured] = useState(false);
  const [team, setTeam] = useState('');
  const [eventYear, setEventYear] = useState('2026');

  useEffect(() => {
    fetchEvents();
    api.get('/teams').then(res => {
      if (res.data.status === 'success') setTeams(res.data.teams || []);
    }).catch(err => console.error(err));
  }, [activeYear]);

  const fetchEvents = () => {
    setLoading(true);
    let url = '/events';
    if (activeYear && activeYear !== 'all') {
      url += `?year=${activeYear}`;
    }

    api.get(url).then(res => {
      if (res.data.status === 'success') {
        const fetched = res.data.events || [];
        // Sort chronologically by date, then parsed time
        fetched.sort((a: EventItem, b: EventItem) => {
          const dateA = new Date(a.date).setHours(0, 0, 0, 0);
          const dateB = new Date(b.date).setHours(0, 0, 0, 0);
          if (dateA !== dateB) return dateA - dateB;
          return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
        });
        setEvents(fetched);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle('');
    setTitleKannada('');
    setDescription('');
    setDescriptionKannada('');
    setDate('2026-09-16');
    setStartTime('09:00 AM');
    setEndTime('');
    setLocation('Sri Ganapati Sannidhi, Najagara');
    setCategory('Puja');
    setStatus('Upcoming');
    setFeatured(false);
    setTeam('');
    setEventYear(activeYear !== 'all' ? activeYear : '2026');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: EventItem) => {
    setEditingId(evt._id);
    setTitle(evt.title);
    setTitleKannada(evt.titleKannada);
    setDescription(evt.description || '');
    setDescriptionKannada(evt.descriptionKannada || '');
    setDate(evt.date.split('T')[0]);
    setStartTime(evt.startTime);
    setEndTime(evt.endTime || '');
    setLocation(evt.location);
    setCategory(evt.category);
    setStatus(evt.status);
    setFeatured(evt.featured);
    setTeam(evt.team?._id || '');
    setEventYear(evt.year || activeYear || '2026');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      titleKannada: titleKannada.trim(),
      description: description.trim(),
      descriptionKannada: descriptionKannada.trim(),
      date,
      startTime: startTime.trim(),
      endTime: endTime.trim() || undefined,
      location: location.trim(),
      category,
      status,
      featured,
      team: team || undefined,
      year: eventYear || activeYear || '2026'
    };

    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, payload);
        showToast('Program event updated successfully!');
      } else {
        await api.post('/events', payload);
        showToast('Program event created successfully!');
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error(error);
      showToast('Failed to save program event.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/events/${id}`);
      showToast('Event deleted successfully.');
      fetchEvents();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete event.', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/events/${id}/duplicate`, { targetYear: activeYear !== 'all' ? activeYear : '2026' });
      showToast('Event duplicated successfully!');
      fetchEvents();
    } catch (error) {
      console.error(error);
      showToast('Failed to duplicate event.', 'error');
    }
  };

  const filteredEvents = events.filter(evt =>
    evt.title.toLowerCase().includes(search.toLowerCase()) ||
    evt.titleKannada.includes(search) ||
    evt.startTime.toLowerCase().includes(search.toLowerCase()) ||
    evt.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <Calendar className="h-7 w-7 text-accent-dark" />
            <span>Manage Ganeshotsava Programs & Schedule</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-light mt-1">
            Add, edit, duplicate, and arrange festival programs in chronological time order.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-primary text-warm font-bold px-4 py-2.5 rounded-xl hover:bg-primary-light transition shadow self-start sm:self-center text-xs sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Program</span>
        </button>
      </div>

      {/* Search & Year Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-warm-dark shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
          <input
            type="text"
            placeholder="Search programs by title, time, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-warm/60 border border-warm-dark pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm text-charcoal outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-charcoal-light uppercase">Year:</span>
          <select
            value={activeYear}
            onChange={(e) => setActiveYear(e.target.value)}
            className="bg-warm/60 border border-warm-dark rounded-xl px-3 py-2 text-xs font-bold text-charcoal outline-none"
          >
            <option value="2026">2026 (Active Festival)</option>
            <option value="2025">2025</option>
            <option value="all">All Years</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-charcoal-light font-medium">Loading programs...</div>
      ) : filteredEvents.length > 0 ? (
        <>
          {/* MOBILE CARDS: Touch-friendly */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredEvents.map(evt => {
              const period = getTimePeriodBadge(evt.startTime);
              return (
                <div key={evt._id} className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-warm-dark pb-2">
                    <div>
                      <h3 className="font-extrabold text-primary text-base font-kannada">{evt.titleKannada}</h3>
                      <p className="text-xs text-charcoal-light font-medium">{evt.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${period.color}`}>
                      {period.label}
                    </span>
                  </div>

                  {evt.descriptionKannada && (
                    <div className="text-xs text-charcoal bg-warm/50 p-2.5 rounded-xl border border-warm-dark font-kannada leading-relaxed">
                      <span className="font-bold text-[11px] text-primary block mb-0.5">ಸೇವಾದಾರರು / ವಿವರಣೆ:</span>
                      {evt.descriptionKannada}
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-charcoal-light">
                    <div className="flex items-center gap-1.5 font-bold text-charcoal">
                      <Clock className="h-3.5 w-3.5 text-secondary" />
                      <span>{evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ''}</span>
                      <span className="text-charcoal-light font-normal">({evt.date.split('T')[0]})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-accent-dark" />
                      <span>{evt.location}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="bg-accent/20 text-primary font-bold px-2 py-0.5 rounded text-[10px]">
                        {evt.category}
                      </span>
                      {evt.featured && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          ★ Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-warm-dark/60 pt-2">
                    <button
                      onClick={() => handleOpenEditModal(evt)}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition shadow-xs"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-accent-dark" />
                      <span>Edit / ತಿದ್ದುಪಡಿ</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(evt._id)}
                      className="p-1.5 border border-warm-dark hover:bg-warm rounded-lg text-secondary transition"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(evt._id)}
                      className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden sm:block bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-dark/40 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                    <th className="p-4">Program & Sevadararu</th>
                    <th className="p-4">Time Order</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Featured</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-dark text-sm">
                  {filteredEvents.map(evt => {
                    const period = getTimePeriodBadge(evt.startTime);
                    return (
                      <tr key={evt._id} className="hover:bg-warm-dark/5 transition">
                        <td className="p-4">
                          <div className="font-extrabold text-primary text-base font-kannada">{evt.titleKannada}</div>
                          <div className="text-xs text-charcoal-light font-medium">{evt.title}</div>
                          {evt.descriptionKannada && (
                            <div className="mt-1.5 text-xs text-charcoal bg-warm/60 p-2 rounded-lg border border-warm-dark/60 font-kannada max-w-md leading-relaxed">
                              <span className="font-bold text-primary mr-1">ಸೇವಾದಾರರು:</span>
                              {evt.descriptionKannada}
                            </div>
                          )}
                          <div className="text-[11px] text-charcoal-light flex items-center gap-1 mt-1.5">
                            <MapPin className="h-3 w-3 text-accent-dark" />
                            <span>{evt.location}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-charcoal">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-secondary" />
                            <span>{evt.startTime}</span>
                            {evt.endTime && <span className="text-xs text-charcoal-light">- {evt.endTime}</span>}
                          </div>
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${period.color}`}>
                            {period.label}
                          </span>
                        </td>
                        <td className="p-4 text-charcoal font-semibold text-xs">
                          {evt.date.split('T')[0]}
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold bg-accent/20 text-primary px-2.5 py-0.5 rounded-full">
                            {evt.category}
                          </span>
                        </td>
                        <td className="p-4">
                          {evt.featured ? (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">★ Yes</span>
                          ) : (
                            <span className="text-xs text-charcoal-light">No</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(evt)}
                            className="p-1.5 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1 text-xs font-bold transition"
                            title="Edit Event"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDuplicate(evt._id)}
                            className="p-1.5 border border-warm-dark hover:bg-warm rounded-lg text-secondary transition"
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(evt._id)}
                            className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-warm-dark p-12 rounded-xl text-center text-charcoal-light">
          No programs found for year {activeYear}. Click "Add Program" to create one.
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-warm-dark max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-warm-dark pb-3">
              <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-accent-dark" />
                <span>{editingId ? 'Edit Program Event' : 'Add Program Event'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-warm text-charcoal-light"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm text-charcoal">
              {/* PRIMARY HIGHLIGHTED SECTION: Title Kannada & Sevadararu / Description Kannada */}
              <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-accent-dark" />
                    <span>ಮುಖ್ಯ ಕಾರ್ಯಕ್ರಮ ಮತ್ತು ಸೇವಾದಾರರ ವಿವರಗಳು (Kannada Details)</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/90 text-amber-950 font-bold px-2 py-0.5 rounded">
                    ಕನ್ನಡ ಮಾಹಿತಿ
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal flex items-center justify-between">
                    <span>ಕಾರ್ಯಕ್ರಮದ ಹೆಸರು (ಕನ್ನಡ) * / Title (Kannada)</span>
                    <span className="text-[10px] text-primary font-bold">ಮುಖ್ಯ ಶೀರ್ಷಿಕೆ</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={titleKannada}
                    onChange={(e) => setTitleKannada(e.target.value)}
                    placeholder="ಉದಾ: ಶ್ರೀ ಗಣೇಶ ಮೂರ್ತಿಯ ಪ್ರತಿಷ್ಠಾಪನೆ ಹಾಗೂ ಪೂಜೆ"
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 outline-none focus:border-primary font-bold text-base font-kannada text-charcoal shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal flex items-center justify-between">
                    <span>ಸೇವಾದಾರರ ಹೆಸರು ಹಾಗೂ ವಿವರಣೆ (ಕನ್ನಡ) / Description & Sevadararu (Kannada)</span>
                    <span className="text-[10px] text-accent-dark font-bold">ಸೇವಾದಾರರು / ಪ್ರಾಯೋಜಕರು</span>
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionKannada}
                    onChange={(e) => setDescriptionKannada(e.target.value)}
                    placeholder="ಉದಾ: ಶ್ರೀ ಗಣೇಶ ಮೂರ್ತಿಯ ಪ್ರತಿಷ್ಠಾಪನೆ, ಪೂಜೆ. ಮೂರ್ತಿಯ ಸೇವಾದಾರರು: ಶ್ರೀಮತಿ ರತ್ನ ಮತ್ತು ಗಣೇಶ ನಾಗಪ್ಪ ನಾಯ್ಕ..."
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 outline-none focus:border-primary font-kannada text-sm text-charcoal leading-relaxed shadow-inner"
                  />
                  <p className="text-[11px] text-amber-900/80 italic">
                    💡 ಮೂರ್ತಿ ಸೇವಾದಾರರು, ಅನ್ನಸಂತರ್ಪಣೆ ಅಥವಾ ಪೂಜಾ ಸೇವಾದಾರರ ಹೆಸರುಗಳನ್ನು ಇಲ್ಲಿ ನೇರವಾಗಿ ತಿದ್ದುಪಡಿ ಮಾಡಿ.
                  </p>
                </div>
              </div>

              {/* English Details */}
              <div className="bg-warm/40 border border-warm-dark/80 rounded-xl p-3 space-y-2.5">
                <span className="text-[11px] font-bold text-charcoal-light uppercase tracking-wider block">
                  English Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-xs">Title (English) *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Mahaganapati Puja"
                      className="w-full bg-white border border-warm-dark rounded-xl p-2 outline-none focus:border-accent font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-xs">Description (English)</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description or sponsors in English..."
                      className="w-full bg-white border border-warm-dark rounded-xl p-2 outline-none focus:border-accent resize-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time Settings */}
              <div className="space-y-2 border border-warm-dark/80 bg-warm/30 p-3.5 rounded-xl">
                <span className="font-extrabold text-xs text-primary block uppercase tracking-wider">
                  Program Schedule & Timing (ಸಮಯಾವಧಿ)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-xs">Date (ದಿನಾಂಕ) *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white border border-warm-dark rounded-xl p-2 outline-none font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-xs">Start Time (ಪ್ರಾರಂಭದ ಸಮಯ) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 09:00 AM"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-white border border-warm-dark rounded-xl p-2 outline-none font-bold text-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-xs">End Time (ಮುಕ್ತಾಯದ ಸಮಯ)</label>
                    <input
                      type="text"
                      placeholder="e.g. 11:30 AM (Optional)"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-white border border-warm-dark rounded-xl p-2 outline-none font-semibold"
                    />
                  </div>
                </div>

                {/* Quick Pick Time Presets */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-charcoal-light uppercase block mb-1">
                    Quick Pick Time Slots:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TIME_SLOTS.map(slot => (
                      <button
                        type="button"
                        key={slot.value}
                        onClick={() => setStartTime(slot.value)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                          startTime === slot.value
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-charcoal border-warm-dark hover:bg-warm'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Location (ಸ್ಥಳ) *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Sri Ganapati Sannidhi, Najagara"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs">Festival Year (ವರ್ಷ) *</label>
                  <input
                    type="text"
                    required
                    value={eventYear}
                    onChange={(e) => setEventYear(e.target.value)}
                    placeholder="2026"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Category, Status, Committee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none font-semibold"
                  >
                    {['Puja', 'Religious', 'Cultural', 'Community', 'Food', 'Volunteer', 'Procession', 'Immersion', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none font-semibold"
                  >
                    {['Upcoming', 'Starting Soon', 'Happening Now', 'Completed'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs">Responsible Team</label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none font-semibold"
                  >
                    <option value="">No Team Assigned</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 text-primary rounded"
                />
                <label htmlFor="featured" className="font-bold text-xs cursor-pointer">
                  Feature on Homepage Announcement (ಮುಖಪುಟದಲ್ಲಿ ತೋರಿಸು)
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-warm-dark pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-warm-dark rounded-xl text-charcoal hover:bg-warm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-warm font-bold rounded-xl hover:bg-primary-light transition shadow"
                >
                  {editingId ? 'Update Program' : 'Save Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

