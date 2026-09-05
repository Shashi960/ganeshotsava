import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';

interface EventItem {
  _id: string;
  title: string;
  titleKannada: string;
  description?: string;
  descriptionKannada?: string;
  date: string;
  startTime: string;
  location: string;
  category: string;
  featured: boolean;
  team?: { name: string; nameKannada: string };
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

export const Events: React.FC = () => {
  const { language, t } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    api.get('/events').then((res) => {
      if (res.data.status === 'success') {
        setEvents(res.data.events);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

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

                    {evt.featured && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        ★ Featured
                      </span>
                    )}
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
    </div>
  );
};
