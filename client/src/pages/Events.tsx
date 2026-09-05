import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { 
  Calendar, Clock, MapPin, Search, Plus, Edit2, Trash2, 
  X, Check, Sparkles, Shield, LayoutDashboard 
} from 'lucide-react';

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
  featured: boolean;
  team?: { _id?: string; name: string; nameKannada?: string };
  year?: string;
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

const getTimePeriodBadge = (timeStr: string, lang: string) => {
  const mins = parseTimeToMinutes(timeStr);
  if (mins < 720) {
    return {
      label: lang === 'kn' ? 'ಬೆಳಿಗ್ಗೆ (Morning)' : 'Morning',
      color: 'bg-amber-100 text-amber-900 border-amber-300'
    };
  } else if (mins < 1020) {
    return {
      label: lang === 'kn' ? 'ಮಧ್ಯಾಹ್ನ (Afternoon)' : 'Afternoon',
      color: 'bg-orange-100 text-orange-900 border-orange-300'
    };
  } else if (mins < 1260) {
    return {
      label: lang === 'kn' ? 'ಸಂಜೆ (Evening)' : 'Evening',
      color: 'bg-indigo-100 text-indigo-900 border-indigo-300'
    };
  } else {
    return {
      label: lang === 'kn' ? 'ರಾತ್ರಿ (Night)' : 'Night',
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

export const Events: React.FC = () => {
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states for Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [titleKannada, setTitleKannada] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionKannada, setDescriptionKannada] = useState('');
  const [date, setDate] = useState('2026-09-14');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('Sri Ganapati Sannidhi, Kelaginuru');
  const [category, setCategory] = useState('Puja');
  const [featured, setFeatured] = useState(false);
  const [team, setTeam] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    api.get('/events').then((res) => {
      if (res.data.status === 'success') {
        setEvents(res.data.events || []);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchEvents();
    api.get('/teams').then(res => {
      if (res.data.status === 'success') setTeams(res.data.teams || []);
    }).catch(err => console.error(err));
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setTitle('');
    setTitleKannada('');
    setDescription('');
    setDescriptionKannada('');
    setDate('2026-09-14');
    setStartTime('09:00 AM');
    setEndTime('');
    setLocation('Sri Ganapati Sannidhi, Kelaginuru');
    setCategory('Puja');
    setFeatured(false);
    setTeam('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: EventItem) => {
    setEditingId(evt._id);
    setTitle(evt.title);
    setTitleKannada(evt.titleKannada);
    setDescription(evt.description || '');
    setDescriptionKannada(evt.descriptionKannada || '');
    setDate(evt.date ? evt.date.split('T')[0] : '2026-09-14');
    setStartTime(evt.startTime);
    setEndTime(evt.endTime || '');
    setLocation(evt.location || 'Sri Ganapati Sannidhi, Kelaginuru');
    setCategory(evt.category || 'Puja');
    setFeatured(evt.featured || false);
    setTeam(evt.team?._id || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleKannada.trim() && !title.trim()) {
      showToast(language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Event title is required', 'warning');
      return;
    }
    if (!date) {
      showToast(language === 'kn' ? 'ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ' : 'Date is required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim() || titleKannada.trim(),
        titleKannada: titleKannada.trim() || title.trim(),
        description: description.trim(),
        descriptionKannada: descriptionKannada.trim(),
        date,
        startTime: startTime.trim(),
        endTime: endTime.trim() || undefined,
        location: location.trim(),
        category,
        status: 'Upcoming',
        featured,
        team: team || undefined,
        year: new Date(date).getFullYear().toString()
      };

      if (editingId) {
        const res = await api.put(`/events/${editingId}`, payload);
        if (res.data.status === 'success') {
          showToast(language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ!' : 'Event updated successfully!', 'success');
          fetchEvents();
          setIsModalOpen(false);
        }
      } else {
        const res = await api.post('/events', payload);
        if (res.data.status === 'success') {
          showToast(language === 'kn' ? 'ಹೊಸ ಕಾರ್ಯಕ್ರಮ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!' : 'Event created successfully!', 'success');
          fetchEvents();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Failed to save event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, eventTitle?: string) => {
    const confirmMsg = language === 'kn'
      ? `ಖಚಿತವಾಗಿ ನೀವು "${eventTitle || 'ಈ ಕಾರ್ಯಕ್ರಮವನ್ನು'}" ಅಳಿಸಲು ಬಯಸುವಿರಾ?`
      : `Are you sure you want to delete "${eventTitle || 'this event'}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/events/${id}`);
      if (res.data.status === 'success') {
        showToast(language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ಅಳಿಸಲಾಗಿದೆ.' : 'Event deleted successfully.', 'success');
        setEvents(prev => prev.filter(e => e._id !== id));
      }
    } catch (err) {
      console.error(err);
      showToast(language === 'kn' ? 'ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to delete event.', 'error');
    }
  };

  // Filter categories helper
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'Puja', label: 'Pooja / Rituals' },
    { value: 'Religious', label: 'Religious Events' },
    { value: 'Cultural', label: 'Cultural / Sports' },
    { value: 'Community', label: 'Community' },
    { value: 'Procession', label: 'Procession' }
  ];

  // Map dates to Days dynamically based on scheduled events
  const getUniqueDates = () => {
    const dates = events.map(e => e.date.split('T')[0]);
    return Array.from(new Set(dates)).sort();
  };

  const getDayLabel = (dateStr: string) => {
    const sortedUniqueDates = getUniqueDates();
    const dStr = new Date(dateStr).toISOString().split('T')[0];
    const index = sortedUniqueDates.indexOf(dStr);
    if (index !== -1) {
      if (index === sortedUniqueDates.length - 1) {
        return `Day ${index + 1} (Final)`;
      }
      return `Day ${index + 1}`;
    }
    return 'Other';
  };

  const sortedUniqueDates = Array.from(new Set(events.map(e => e.date.split('T')[0]))).sort();
  const days = [
    { value: 'all', label: 'All Days' },
    ...sortedUniqueDates.map((dateStr, index) => {
      const label = index === sortedUniqueDates.length - 1 ? `Day ${index + 1} (Final)` : `Day ${index + 1}`;
      const dObj = new Date(dateStr);
      const formattedDate = dObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      return { value: label, label: `${label} (${formattedDate})` };
    })
  ];

  const filteredEvents = events.filter((evt) => {
    const dayLabel = getDayLabel(evt.date);
    const matchesDay = selectedDay === 'all' || dayLabel.includes(selectedDay) || (selectedDay === 'Day 5 (Final)' && dayLabel.includes('Final'));
    const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory;
    return matchesDay && matchesCategory;
  });

  // Strict chronological sort: Date first, then time (Morning 9am, 10am, afternoon, evening, night)
  const sortedFilteredEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.date).setHours(0, 0, 0, 0);
    const dateB = new Date(b.date).setHours(0, 0, 0, 0);
    if (dateA !== dateB) return dateA - dateB;
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navEvents')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          {language === 'kn'
            ? 'ಗಣೇಶೋತ್ಸವದ ಕಾರ್ಯಕ್ರಮಗಳ ಕಾಲಾವಧಿ ಮತ್ತು ಸಂಪೂರ್ಣ ವಿವರಗಳು.'
            : 'Explore the chronological program schedule of Ganeshotsava.'}
        </p>
      </div>

      {/* Admin Action Bar */}
      {isAuthenticated && (
        <div className="bg-white border-2 border-accent/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              {language === 'kn' ? 'ನಿರ್ವಾಹಕ ಮೋಡ್ ಸಕ್ರಿಯ' : 'Admin Mode Active'}
            </span>
            <span className="text-xs text-charcoal-light hidden sm:inline">
              {language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ನೇರವಾಗಿ ತಿದ್ದುಪಡಿ ಮಾಡಿ ಅಥವಾ ಹೊಸದಾಗಿ ಸೇರಿಸಿ.' : 'Edit existing programs or add new festival events directly.'}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-light text-warm rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'kn' ? 'ಹೊಸ ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ' : '+ Add New Event'}</span>
            </button>
            <Link
              to="/admin/events"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-warm border border-warm-dark hover:bg-warm-dark rounded-xl text-xs font-bold text-charcoal transition"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳ ಮ್ಯಾನೇಜರ್' : 'Events Board'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Program filters */}
      <div className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Day switch tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {days.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDay(d.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                selectedDay === d.value
                  ? 'bg-primary text-warm border border-primary'
                  : 'bg-warm-dark hover:bg-warm-dark/80 text-charcoal border border-transparent'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Category filters dropdown */}
        <div className="w-full md:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-warm-dark bg-warm rounded-lg p-2 text-sm font-semibold text-charcoal focus:border-accent outline-none"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Timeline */}
      {loading ? (
        <div className="py-20 text-center font-semibold text-charcoal-light">Loading schedule...</div>
      ) : sortedFilteredEvents.length > 0 ? (
        <div className="relative border-l-2 border-accent/40 ml-4 md:ml-32 pl-6 md:pl-10 space-y-8">
          {sortedFilteredEvents.map((evt) => {
            const dayLabel = getDayLabel(evt.date);
            const period = getTimePeriodBadge(evt.startTime, language);

            return (
              <div key={evt._id} className="relative group">
                {/* Desktop Left-aligned Day Label */}
                <div className="hidden md:block absolute -left-[140px] top-1 text-right w-24">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest block">
                    {dayLabel}
                  </span>
                  <span className="text-[10px] text-charcoal-light font-medium block">
                    {new Date(evt.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Left Dot Indicator */}
                <span className="absolute -left-[31px] md:-left-[47px] top-1.5 bg-accent border-2 border-white rounded-full h-4 w-4 group-hover:scale-125 transition"></span>

                <div className="bg-white rounded-xl border border-warm-dark p-6 shadow-sm hover:shadow-md transition space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-dark pb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-accent/20 text-primary px-2.5 py-0.5 rounded-full">
                        {evt.category}
                      </span>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${period.color}`}>
                        {period.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.featured && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                          ★ Featured
                        </span>
                      )}

                      {isAuthenticated && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={() => handleOpenEditModal(evt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition border border-primary/30 shadow-sm"
                            title={language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ತಿದ್ದುಪಡಿ' : 'Edit Event'}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>{language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(evt._id, language === 'kn' ? evt.titleKannada : evt.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition border border-rose-200 shadow-sm"
                            title={language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ಅಳಿಸಿ' : 'Delete Event'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{language === 'kn' ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Mobile Only Day Tag */}
                    <span className="md:hidden text-xs font-extrabold text-secondary uppercase block mb-1">
                      {dayLabel} • {new Date(evt.date).toLocaleDateString()}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-primary">
                      {language === 'kn' ? evt.titleKannada : evt.title}
                    </h3>
                    <p className="text-sm sm:text-base text-charcoal-light leading-relaxed font-kannada">
                      {language === 'kn' ? evt.descriptionKannada : evt.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-charcoal-light pt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span className="font-bold text-charcoal">{evt.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-accent-dark" />
                      <span>{evt.location}</span>
                    </div>
                    {evt.team && (
                      <div className="text-accent-dark border-l border-warm-dark pl-4">
                        Responsible: <span className="font-bold">{language === 'kn' ? evt.team.nameKannada : evt.team.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light">
          No events match the selected filters.
        </div>
      )}

      {/* Admin Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 relative border border-warm-dark">
            <div className="flex justify-between items-center border-b border-warm-dark pb-3 mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-dark" />
                <span>
                  {editingId 
                    ? (language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮದ ವಿವರ ತಿದ್ದುಪಡಿ ಮಾಡಿ' : 'Edit Program Details') 
                    : (language === 'kn' ? 'ಹೊಸ ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ' : 'Add New Event')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-charcoal-light hover:text-charcoal transition p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm text-charcoal">
              {/* Title Kannada */}
              <div className="space-y-1">
                <label className="font-bold text-xs block text-charcoal">
                  {language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮದ ಹೆಸರು (ಕನ್ನಡ) *' : 'Event Title (Kannada) *'}
                </label>
                <input
                  type="text"
                  required
                  value={titleKannada}
                  onChange={(e) => setTitleKannada(e.target.value)}
                  placeholder="ಉದಾ: ಶ್ರೀ ಗಣೇಶ ಮೂರ್ತಿಯ ಪ್ರತಿಷ್ಠಾಪನೆ ಹಾಗೂ ಪೂಜೆ"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-semibold font-kannada"
                />
              </div>

              {/* Title English */}
              <div className="space-y-1">
                <label className="font-bold text-xs block text-charcoal">
                  {language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮದ ಹೆಸರು (English)' : 'Event Title (English)'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ganesha Idol Installation & Pooja"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent"
                />
              </div>

              {/* Date & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ದಿನಾಂಕ (Date) *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ವರ್ಗ (Category)' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-semibold"
                  >
                    <option value="Puja">Puja / Rituals (ಪೂಜೆ / ಧಾರ್ಮಿಕ)</option>
                    <option value="Religious">Religious (ಧಾರ್ಮಿಕ)</option>
                    <option value="Cultural">Cultural (ಸಾಂಸ್ಕೃತಿಕ / ಕ್ರೀಡೆ)</option>
                    <option value="Community">Community (ಸಾಮುದಾಯಿಕ)</option>
                    <option value="Procession">Procession (ಮೆರವಣಿಗೆ / ವಿಸರ್ಜನೆ)</option>
                  </select>
                </div>
              </div>

              {/* Start Time with Quick Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-xs block text-charcoal">
                  {language === 'kn' ? 'ಪ್ರಾರಂಭ ಸಮಯ (Start Time) *' : 'Start Time *'}
                </label>
                <input
                  type="text"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="e.g. 09:00 AM or 12:00 PM"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-bold text-primary"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-charcoal-light font-bold self-center mr-1">Quick-Pick:</span>
                  {QUICK_TIME_SLOTS.map(slot => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setStartTime(slot.value)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition ${
                        startTime.trim().toLowerCase() === slot.value.toLowerCase()
                          ? 'bg-primary text-warm border-primary'
                          : 'bg-warm hover:bg-warm-dark border-warm-dark text-charcoal'
                      }`}
                    >
                      {slot.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* End Time & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ಮುಕ್ತಾಯ ಸಮಯ (End Time)' : 'End Time (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 01:30 PM"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ಸ್ಥಳ (Location)' : 'Location'}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Sri Ganapati Sannidhi"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-medium"
                  />
                </div>
              </div>

              {/* Responsible Team */}
              {teams.length > 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ಜವಾಬ್ದಾರಿಯುತ ಸಮಿತಿ (Responsible Team)' : 'Responsible Team'}
                  </label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent"
                  >
                    <option value="">-- {language === 'kn' ? 'ಯಾವುದೂ ಇಲ್ಲ' : 'None'} --</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>
                        {language === 'kn' ? t.nameKannada : t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description (Kannada) */}
              <div className="space-y-1">
                <label className="font-bold text-xs block text-charcoal">
                  {language === 'kn' ? 'ವಿವರಣೆ / ಸೇವಾದಾರರ ಮಾಹಿತಿ (ಕನ್ನಡ)' : 'Description (Kannada)'}
                </label>
                <textarea
                  rows={2}
                  value={descriptionKannada}
                  onChange={(e) => setDescriptionKannada(e.target.value)}
                  placeholder="ವಿವರಣೆ ಅಥವಾ ಸೇವಾದಾರರ ಹೆಸರುಗಳನ್ನು ನಮೂದಿಸಿ"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent resize-none font-kannada text-xs"
                />
              </div>

              {/* Description (English) */}
              <div className="space-y-1">
                <label className="font-bold text-xs block text-charcoal">
                  {language === 'kn' ? 'ವಿವರಣೆ (English)' : 'Description (English)'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description or sponsors details"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent resize-none text-xs"
                />
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="evt-featured-modal"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 text-primary rounded border-warm-dark focus:ring-accent"
                />
                <label htmlFor="evt-featured-modal" className="font-bold text-xs text-charcoal cursor-pointer flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent-dark" />
                  <span>{language === 'kn' ? 'ವಿಶೇಷ ಕಾರ್ಯಕ್ರಮವಾಗಿ ಗುರುತಿಸಿ (Featured Event)' : 'Mark as Featured Program'}</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-warm-dark pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-warm-dark rounded-xl text-charcoal hover:bg-warm font-semibold transition"
                >
                  {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-primary text-warm font-bold rounded-xl hover:bg-primary-light transition shadow disabled:opacity-50"
                >
                  {saving 
                    ? (language === 'kn' ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') 
                    : (language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ಉಳಿಸಿ' : 'Save Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
