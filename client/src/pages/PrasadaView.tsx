import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Search,
  BookOpen,
  RefreshCw,
  XCircle,
  Sparkles,
  UserCheck,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Phone,
  Check,
  X
} from 'lucide-react';
import { naturalCompareBookNo } from '../utils/pdfExport';

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
  const [sortBy, setSortBy] = useState<'book' | 'place' | 'name' | 'status'>('book');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);

  // Area Breakdown Clickable States
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [areaDetailTab, setAreaDetailTab] = useState<'ALL' | 'DELIVERED' | 'NOT_DELIVERED'>('ALL');
  const [areaSearch, setAreaSearch] = useState('');

  const handleToggleArea = (
    placeId: string,
    tab: 'ALL' | 'DELIVERED' | 'NOT_DELIVERED' = 'ALL',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    if (selectedAreaId === placeId && areaDetailTab === tab) {
      setSelectedAreaId(null);
    } else {
      setSelectedAreaId(placeId);
      setAreaDetailTab(tab);
      setAreaSearch('');
    }
  };

  const getDeliveriesForArea = (area: AreaBreakdown): Delivery[] => {
    return deliveries.filter((del) => {
      const pId1 = del.place?._id;
      const pId2 = del.participant?.place?._id;
      const targetId = area.placeId;
      if (targetId) {
        if (pId1 && String(pId1) === String(targetId)) return true;
        if (pId2 && String(pId2) === String(targetId)) return true;
      }

      const pName1 = del.place?.name;
      const pName2 = del.participant?.place?.name;
      const targetName = area.name;
      if (targetName) {
        if (pName1 && pName1.toLowerCase().trim() === targetName.toLowerCase().trim()) return true;
        if (pName2 && pName2.toLowerCase().trim() === targetName.toLowerCase().trim()) return true;
      }

      const pKn1 = del.place?.nameKannada;
      const pKn2 = del.participant?.place?.nameKannada;
      const targetKn = area.nameKannada;
      if (targetKn) {
        if (pKn1 && pKn1.trim() === targetKn.trim()) return true;
        if (pKn2 && pKn2.trim() === targetKn.trim()) return true;
      }

      return false;
    });
  };

  const getFilteredAreaDeliveries = (area: AreaBreakdown): Delivery[] => {
    const list = getDeliveriesForArea(area);
    return list.filter((del) => {
      if (areaDetailTab === 'DELIVERED' && del.status !== 'DELIVERED') return false;
      if (areaDetailTab === 'NOT_DELIVERED' && del.status === 'DELIVERED') return false;

      if (areaSearch.trim()) {
        const q = areaSearch.toLowerCase().trim();
        const p = del.participant;
        const name = `${p?.firstName || ''} ${p?.lastName || ''}`.toLowerCase();
        const home = (del.homeName || p?.homeName || '').toLowerCase();
        const book = (p?.bookNo || p?.notes || '').toLowerCase();
        const phone = (p?.phone || '').toLowerCase();
        return name.includes(q) || home.includes(q) || book.includes(q) || phone.includes(q);
      }

      return true;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
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

  // Filtered and sorted deliveries
  const filteredDeliveries = useMemo(() => {
    const list = deliveries.filter(del => {
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
      if (placeFilter !== 'all') {
        const matchPlace =
          del.place?._id === placeFilter ||
          del.place?.name === placeFilter ||
          del.participant?.place?._id === placeFilter ||
          del.participant?.place?.name === placeFilter;
        if (!matchPlace) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'book') {
        const bookA = (a.participant?.bookNo || a.participant?.notes || '').trim();
        const bookB = (b.participant?.bookNo || b.participant?.notes || '').trim();
        cmp = naturalCompareBookNo(bookA, bookB);
      } else if (sortBy === 'place') {
        const placeA = (language === 'kn' && a.place?.nameKannada ? a.place.nameKannada : a.place?.name) || '';
        const placeB = (language === 'kn' && b.place?.nameKannada ? b.place.nameKannada : b.place?.name) || '';
        cmp = placeA.localeCompare(placeB, language === 'kn' ? 'kn' : undefined);
      } else if (sortBy === 'name') {
        const nameA = `${a.participant?.firstName || ''} ${a.participant?.lastName || ''}`.trim() || a.homeName || '';
        const nameB = `${b.participant?.firstName || ''} ${b.participant?.lastName || ''}`.trim() || b.homeName || '';
        cmp = nameA.localeCompare(nameB);
      } else if (sortBy === 'status') {
        const statusRank: Record<string, number> = {
          'PENDING': 1,
          'ASSIGNED': 2,
          'OUT_FOR_DELIVERY': 3,
          'DELIVERED': 4,
          'UNABLE_TO_DELIVER': 5
        };
        const rankA = statusRank[a.status] || 99;
        const rankB = statusRank[b.status] || 99;
        cmp = rankA - rankB;
      }

      // Tie breaker
      if (cmp === 0 && sortBy !== 'book') {
        const bookA = (a.participant?.bookNo || a.participant?.notes || '').trim();
        const bookB = (b.participant?.bookNo || b.participant?.notes || '').trim();
        cmp = naturalCompareBookNo(bookA, bookB);
      }
      if (cmp === 0) {
        const nameA = `${a.participant?.firstName || ''} ${a.participant?.lastName || ''}`.trim() || a.homeName || '';
        const nameB = `${b.participant?.firstName || ''} ${b.participant?.lastName || ''}`.trim() || b.homeName || '';
        cmp = nameA.localeCompare(nameB);
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [deliveries, search, statusFilter, placeFilter, sortBy, sortOrder, language]);

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-dark pb-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-primary flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{language === 'kn' ? 'ಪ್ರದೇಶವಾರು ವಿತರಣಾ ವಿವರ (Area Breakdown)' : 'Area Breakdown Progress'}</span>
              </h2>
              <p className="text-xs text-charcoal-light mt-0.5">
                {language === 'kn'
                  ? 'ಪ್ರದೇಶದ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ತಲುಪಿದ ಮತ್ತು ಬಾಕಿ ಇರುವ ಭಕ್ತಾದಿಗಳ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.'
                  : 'Click on any area card to see delivered and pending devotee details.'}
              </p>
            </div>
            {selectedAreaId && (
              <button
                type="button"
                onClick={() => setSelectedAreaId(null)}
                className="self-start sm:self-auto text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>{language === 'kn' ? 'ಎಲ್ಲವನ್ನೂ ಮುಚ್ಚಿ' : 'Close Active View'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {areaBreakdown.map((area) => {
              const areaKey = area.placeId || area.name;
              const isSelected = selectedAreaId === areaKey;
              const areaDeliveries = getDeliveriesForArea(area);
              const deliveredList = areaDeliveries.filter((d) => d.status === 'DELIVERED');
              const notDeliveredList = areaDeliveries.filter((d) => d.status !== 'DELIVERED');
              const actualDeliveredCount = areaDeliveries.length > 0 ? deliveredList.length : area.delivered;
              const actualNotDeliveredCount = areaDeliveries.length > 0 ? notDeliveredList.length : area.pending;
              const actualTotalCount = areaDeliveries.length > 0 ? areaDeliveries.length : area.total;
              const areaProgress = actualTotalCount > 0 ? Math.round((actualDeliveredCount / actualTotalCount) * 100) : 0;
              const filteredList = isSelected ? getFilteredAreaDeliveries(area) : [];

              return (
                <div
                  key={areaKey}
                  className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm ${
                    isSelected
                      ? 'sm:col-span-2 md:col-span-3 border-primary/60 ring-2 ring-primary/20 shadow-md'
                      : 'border-warm-dark hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={(e) => handleToggleArea(areaKey, 'ALL', e)}
                    className="p-4 cursor-pointer select-none flex items-center justify-between gap-3 border-b border-warm/80"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-warm text-primary'}`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-charcoal text-base truncate">
                          {language === 'kn' ? area.nameKannada || area.name : area.name}
                        </h3>
                        {area.nameKannada && area.name && area.nameKannada !== area.name && (
                          <span className="text-[11px] text-charcoal-light block truncate">
                            {language === 'kn' ? area.name : area.nameKannada}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {areaProgress}%
                      </span>
                      <button
                        type="button"
                        aria-label="Toggle area details"
                        className={`p-1.5 rounded-lg text-charcoal-light hover:text-charcoal hover:bg-warm transition ${
                          isSelected ? 'bg-warm text-primary rotate-180' : ''
                        }`}
                      >
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Metric Summary Boxes */}
                  <div className="p-4 pt-3 space-y-3">
                    <div className="grid grid-cols-3 text-center gap-2">
                      {/* Total */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleArea(areaKey, 'ALL', e)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected && areaDetailTab === 'ALL'
                            ? 'bg-warm-dark/40 border-charcoal/30 ring-1 ring-charcoal/20'
                            : 'bg-warm hover:bg-warm-dark/30 border-warm-dark cursor-pointer'
                        }`}
                        title={language === 'kn' ? 'ಎಲ್ಲಾ ಭಕ್ತಾದಿಗಳನ್ನು ನೋಡಿ' : 'View all devotees'}
                      >
                        <span className="text-[10px] text-charcoal-light uppercase font-bold block">
                          {language === 'kn' ? 'ಒಟ್ಟು' : 'Total'}
                        </span>
                        <span className="font-extrabold text-charcoal text-base sm:text-lg block mt-0.5">
                          {actualTotalCount}
                        </span>
                      </button>

                      {/* Delivered */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleArea(areaKey, 'DELIVERED', e)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected && areaDetailTab === 'DELIVERED'
                            ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300'
                            : 'bg-emerald-50/80 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800'
                        }`}
                        title={language === 'kn' ? 'ತಲುಪಿದ ಭಕ್ತಾದಿಗಳನ್ನು ನೋಡಿ' : 'View delivered devotees'}
                      >
                        <span className="text-[10px] text-emerald-700 uppercase font-bold flex items-center justify-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>{language === 'kn' ? 'ತಲುಪಿದೆ' : 'Done'}</span>
                        </span>
                        <span className="font-extrabold text-emerald-800 text-base sm:text-lg block mt-0.5">
                          {actualDeliveredCount}
                        </span>
                      </button>

                      {/* Not Delivered / Pending */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleArea(areaKey, 'NOT_DELIVERED', e)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected && areaDetailTab === 'NOT_DELIVERED'
                            ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                            : 'bg-amber-50/80 hover:bg-amber-100/70 border-amber-200 text-amber-800'
                        }`}
                        title={language === 'kn' ? 'ಬಾಕಿ / ತಲುಪಿಸದ ಭಕ್ತಾದಿಗಳನ್ನು ನೋಡಿ' : 'View pending / not delivered devotees'}
                      >
                        <span className="text-[10px] text-amber-700 uppercase font-bold flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{language === 'kn' ? 'ಬಾಕಿ' : 'Left'}</span>
                        </span>
                        <span className="font-extrabold text-amber-800 text-base sm:text-lg block mt-0.5">
                          {actualNotDeliveredCount}
                        </span>
                      </button>
                    </div>

                    {/* Progress Bar inside Card */}
                    <div className="space-y-1">
                      <div className="w-full bg-warm rounded-full h-2 overflow-hidden border border-warm-dark/50">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${areaProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-charcoal-light font-semibold">
                        <span>{language === 'kn' ? `${actualDeliveredCount} ತಲುಪಿದೆ` : `${actualDeliveredCount} Delivered`}</span>
                        <span>{language === 'kn' ? `${actualNotDeliveredCount} ಬಾಕಿ` : `${actualNotDeliveredCount} Pending`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isSelected && (
                    <div className="border-t border-warm-dark p-4 sm:p-5 bg-warm/30 space-y-4 rounded-b-2xl">
                      {/* Area Status Highlights Banner */}
                      <div className="bg-white rounded-xl border border-warm-dark p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <h4 className="font-extrabold text-charcoal text-sm sm:text-base">
                            {language === 'kn' ? area.nameKannada || area.name : area.name} —{' '}
                            <span className="text-primary">
                              {language === 'kn' ? 'ವಿತರಣಾ ವಿವರ ಮತ್ತು ಭಕ್ತಾದಿಗಳ ಪಟ್ಟಿ' : 'Delivery Details & Devotee Roster'}
                            </span>
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {language === 'kn' ? `ತಲುಪಿದೆ: ${actualDeliveredCount}` : `Delivered: ${actualDeliveredCount}`}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            {language === 'kn' ? `ಬಾಕಿ: ${actualNotDeliveredCount}` : `Not Delivered: ${actualNotDeliveredCount}`}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {language === 'kn' ? `ಒಟ್ಟು: ${actualTotalCount}` : `Total: ${actualTotalCount}`}
                          </span>
                        </div>
                      </div>

                      {/* Filter Tabs & In-Area Search */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Status Filter Tabs */}
                        <div className="inline-flex rounded-xl bg-warm p-1 border border-warm-dark self-start">
                          <button
                            type="button"
                            onClick={() => setAreaDetailTab('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                              areaDetailTab === 'ALL'
                                ? 'bg-white text-primary shadow-xs border border-warm-dark'
                                : 'text-charcoal-light hover:text-charcoal'
                            }`}
                          >
                            {language === 'kn' ? `ಎಲ್ಲಾ (${actualTotalCount})` : `All (${actualTotalCount})`}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAreaDetailTab('DELIVERED')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                              areaDetailTab === 'DELIVERED'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            <span>{language === 'kn' ? `ತಲುಪಿದೆ (${actualDeliveredCount})` : `Delivered (${actualDeliveredCount})`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAreaDetailTab('NOT_DELIVERED')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                              areaDetailTab === 'NOT_DELIVERED'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>{language === 'kn' ? `ತಲುಪಿಸಿಲ್ಲ / ಬಾಕಿ (${actualNotDeliveredCount})` : `Not Delivered (${actualNotDeliveredCount})`}</span>
                          </button>
                        </div>

                        {/* Search Input within this Area */}
                        <div className="relative flex-1 max-w-xs">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-light" />
                          <input
                            type="text"
                            placeholder={language === 'kn' ? 'ಹೆಸರು, ಮನೆತನ, ಪುಸ್ತಕ ಸಂ...' : 'Search devotee, book no...'}
                            value={areaSearch}
                            onChange={(e) => setAreaSearch(e.target.value)}
                            className="w-full bg-white border border-warm-dark rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-charcoal outline-none focus:border-primary shadow-xs"
                          />
                          {areaSearch && (
                            <button
                              type="button"
                              onClick={() => setAreaSearch('')}
                              className="absolute right-2.5 top-2 text-xs text-charcoal-light hover:text-charcoal"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Devotees List */}
                      <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-xs">
                        {filteredList.length === 0 ? (
                          <div className="p-8 text-center space-y-2">
                            <AlertCircle className="h-7 w-7 text-charcoal-light mx-auto opacity-50" />
                            <p className="text-xs sm:text-sm font-bold text-charcoal">
                              {language === 'kn'
                                ? areaDetailTab === 'NOT_DELIVERED'
                                  ? 'ಈ ಪ್ರದೇಶದಲ್ಲಿ ಯಾವುದೇ ಪ್ರಸಾದ ವಿತರಣೆ ಬಾಕಿ ಉಳಿದಿಲ್ಲ! (ಎಲ್ಲವೂ ತಲುಪಿದೆ 🎉)'
                                  : areaDetailTab === 'DELIVERED'
                                  ? 'ಈ ಪ್ರದೇಶದಲ್ಲಿ ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಸಾದ ತಲುಪಿಸಲಾಗಿಲ್ಲ.'
                                  : 'ಯಾವುದೇ ಭಕ್ತಾದಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'
                                : areaDetailTab === 'NOT_DELIVERED'
                                ? 'All deliveries completed for this area! 🎉'
                                : 'No devotees found matching criteria.'}
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto divide-y divide-warm-dark/60">
                            {filteredList.map((del, idx) => {
                              const p = del.participant;
                              const devoteeName =
                                `${p?.firstName || ''} ${p?.lastName || ''}`.trim() ||
                                del.homeName ||
                                p?.homeName ||
                                (language === 'kn' ? 'ಹೆಸರು ದಾಖಲಾಗಿಲ್ಲ' : 'Devotee');
                              const bookNo = (p?.bookNo || p?.notes || '').trim();
                              const homeName = del.homeName || p?.homeName;
                              const isDelivered = del.status === 'DELIVERED';

                              return (
                                <div
                                  key={del._id || idx}
                                  className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                                    isDelivered ? 'hover:bg-emerald-50/40' : 'hover:bg-amber-50/40'
                                  }`}
                                >
                                  {/* Left: Name, Book No, Home */}
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-extrabold text-charcoal text-sm">
                                        {devoteeName}
                                      </span>

                                      {bookNo && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-warm px-2 py-0.5 rounded-md border border-warm-dark">
                                          <BookOpen className="h-3 w-3" />
                                          <span>{language === 'kn' ? `ಪುಸ್ತಕ: ${bookNo}` : `Book: ${bookNo}`}</span>
                                        </span>
                                      )}

                                      {homeName && homeName !== devoteeName && (
                                        <span className="text-[11px] font-medium text-charcoal-light bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                          {homeName}
                                        </span>
                                      )}
                                    </div>

                                    {/* Contact & Volunteer */}
                                    <div className="flex items-center gap-3 text-xs text-charcoal-light flex-wrap">
                                      {p?.phone && (
                                        <a
                                          href={`tel:${p.phone}`}
                                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                                          title={language === 'kn' ? 'ಕರೆ ಮಾಡಿ' : 'Call'}
                                        >
                                          <Phone className="h-3 w-3" />
                                          <span>{p.phone}</span>
                                        </a>
                                      )}
                                      {del.assignedVolunteer?.name && (
                                        <span className="inline-flex items-center gap-1 text-[11px]">
                                          <UserCheck className="h-3 w-3 text-primary" />
                                          <span>{del.assignedVolunteer.name}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right: Status Badge & Delivery Time */}
                                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                                        isDelivered
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                          : 'bg-amber-100 text-amber-800 border-amber-300'
                                      }`}
                                    >
                                      {isDelivered ? (
                                        <>
                                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                                          <span>{language === 'kn' ? 'ತಲುಪಿಸಲಾಗಿದೆ' : 'Delivered'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="h-3.5 w-3.5 text-amber-700" />
                                          <span>{language === 'kn' ? 'ವಿತರಣೆ ಬಾಕಿ' : 'Pending'}</span>
                                        </>
                                      )}
                                    </span>

                                    {isDelivered && del.deliveredAt && (
                                      <span className="text-[10px] text-charcoal-light font-medium">
                                        {new Date(del.deliveredAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPlaceFilter(area.placeId || area.name);
                            if (areaDetailTab === 'DELIVERED') setStatusFilter('DELIVERED');
                            else if (areaDetailTab === 'NOT_DELIVERED') setStatusFilter('PENDING');
                            const el = document.getElementById('devotee-directory');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-primary/40 bg-white hover:bg-primary/5 text-primary text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>
                            {language === 'kn'
                              ? `ಮುಖ್ಯ ಪಟ್ಟಿಯಲ್ಲಿ ಈ ಪ್ರದೇಶವನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ (${area.nameKannada || area.name})`
                              : `Filter this area in Main Directory (${area.name})`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAreaId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-warm-dark bg-white hover:bg-warm text-charcoal text-xs font-bold inline-flex items-center gap-1.5 transition ml-auto cursor-pointer"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                          <span>{language === 'kn' ? 'ವಿವರಗಳನ್ನು ಮರೆಮಾಡಿ' : 'Close Details'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Devotees Delivery Directory */}
      <div id="devotee-directory" className="space-y-4">
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
            type="button"
            onClick={() => fetchData(true)}
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
                  type="button"
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
                type="button"
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

          {/* Sorting Controls & Stats Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-warm-dark/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-charcoal-light flex items-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                <span>{language === 'kn' ? 'ವಿಂಗಡಣೆ:' : 'Sort By:'}</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-warm/60 border border-warm-dark rounded-xl px-2.5 py-1.5 font-bold text-charcoal outline-none focus:border-accent"
              >
                <option value="book">{language === 'kn' ? 'ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book No)' : 'Book No'}</option>
                <option value="place">{language === 'kn' ? 'ಪ್ರದೇಶ / ಸ್ಥಳ (Area)' : 'Place / Area'}</option>
                <option value="name">{language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು (Name)' : 'Devotee Name'}</option>
                <option value="status">{language === 'kn' ? 'ವಿತರಣಾ ಸ್ಥಿತಿ (Status)' : 'Status'}</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-1.5 bg-warm hover:bg-warm-dark/60 rounded-xl border border-warm-dark font-bold text-charcoal transition"
                title="Toggle Ascending / Descending"
              >
                {sortOrder === 'asc' ? '▲ Asc (1-9, A-Z)' : '▼ Desc (9-1, Z-A)'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span>
                {language === 'kn' ? 'ಒಟ್ಟು ತೋರಿಸಲಾಗುತ್ತಿದೆ: ' : 'Showing: '}
                <b>{filteredDeliveries.length}</b> {language === 'kn' ? 'ಭಕ್ತಾದಿಗಳು' : 'devotees'}
              </span>
              {(search || statusFilter !== 'all' || placeFilter !== 'all') && (
                <button
                  type="button"
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

