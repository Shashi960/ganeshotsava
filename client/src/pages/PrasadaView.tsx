import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Truck, CheckCircle2, AlertCircle, Clock, MapPin, Search } from 'lucide-react';

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

interface Delivery {
  _id: string;
  homeName?: string;
  address?: string;
  place: { name: string; nameKannada: string };
  assignedVolunteer?: { name: string };
  status: string;
}

export const PrasadaView: React.FC = () => {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [areaBreakdown, setAreaBreakdown] = useState<AreaBreakdown[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Stats fetch
    api.get('/prasada/stats').then(res => {
      if (res.data.status === 'success') {
        setStats(res.data.stats);
        setAreaBreakdown(res.data.areaBreakdown);
      }
    }).catch(err => console.error(err));

    // Deliveries list fetch
    let url = `/prasada?search=${search}`;
    if (statusFilter !== 'all') {
      url += `&status=${statusFilter}`;
    }
    api.get(url).then(res => {
      if (res.data.status === 'success') {
        setDeliveries(res.data.deliveries);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [search, statusFilter]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UNABLE_TO_DELIVER':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'PENDING':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navPrasada')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          Track area-wise Prasada delivery progress of Ganeshotsava.
        </p>
      </div>

      {/* Stats Cards Section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-warm-dark p-5 shadow-sm space-y-1">
            <span className="text-xs text-charcoal-light font-semibold block uppercase">Total Houses</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal block">{stats.total}</span>
          </div>
          <div className="bg-white rounded-xl border border-warm-dark p-5 shadow-sm space-y-1">
            <span className="text-xs text-charcoal-light font-semibold block uppercase">Delivered</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-green-700 block flex items-center gap-1.5">
              <CheckCircle2 className="h-6 w-6" /> {stats.delivered}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-warm-dark p-5 shadow-sm space-y-1">
            <span className="text-xs text-charcoal-light font-semibold block uppercase">Pending</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-500 block flex items-center gap-1.5">
              <Clock className="h-6 w-6" /> {stats.pending}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-warm-dark p-5 shadow-sm space-y-2">
            <span className="text-xs text-charcoal-light font-semibold block uppercase">Progress</span>
            <div className="w-full bg-warm-dark rounded-full h-3 overflow-hidden">
              <div className="bg-green-600 h-full transition-all duration-500" style={{ width: `${stats.progress}%` }}></div>
            </div>
            <span className="text-xs text-green-700 font-bold block">{stats.progress}% Completed</span>
          </div>
        </div>
      )}

      {/* Area Breakdown Section */}
      {areaBreakdown.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary border-b border-accent/20 pb-2">
            Area Breakdown Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {areaBreakdown.map((area) => {
              const areaProgress = area.total > 0 ? Math.round((area.delivered / area.total) * 100) : 0;
              return (
                <div key={area.placeId} className="bg-white rounded-xl border border-warm-dark p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-warm-dark pb-2">
                    <h3 className="font-bold text-charcoal text-base">
                      {language === 'kn' ? area.nameKannada : area.name}
                    </h3>
                    <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      {areaProgress}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 text-center gap-2">
                    <div className="p-2 bg-warm rounded border border-warm-dark">
                      <span className="text-[9px] text-charcoal-light uppercase font-bold block">Total</span>
                      <span className="font-bold text-charcoal block">{area.total}</span>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200 text-green-800">
                      <span className="text-[9px] text-green-600 uppercase font-bold block">Done</span>
                      <span className="font-bold block">{area.delivered}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Left</span>
                      <span className="font-bold block">{area.pending}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deliveries Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-accent/20 pb-2">
          <h2 className="text-xl font-bold text-primary">
            Family Delivery Status List
          </h2>
          
          <div className="flex gap-2">
            {['all', 'PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  statusFilter === st
                    ? 'bg-primary text-warm border border-primary'
                    : 'bg-warm-dark hover:bg-warm-dark/80 text-charcoal border border-transparent'
                }`}
              >
                {st === 'all' ? 'All' : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-charcoal-light">Loading deliveries...</div>
        ) : deliveries.length > 0 ? (
          <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                    <th className="p-4">Family / Home Name</th>
                    <th className="p-4">Place / Area</th>
                    <th className="p-4">Assigned Volunteer</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-dark text-sm">
                  {deliveries.map((del) => (
                    <tr key={del._id} className="hover:bg-warm-dark/10 transition">
                      <td className="p-4 font-bold text-charcoal">
                        {del.homeName || 'Unspecified Home'}
                      </td>
                      <td className="p-4 font-semibold text-charcoal-light">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-accent-dark" />
                          <span>{language === 'kn' ? del.place.nameKannada : del.place.name}</span>
                        </span>
                      </td>
                      <td className="p-4 text-charcoal-light">
                        <span className="flex items-center gap-1">
                          <Truck className="h-4 w-4 text-secondary" />
                          <span>{del.assignedVolunteer ? del.assignedVolunteer.name : 'Not Assigned'}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusStyle(del.status)}`}>
                          {del.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-warm-dark p-8 text-center text-charcoal-light font-semibold">
            No deliveries found matching filters.
          </div>
        )}
      </div>
    </div>
  );
};
