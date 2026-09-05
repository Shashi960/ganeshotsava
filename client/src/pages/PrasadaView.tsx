import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Truck, CheckCircle2, AlertCircle, Clock, MapPin, Search, BookOpen, RefreshCw, XCircle, Sparkles, UserCheck } from 'lucide-react';

interface Stats {
  total: number;
  pending: number;
  assigned: number;
  outForDelivery: number;
  delivered: number;
  unableToDeliver: number;
  progress: number;
}

interface AreaBreakdown {
  placeId: string;
  name: string;
  nameKannada: string;
  total: number;
  delivered: number;
  pending: number;
}

interface Participant {
  _id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bookNo?: string;
  notes?: string;
  homeName?: string;
  place?: {
    _id?: string;
    name: string;
    nameKannada: string;
  };
}

interface Delivery {
  _id: string;
  homeName?: string;
  address?: string;
  participant?: Participant;
  place: { _id?: string; name: string; nameKannada: string };
  assignedVolunteer?: { name: string };
  status: 'PENDING' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'UNABLE_TO_DELIVER';
  deliveredAt?: string;
}

export const PrasadaView: React.FC = () => {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [areaBreakdown, setAreaBreakdown] = useState<AreaBreakdown[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [placeFilter, setPlaceFilter] = useState('all');
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, delRes] = await Promise.all([
        api.get('/prasada/stats'),
        api.get('/prasada')
      ]);

      if (statsRes.data.status === 'success') {
        setStats(statsRes.data.stats);
        setAreaBreakdown(statsRes.data.areaBreakdown || []);
        setIsDeliveryOpen(!!statsRes.data.isDeliveryOpen);
      }

      if (delRes.data.status === 'success') {
        setDeliveries(delRes.data.deliveries || []);
        if (delRes.data.isDeliveryOpen !== undefined) {
          setIsDeliveryOpen(!!delRes.data.isDeliveryOpen);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OUT_FOR_DELIVERY':
        return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UNABLE_TO_DELIVER':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'PENDING':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    if (language === 'kn') {
      switch (status) {
        case 'DELIVERED': return 'ತಲುಪಿಸಲಾಗಿದೆ';
        case 'OUT_FOR_DELIVERY': return 'ವಿತರಣೆಗೆ ಹೊರಟಿದೆ';
        case 'ASSIGNED': return 'ಸ್ವಯಂಸೇವಕರಿಗೆ ನಿಯೋಜಿತ';
        case 'UNABLE_TO_DELIVER': return 'ತಲುಪಿಸಲಾಗಿಲ್ಲ';
        case 'PENDING':
        default:
          return 'ವಿತರಣೆ ಬಾಕಿ';
      }
    }
    return status.replace(/_/g, ' ');
  };

  // Unique places for filtering
  const uniquePlaces = useMemo(() => {
    const map = new Map<string, string>();
    deliveries.forEach(d => {
      if (d.place && d.place.name) {
        const label = language === 'kn' && d.place.nameKannada ? d.place.nameKannada : d.place.name;
        map.set(d.place._id || d.place.name, label);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [deliveries, language]);

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(del => {
      const p = del.participant;
      const devoteeName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || del.homeName || '';
      const book = p?.bookNo || p?.notes || '';
      const area = `${del.place?.name || ''} ${del.place?.nameKannada || ''}`;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches = devoteeName.toLowerCase().includes(q) ||
          book.toLowerCase().includes(q) ||
          area.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (statusFilter !== 'all' && del.status !== statusFilter) return false;
      if (placeFilter !== 'all' && (del.place?._id !== placeFilter && del.place?.name !== placeFilter)) return false;
      return true;
    });
  }, [deliveries, search, statusFilter, placeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Title & Delivery Operational State Banner */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navPrasada')}
        </h1>
        <p className="text-charcoal-light max-w-xl mx-auto text-sm sm:text-base">
          {language === 'kn'
            ? 'ಶ್ರೀ ಸತ್ಯ ಗಣಪತಿ ವ್ರತ ಮಹಾಸಂಕಲ್ಪದ ಪ್ರಸಾದ ವಿತರಣೆಯ ಸ್ಥಿತಿಯನ್ನು ಇಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.'
            : 'Track area-wise Prasada delivery progress and devotee delivery status of Ganeshotsava.'}
        </p>

        {/* Delivery State Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider border shadow-sm mt-2">
          {isDeliveryOpen ? (
            <span className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{language === 'kn' ? '● ಪ್ರಸಾದ ವಿತರಣೆ ಪ್ರಾರಂಭವಾಗಿದೆ (Active Delivery)' : '● Prasada Delivery In Progress'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>{language === 'kn' ? 'ಪ್ರಸಾದ ವಿತರಣೆ ಶೀಘ್ರದಲ್ಲೇ ಪ್ರಾರಂಭವಾಗಲಿದೆ (Delivery Scheduled)' : 'Prasada Delivery Scheduled Soon'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards Section */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-warm-dark p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] sm:text-xs text-charcoal-light font-bold block uppercase tracking-wider">
              {language === 'kn' ? 'ಒಟ್ಟು ಮನೆಗಳು / ಭಕ್ತಾದಿಗಳು' : 'Total Devotees / Houses'}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal block">{stats.total}</span>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-200 p-4 sm:p-5 shadow-sm bg-emerald-50/20 space-y-1">
            <span className="text-[10px] sm:text-xs text-emerald-700 font-bold block uppercase tracking-wider">
              {language === 'kn' ? 'ತಲುಪಿಸಲಾಗಿದೆ' : 'Delivered'}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /> {stats.delivered}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-sm bg-amber-50/20 space-y-1">
            <span className="text-[10px] sm:text-xs text-amber-700 font-bold block uppercase tracking-wider">
              {language === 'kn' ? 'ಹೊರಟಿದೆ / ನಿಯೋಜಿತ' : 'In Transit / Assigned'}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 block flex items-center gap-1.5">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6" /> {stats.outForDelivery + stats.assigned}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm bg-slate-50/20 space-y-2">
            <span className="text-[10px] sm:text-xs text-slate-600 font-bold block uppercase tracking-wider">
              {language === 'kn' ? 'ಪ್ರಗತಿ' : 'Progress'}
            </span>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-xs text-emerald-700 font-extrabold block">{stats.progress}% Completed</span>
          </div>
        </div>
      )}

      {/* Area Breakdown Section */}
      {areaBreakdown.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-warm-dark pb-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-primary">
              {language === 'kn' ? 'ಪ್ರದೇಶವಾರು ವಿತರಣಾ ವಿವರ (Area Breakdown)' : 'Area Breakdown Progress'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {areaBreakdown.map((area) => {
              const areaProgress = area.total > 0 ? Math.round((area.delivered / area.total) * 100) : 0;
              return (
                <div key={area.placeId} className="bg-white rounded-2xl border border-warm-dark p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-warm-dark pb-2">
                    <h3 className="font-bold text-charcoal text-base">
                      {language === 'kn' ? area.nameKannada : area.name}
                    </h3>
                    <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {areaProgress}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 text-center gap-2">
                    <div className="p-2 bg-warm rounded-xl border border-warm-dark">
                      <span className="text-[9px] text-charcoal-light uppercase font-bold block">
                        {language === 'kn' ? 'ಒಟ್ಟು' : 'Total'}
                      </span>
                      <span className="font-extrabold text-charcoal block">{area.total}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
                      <span className="text-[9px] text-emerald-600 uppercase font-bold block">
                        {language === 'kn' ? 'ತಲುಪಿದೆ' : 'Done'}
                      </span>
                      <span className="font-extrabold block">{area.delivered}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">
                        {language === 'kn' ? 'ಬಾಕಿ' : 'Left'}
                      </span>
                      <span className="font-extrabold block">{area.pending}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Devotees Delivery Directory */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warm-dark pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-primary">
              {language === 'kn' ? 'ಭಕ್ತಾದಿಗಳ ಪ್ರಸಾದ ವಿತರಣಾ ಪಟ್ಟಿ' : 'Devotee Delivery Status Directory'}
            </h2>
            <p className="text-xs text-charcoal-light mt-0.5">
              {language === 'kn'
                ? 'ವ್ರತ ಮಹಾಸಂಕಲ್ಪದಲ್ಲಿ ನೋಂದಾಯಿತ ಭಕ್ತಾದಿಗಳ ಪ್ರಸಾದ ವಿತರಣಾ ಸ್ಥಿತಿ.'
                : 'Status of prasada delivery for registered Kathe / Vrata Sankalpa devotees.'}
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchData}
            className="self-start md:self-auto px-3 py-1.5 border border-warm-dark hover:bg-warm rounded-lg text-charcoal-light hover:text-charcoal inline-flex items-center gap-1.5 text-xs font-bold uppercase transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>{language === 'kn' ? 'ನವೀಕರಿಸಿ' : 'Refresh'}</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl border border-warm-dark p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-charcoal-light" />
              <input
                type="text"
                placeholder={language === 'kn' ? 'ಹೆಸರು, ಪುಸ್ತಕ ಸಂಖ್ಯೆ, ಪ್ರದೇಶ ಹುಡುಕಿ...' : 'Search by devotee name, book no, area...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-warm/60 border border-warm-dark rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-charcoal outline-none focus:border-accent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-charcoal-light hover:text-charcoal"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Area Filter Dropdown */}
            {uniquePlaces.length > 0 && (
              <select
                value={placeFilter}
                onChange={(e) => setPlaceFilter(e.target.value)}
                className="bg-warm/60 border border-warm-dark px-3 py-2 rounded-xl text-xs font-bold text-charcoal outline-none"
              >
                <option value="all">{language === 'kn' ? 'ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು (ALL AREAS)' : 'ALL AREAS'}</option>
                {uniquePlaces.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { key: 'all', label: language === 'kn' ? 'ಎಲ್ಲಾ' : 'All' },
              { key: 'PENDING', label: language === 'kn' ? 'ಬಾಕಿ' : 'Pending' },
              { key: 'ASSIGNED', label: language === 'kn' ? 'ನಿಯೋಜಿತ' : 'Assigned' },
              { key: 'OUT_FOR_DELIVERY', label: language === 'kn' ? 'ಹೊರಟಿದೆ' : 'Out for Delivery' },
              { key: 'DELIVERED', label: language === 'kn' ? 'ತಲುಪಿದೆ' : 'Delivered' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-warm hover:bg-warm-dark/50 text-charcoal border border-warm-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-charcoal-light px-1">
            <span>
              {language === 'kn' ? 'ಒಟ್ಟು ತೋರಿಸಲಾಗುತ್ತಿದೆ: ' : 'Showing: '}
              <b>{filteredDeliveries.length}</b> {language === 'kn' ? 'ಭಕ್ತಾದಿಗಳು' : 'devotees'}
            </span>
            {(search || statusFilter !== 'all' || placeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPlaceFilter('all');
                }}
                className="text-primary font-bold hover:underline"
              >
                {language === 'kn' ? 'ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ' : 'Clear filters'}
              </button>
            )}
          </div>
        </div>

        {/* Devotees List Display */}
        {loading ? (
          <div className="py-16 text-center text-charcoal-light font-medium flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span>{language === 'kn' ? 'ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...' : 'Loading delivery data...'}</span>
          </div>
        ) : filteredDeliveries.length > 0 ? (
          <>
            {/* MOBILE VIEW: Touch-Friendly Card Grid (shown on small screens) */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredDeliveries.map((del) => {
                const p = del.participant;
                const devoteeName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || del.homeName || (language === 'kn' ? 'ಭಕ್ತಾದಿಗಳು' : 'Devotee');
                const areaName = language === 'kn' && del.place?.nameKannada
                  ? del.place.nameKannada
                  : (del.place?.name || del.participant?.place?.name || '-');
                const bookNo = p?.bookNo || p?.notes;

                return (
                  <div
                    key={del._id}
                    className="bg-white rounded-2xl border border-warm-dark p-4 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-charcoal text-base tracking-tight">
                          {devoteeName}
                        </h3>
                        {del.homeName && del.homeName !== devoteeName && (
                          <p className="text-xs text-charcoal-light font-medium">
                            {language === 'kn' ? `ಮನೆ / ಕುಟುಂಬ: ${del.homeName}` : `Home: ${del.homeName}`}
                          </p>
                        )}
                      </div>

                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-sm ${getStatusStyle(del.status)}`}>
                        {getStatusLabel(del.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal-light pt-1 border-t border-warm-dark">
                      <span className="flex items-center gap-1 font-medium text-charcoal">
                        <MapPin className="h-3.5 w-3.5 text-accent-dark flex-shrink-0" />
                        <span>{areaName}</span>
                      </span>

                      {bookNo && (
                        <span className="flex items-center gap-1 bg-warm px-2 py-0.5 rounded font-bold text-primary border border-warm-dark">
                          <BookOpen className="h-3 w-3" />
                          <span>Book #{bookNo}</span>
                        </span>
                      )}

                      {del.assignedVolunteer && (
                        <span className="flex items-center gap-1 text-charcoal-light">
                          <Truck className="h-3 w-3 text-secondary" />
                          <span>{del.assignedVolunteer.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Clean Table (hidden on mobile, visible on sm and up) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-warm-dark overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm/60 border-b border-warm-dark text-xs font-extrabold text-charcoal-light uppercase tracking-wider">
                    <th className="p-4">{language === 'kn' ? 'ಭಕ್ತಾದಿಯ ಹೆಸರು' : 'Devotee / Family Name'}</th>
                    <th className="p-4">{language === 'kn' ? 'ಪುಸ್ತಕ ಸಂಖ್ಯೆ' : 'Book No'}</th>
                    <th className="p-4">{language === 'kn' ? 'ಪ್ರದೇಶ / ಸ್ಥಳ' : 'Place / Area'}</th>
                    <th className="p-4">{language === 'kn' ? 'ಸ್ವಯಂಸೇವಕರು' : 'Assigned Volunteer'}</th>
                    <th className="p-4 text-center">{language === 'kn' ? 'ಸ್ಥಿತಿ' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-dark text-sm">
                  {filteredDeliveries.map((del) => {
                    const p = del.participant;
                    const devoteeName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || del.homeName || (language === 'kn' ? 'ಭಕ್ತಾದಿಗಳು' : 'Devotee');
                    const areaName = language === 'kn' && del.place?.nameKannada
                      ? del.place.nameKannada
                      : (del.place?.name || del.participant?.place?.name || '-');
                    const bookNo = p?.bookNo || p?.notes || '-';

                    return (
                      <tr key={del._id} className="hover:bg-warm/40 transition">
                        <td className="p-4 font-bold text-charcoal">
                          <div className="font-extrabold">{devoteeName}</div>
                          {del.homeName && del.homeName !== devoteeName && (
                            <div className="text-xs text-charcoal-light font-normal">
                              {del.homeName}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-primary">
                          {bookNo !== '-' ? (
                            <span className="inline-flex items-center gap-1 bg-warm px-2 py-0.5 rounded border border-warm-dark text-xs">
                              <BookOpen className="h-3 w-3" />
                              <span>#{bookNo}</span>
                            </span>
                          ) : (
                            <span className="text-charcoal-light font-normal">-</span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-charcoal">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-accent-dark flex-shrink-0" />
                            <span>{areaName}</span>
                          </span>
                        </td>
                        <td className="p-4 text-charcoal-light text-xs font-medium">
                          {del.assignedVolunteer ? (
                            <span className="flex items-center gap-1 text-charcoal font-semibold">
                              <Truck className="h-3.5 w-3.5 text-secondary" />
                              <span>{del.assignedVolunteer.name}</span>
                            </span>
                          ) : (
                            <span className="text-charcoal-light/70">{language === 'kn' ? 'ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ' : 'Not Assigned'}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusStyle(del.status)}`}>
                            {getStatusLabel(del.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-warm-dark p-12 text-center text-charcoal-light space-y-2">
            <p className="font-bold text-base text-charcoal">
              {language === 'kn' ? 'ಯಾವುದೇ ವಿವರಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No deliveries found matching filters.'}
            </p>
            <p className="text-xs">
              {language === 'kn'
                ? 'ದಯವಿಟ್ಟು ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ ಅಥವಾ ಮರುಪರಿಶೀಲಿಸಿ.'
                : 'Try adjusting your search criteria or resetting filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

