import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Calendar, Clock, MapPin, Sparkles, Bell, ArrowRight, BookOpen, Award, Users } from 'lucide-react';

interface EventItem {
  _id: string;
  title: string;
  titleKannada: string;
  description?: string;
  descriptionKannada?: string;
  startTime: string;
  location: string;
  category: string;
  status: string;
}

interface Announcement {
  _id: string;
  title: string;
  titleKannada: string;
  description: string;
  descriptionKannada: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
}

export const Home: React.FC = () => {
  const { language, t } = useLanguage();
  const [todayEvents, setTodayEvents] = useState<EventItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [countdownText, setCountdownText] = useState('');
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [settings, setSettings] = useState<any>({});

  // Time mock for testing is Aug 17 2026. The 34th Ganeshotsava is seeded for Aug 27 - Aug 31 2025.
  // Wait, let's automatically check based on the current date, but let's base our countdown on 2025 Ganeshotsava dates.
  useEffect(() => {
    // Fetch all events to dynamically calculate the Ganeshotsava countdown range
    api.get('/events').then(res => {
      if (res.data.status === 'success' && res.data.events.length > 0) {
        const sortedDates = res.data.events
          .map((e: any) => new Date(e.date))
          .sort((a: any, b: any) => a.getTime() - b.getTime());
        
        const startDate = new Date(sortedDates[0]);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(sortedDates[sortedDates.length - 1]);
        endDate.setHours(23, 59, 59, 999);

        const today = new Date();
        if (today < startDate) {
          const diffTime = Math.abs(startDate.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setCountdownText(`${t('countdownBegins')} ${diffDays} ${t('days')}`);
        } else if (today >= startDate && today <= endDate) {
          const dayNo = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          setDayNumber(dayNo);
          setCountdownText(t('countdownDuring').replace('{day}', dayNo.toString()));
        } else {
          setCountdownText(t('countdownEnded'));
        }
      } else {
        setCountdownText(t('countdownEnded'));
      }
    }).catch(err => {
      console.error('Failed to calculate event dates:', err);
      setCountdownText(t('countdownEnded'));
    });
    
    // Fetch today's schedule
    const todayStr = new Date().toISOString().split('T')[0];
    api.get(`/events/today?date=${todayStr}`).then(res => {
      if (res.data.status === 'success') setTodayEvents(res.data.events);
    }).catch(err => console.error(err));

    api.get('/events/upcoming').then(res => {
      if (res.data.status === 'success') setUpcomingEvents(res.data.events);
    }).catch(err => console.error(err));

    api.get('/announcements?activeOnly=true').then(res => {
      if (res.data.status === 'success') setAnnouncements(res.data.announcements);
    }).catch(err => console.error(err));

    api.get('/settings').then(res => {
      if (res.data.status === 'success') setSettings(res.data.settings);
    }).catch(err => console.error(err));
  }, [language, t]);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'IMPORTANT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'NORMAL':
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  return (
    <div className="space-y-10 mandala-bg min-h-screen pb-16">
      {/* Premium Hero Banner */}
      <section className="relative bg-primary text-warm border-b-4 border-accent overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 shadow-xl text-center">
        <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative">
          <div className="flex justify-center mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 border border-accent/40 text-accent uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> 35th Ganeshotsava 2025
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-wider font-sanskrit text-accent leading-tight drop-shadow-md">
            {t('festivalName')}
          </h1>
          <p className="text-lg sm:text-2xl font-medium max-w-2xl mx-auto text-warm-dark font-kannada leading-relaxed">
            {t('festivalGreeting')}
          </p>

          {/* Countdown Indicator Banner */}
          <div className="mt-8 inline-block bg-primary-dark/80 backdrop-blur border-2 border-accent/50 rounded-lg px-6 py-4 shadow-xl">
            <span className="text-accent font-bold font-sanskrit block text-sm tracking-widest uppercase mb-1">
              FESTIVAL COUNTDOWN
            </span>
            <span className="text-xl sm:text-2xl font-bold font-kannada text-warm">
              {countdownText}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              to="/events"
              className="bg-accent text-primary-dark font-bold px-6 py-3 rounded-lg hover:bg-accent-light transition shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <span>{t('viewFullProgram')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="bg-primary-light/40 border border-warm/30 text-warm font-semibold px-6 py-3 rounded-lg hover:bg-primary-light/60 transition shadow-lg"
            >
              {t('navAbout')}
            </Link>
          </div>
        </div>
      </section>

      {/* Announcements Scroller */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-amber-50/50 border border-accent/30 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-accent/20 pb-2">
              <Bell className="h-5 w-5 text-secondary animate-bounce" />
              <h2 className="text-lg font-bold text-primary font-sanskrit tracking-wide">
                {t('announcementsTitle')}
              </h2>
            </div>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white ${getPriorityStyle(ann.priority)}`}
                >
                  <div>
                    <h3 className="font-bold text-charcoal">
                      {language === 'kn' ? ann.titleKannada : ann.title}
                    </h3>
                    <p className="text-sm text-charcoal-light mt-1">
                      {language === 'kn' ? ann.descriptionKannada : ann.description}
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border-2 self-start sm:self-center ${ann.priority === 'URGENT' ? 'border-rose-300 text-rose-800' : 'border-amber-300 text-amber-800'}`}>
                    {ann.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Today's Events (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-accent/30 pb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
              {t('todaysEventsTitle')}
            </h2>
            <span className="text-xs font-semibold bg-accent-dark/15 text-accent-dark px-2.5 py-1 rounded-full">
              {new Date().toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="space-y-4">
            {todayEvents.length > 0 ? (
              todayEvents.map((evt) => (
                <div
                  key={evt._id}
                  className="bg-white rounded-xl border border-warm-dark p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="space-y-2">
                    <span className="inline-block text-[10px] font-bold tracking-widest uppercase bg-accent/20 text-primary px-2.5 py-0.5 rounded-full">
                      {evt.category}
                    </span>
                    <h3 className="text-lg font-bold text-charcoal leading-snug">
                      {language === 'kn' ? evt.titleKannada : evt.title}
                    </h3>
                    <p className="text-sm text-charcoal-light font-kannada">
                      {language === 'kn' ? evt.descriptionKannada : evt.description}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center sm:items-end gap-1.5 border-t sm:border-t-0 sm:border-l border-warm-dark pt-3 sm:pt-0 sm:pl-6 min-w-[150px]">
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-light font-semibold">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span>{evt.startTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-light font-semibold">
                      <MapPin className="h-4 w-4 text-accent-dark" />
                      <span className="truncate max-w-[180px]">{evt.location}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${evt.status === 'Happening Now' ? 'bg-green-100 text-green-800 animate-pulse' : 'bg-warm-dark text-charcoal'}`}>
                      {evt.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-warm-dark p-8 text-center shadow-sm">
                <Calendar className="h-10 w-10 text-accent/50 mx-auto mb-2" />
                <p className="text-charcoal-light font-medium">{t('noEventsToday')}</p>
                <Link to="/events" className="text-sm text-secondary font-bold hover:underline mt-2 inline-block">
                  {t('viewFullProgram')} →
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Events Mini Timeline */}
          {upcomingEvents.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-bold text-primary border-b border-accent/20 pb-2">
                {t('upcomingEventsTitle')}
              </h2>
              <div className="relative border-l-2 border-accent/40 ml-4 pl-6 space-y-6">
                {upcomingEvents.map((evt) => (
                  <div key={evt._id} className="relative group">
                    <span className="absolute -left-[31px] top-1.5 bg-accent border-2 border-white rounded-full h-4 w-4 group-hover:scale-125 transition"></span>
                    <div className="space-y-1">
                      <span className="text-xs text-secondary font-bold">
                        {evt.startTime}
                      </span>
                      <h4 className="font-bold text-charcoal text-sm sm:text-base">
                        {language === 'kn' ? evt.titleKannada : evt.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-light">
                        <MapPin className="h-3 w-3 text-accent-dark" />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quick Access Modules */}
        <div className="space-y-6">
          {/* Sponsor Highlights Card */}
          <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 space-y-4">
            <h3 className="font-bold text-primary text-base flex items-center gap-1.5 border-b border-primary/15 pb-2">
              <Sparkles className="h-5 w-5 text-accent-dark animate-pulse" /> Sponsor Highlights
            </h3>
            
            <div className="space-y-3 font-kannada text-xs sm:text-sm text-charcoal">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Idol Sponsor (ಗಣಪತಿ ಮೂರ್ತಿ ಸೇವಾದಾರರು)</span>
                <p className="font-bold text-charcoal-dark leading-snug">{settings.idolSponsor || "ಶ್ರೀಮತಿ ರೇಖಾ ಮತ್ತು ಗಣೇಶ ನಾಗೇಶ ನಾಯ್ಕ, ನಾಜಗಾರ (ಪ್ರಭಾತನಗರ, ಹೊನ್ನಾವರ)"}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Annasantharpane Sponsor (ಅನ್ನ ಸಂತರ್ಪಣಾ ಸೇವಾದಾರರು)</span>
                <p className="font-bold text-charcoal-dark leading-snug">{settings.annasantharpaneSponsor || "ರಾಜೀಶ ನಾಗೇಶ ನಾಯ್ಕ ಹಾಗೂ ಕುಟುಂಬದವರು, ನಾಜಗಾರ (ಪ್ರಭಾತನಗರ, ಹೊನ್ನಾವರ)"}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Bhajans Sponsor (ಭಜನಾ ಕಾರ್ಯಕ್ರಮದ ಪ್ರಾಯೋಜಕರು)</span>
                <p className="font-bold text-charcoal-dark leading-snug">{settings.bhajansSponsor || "ತಿಮ್ಮಪ್ಪ ಆಚಾರ್ಯ ಹಾಗೂ ಮಾಯಿತಿ ಆಚಾರ್ಯ, ಸಾಲೇಬೈಲ್"}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Samuvasada Sponsor (ಸಮುವಸದ ಪ್ರಾಯೋಜಕರು)</span>
                <p className="font-bold text-charcoal-dark leading-snug">{settings.samuvasadaSponsor || "ಅಕ್ಷಯ್ಯ ಆಚಾರ್ಯ ಸಾಲೇಬೈಲ್ ಹಾಗೂ __________________"}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-secondary uppercase block">Vrata Prasada Sponsor (ಸತ್ಯ ಗಣಪತಿ ವ್ರತದ ಪ್ರಸಾದ ಹಾಗೂ ಪೂಜಾ ಸೇವಾದಾರರು)</span>
                <p className="font-bold text-charcoal-dark leading-snug">{settings.prasadaSponsor || "ಗಣಪತಿ ಆರ್. ನಾಯ್ಕ, ನಾಗೇಶ್ವರ ಕ್ರಾಸ್"}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-primary border-b border-accent/30 pb-3">
            QUICK ACCESS
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/kathe"
              className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm hover:shadow transition flex items-center gap-4 group"
            >
              <div className="p-3 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition text-secondary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal group-hover:text-secondary transition">
                  {t('navKathe')}
                </h3>
                <p className="text-xs text-charcoal-light">
                  Register names, view instructions & details.
                </p>
              </div>
            </Link>

            <Link
              to="/prasada"
              className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm hover:shadow transition flex items-center gap-4 group"
            >
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal group-hover:text-primary transition">
                  {t('navPrasada')}
                </h3>
                <p className="text-xs text-charcoal-light">
                  Track delivery progress by area/volunteers.
                </p>
              </div>
            </Link>

            <Link
              to="/auction"
              className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm hover:shadow transition flex items-center gap-4 group"
            >
              <div className="p-3 bg-accent/15 rounded-lg group-hover:bg-accent/25 transition text-accent-dark">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal group-hover:text-accent-dark transition">
                  {t('navAuction')}
                </h3>
                <p className="text-xs text-charcoal-light">
                  View auction list and payment tracking details.
                </p>
              </div>
            </Link>

            <Link
              to="/members"
              className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm hover:shadow transition flex items-center gap-4 group"
            >
              <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition text-charcoal-light">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal group-hover:text-accent-dark transition">
                  {t('navMembers')}
                </h3>
                <p className="text-xs text-charcoal-light">
                  Committee members, volunteers, teams directory.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
