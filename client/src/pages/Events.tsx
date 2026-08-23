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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navEvents')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          Explore the chronological program events of the 34th annual celebration.
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
      ) : filteredEvents.length > 0 ? (
        <div className="relative border-l-2 border-accent/40 ml-4 md:ml-32 pl-6 md:pl-10 space-y-8">
          {filteredEvents.map((evt) => {
            const dayLabel = getDayLabel(evt.date);
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
                    <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-accent/20 text-primary px-2.5 py-0.5 rounded-full">
                      {evt.category}
                    </span>
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
                      <span>{evt.startTime}</span>
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
