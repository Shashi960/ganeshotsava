import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

interface EventItem {
  _id: string;
  title: string;
  titleKannada: string;
  date: string;
  startTime: string;
  location: string;
  category: string;
}

export const CalendarView: React.FC = () => {
  const { language, t } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);
  // Start on August 2025 since all our seeded events are in August 2025
  const [currentDate, setCurrentDate] = useState(new Date('2025-08-01'));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date('2025-08-27'));

  useEffect(() => {
    api.get('/events').then((res) => {
      if (res.data.status === 'success') {
        setEvents(res.data.events);
        if (res.data.events.length > 0) {
          const firstEventDate = new Date(res.data.events[0].date);
          setCurrentDate(new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1));
          setSelectedDate(firstEventDate);
        }
      }
    }).catch((err) => console.error(err));
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);

  const getEventsForDate = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = dateToCheck.toISOString().split('T')[0];
    return events.filter(evt => {
      const evtDate = new Date(evt.date).toISOString().split('T')[0];
      return evtDate === dateString;
    });
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  // Render Calendar Grid Days
  const calendarDays = [];
  // Empty slots for alignment
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-12 border border-warm-dark bg-warm-dark/10"></div>);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const hasEvents = dayEvents.length > 0;
    const isSelected = selectedDate &&
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear();

    calendarDays.push(
      <button
        key={`day-${day}`}
        onClick={() => handleDateClick(day)}
        className={`h-12 border border-warm-dark relative flex flex-col justify-between items-center py-1 transition ${
          isSelected ? 'bg-primary text-warm font-bold' : 'bg-white hover:bg-warm-dark/40 text-charcoal'
        }`}
      >
        <span className="text-xs">{day}</span>
        {hasEvents && (
          <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-accent animate-pulse' : 'bg-secondary'}`}></span>
        )}
      </button>
    );
  }

  // Selected date events list
  const selectedDateEvents = selectedDate
    ? events.filter(evt => {
        const evtDate = new Date(evt.date).toISOString().split('T')[0];
        const selDateStr = selectedDate.toISOString().split('T')[0];
        return evtDate === selDateStr;
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navCalendar')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          Browse month-wise and select dates to explore daily programs and timings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Desktop Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-warm-dark p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal uppercase tracking-wider">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="p-2 border border-warm-dark rounded hover:bg-warm-dark/50 transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNextMonth} className="p-2 border border-warm-dark rounded hover:bg-warm-dark/50 transition">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center font-bold text-xs text-charcoal-light uppercase border-b border-warm-dark pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          <div className="grid grid-cols-7">
            {calendarDays}
          </div>
        </div>

        {/* Selected Day Events Column */}
        <div className="bg-white rounded-xl border border-warm-dark p-6 shadow-sm space-y-4">
          <div className="border-b border-accent/20 pb-2">
            <h2 className="text-base font-bold text-primary tracking-wide">
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select a Date'}
            </h2>
            <p className="text-xs text-charcoal-light">Events scheduled on this day</p>
          </div>

          <div className="space-y-3">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map(evt => (
                <div key={evt._id} className="p-3 bg-warm rounded-lg border border-warm-dark space-y-2">
                  <span className="inline-block text-[9px] font-bold tracking-widest uppercase bg-accent/20 text-primary px-2 py-0.5 rounded">
                    {evt.category}
                  </span>
                  <h3 className="font-bold text-charcoal text-sm leading-snug">
                    {language === 'kn' ? evt.titleKannada : evt.title}
                  </h3>
                  <div className="flex flex-col gap-1 text-[11px] text-charcoal-light font-semibold">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-secondary" />
                      <span>{evt.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-accent-dark" />
                      <span>{evt.location}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-charcoal-light font-semibold">
                No events scheduled for this date.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
