import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  CheckCircle2,
  Truck,
  AlertCircle,
  RefreshCw,
  Filter,
  ShieldAlert,
  Lock,
  Unlock,
  Phone,
  BookOpen,
  Search,
  UserCheck,
  Clock,
  XCircle,
  MapPin
} from 'lucide-react';

interface Volunteer {
  _id: string;
  name: string;
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
  assignedVolunteer?: { _id: string; name: string };
  status: 'PENDING' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'UNABLE_TO_DELIVER';
  deliveredAt?: string;
  assignedAt?: string;
}

export const AdminPrasada: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [togglingDelivery, setTogglingDelivery] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [volunteerFilter, setVolunteerFilter] = useState('all');
  const [placeFilter, setPlaceFilter] = useState('all');

  useEffect(() => {
    fetchDeliveries();
    api.get('/volunteers?active=true').then(res => {
      if (res.data.status === 'success') setVolunteers(res.data.volunteers || []);
    }).catch(err => console.error(err));
  }, []);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/prasada');
      if (res.data.status === 'success') {
        setDeliveries(res.data.deliveries || []);
        setIsDeliveryOpen(!!res.data.isDeliveryOpen);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch prasada deliveries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeliveryOpen = async () => {
    if (!isSuperAdmin) {
      showToast('Only Super Administrator can open or close prasada delivery.', 'error');
      return;
    }
    const nextState = !isDeliveryOpen;
    setTogglingDelivery(true);
    try {
      const res = await api.put('/settings/edit', { prasadaDeliveryOpen: nextState });
      if (res.data.status === 'success') {
        setIsDeliveryOpen(nextState);
        showToast(
          nextState
            ? 'Prasada Delivery is now OPEN! Admins can now update delivery status.'
            : 'Prasada Delivery is now CLOSED. Status updates are locked.',
          'success'
        );
        fetchDeliveries();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update delivery status setting.', 'error');
    } finally {
      setTogglingDelivery(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!isDeliveryOpen && !isSuperAdmin) {
      showToast('Prasada delivery is closed by Superadmin. Status updates are disabled.', 'error');
      return;
    }
    try {
      const res = await api.put(`/prasada/${id}/status`, { status: newStatus });
      if (res.data.status === 'success') {
        showToast(`Delivery status updated to ${newStatus.replace(/_/g, ' ')}!`);
        // Instant local update
        setDeliveries(prev => prev.map(d => d._id === id ? { ...d, status: newStatus as any } : d));
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to update delivery status.';
      showToast(msg, 'error');
    }
  };

  const handleAssignVolunteer = async (id: string, volunteerId: string) => {
    try {
      const res = await api.put(`/prasada/${id}/status`, { assignedVolunteer: volunteerId || null });
      if (res.data.status === 'success') {
        showToast('Volunteer assigned successfully!');
        const assignedVol = volunteers.find(v => v._id === volunteerId);
        setDeliveries(prev => prev.map(d => d._id === id ? {
          ...d,
          assignedVolunteer: assignedVol ? { _id: assignedVol._id, name: assignedVol.name } : undefined,
          status: volunteerId && d.status === 'PENDING' ? 'ASSIGNED' : d.status
        } : d));
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to assign volunteer.', 'error');
    }
  };

  const uniquePlaces = useMemo(() => {
    const map = new Map<string, string>();
    deliveries.forEach(d => {
      if (d.place && d.place.name) {
        const label = d.place.nameKannada ? `${d.place.name} (${d.place.nameKannada})` : d.place.name;
        map.set(d.place._id || d.place.name, label);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [deliveries]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(del => {
      const p = del.participant;
      const devoteeName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || del.homeName || '';
      const book = p?.bookNo || p?.notes || '';
      const phone = p?.phone || '';
      const area = `${del.place?.name || ''} ${del.place?.nameKannada || ''}`;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = devoteeName.toLowerCase().includes(q) ||
          book.toLowerCase().includes(q) ||
          phone.toLowerCase().includes(q) ||
          area.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && del.status !== statusFilter) return false;
      if (volunteerFilter !== 'all' && del.assignedVolunteer?._id !== volunteerFilter) return false;
      if (placeFilter !== 'all' && (del.place?._id !== placeFilter && del.place?.name !== placeFilter)) return false;
      return true;
    });
  }, [deliveries, searchQuery, statusFilter, volunteerFilter, placeFilter]);

  const counts = useMemo(() => {
    return {
      total: deliveries.length,
      delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
      outForDelivery: deliveries.filter(d => d.status === 'OUT_FOR_DELIVERY').length,
      assigned: deliveries.filter(d => d.status === 'ASSIGNED').length,
      pending: deliveries.filter(d => d.status === 'PENDING').length,
      failed: deliveries.filter(d => d.status === 'UNABLE_TO_DELIVER').length,
    };
  }, [deliveries]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Delivered (ತಲುಪಿದೆ)</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"><Truck className="h-3.5 w-3.5 text-amber-600" /> Out for Delivery (ಹೊರಟಿದೆ)</span>;
      case 'ASSIGNED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300"><UserCheck className="h-3.5 w-3.5 text-blue-600" /> Assigned (ನಿಯೋಜಿತ)</span>;
      case 'UNABLE_TO_DELIVER':
        return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300"><XCircle className="h-3.5 w-3.5 text-rose-600" /> Unable to Deliver (ವಿಫಲ)</span>;
      case 'PENDING':
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300"><Clock className="h-3.5 w-3.5 text-slate-500" /> Pending (ಬಾಕಿ)</span>;
    }
  };

  const getCardBorderColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'border-emerald-300 bg-emerald-50/30';
      case 'OUT_FOR_DELIVERY': return 'border-amber-300 bg-amber-50/40';
      case 'ASSIGNED': return 'border-blue-300 bg-blue-50/30';
      case 'UNABLE_TO_DELIVER': return 'border-rose-300 bg-rose-50/30';
      case 'PENDING':
      default:
        return 'border-warm-dark bg-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">Prasada Delivery Operations</h1>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-light mt-1">
            Track Kathe devotee prasada distribution, assign volunteers, and manage delivery status.
          </p>
        </div>
        <button
          onClick={fetchDeliveries}
          className="self-start sm:self-auto px-3 py-2 border border-warm-dark hover:bg-warm rounded-lg text-charcoal-light hover:text-charcoal inline-flex items-center gap-2 text-xs font-bold uppercase transition shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* SUPERADMIN MASTER SWITCH CARD */}
      <div className={`rounded-2xl p-5 sm:p-6 border-2 transition shadow-sm ${
        isDeliveryOpen
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-emerald-500/5 border-emerald-400'
          : 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-500/5 border-amber-400'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-sm ${
                isDeliveryOpen
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-amber-600 text-white border-amber-700'
              }`}>
                {isDeliveryOpen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {isDeliveryOpen ? 'Delivery Open (ಪ್ರಸಾದ ವಿತರಣೆ ಪ್ರಾರಂಭವಾಗಿದೆ)' : 'Delivery Closed (ಪ್ರಸಾದ ವಿತರಣೆ ಮುಕ್ತಾಯಗೊಂಡಿದೆ)'}
              </span>
              {isSuperAdmin && (
                <span className="text-[10px] font-black uppercase bg-primary text-white px-2 py-0.5 rounded border border-primary-dark">
                  Superadmin Control
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-charcoal font-medium">
              {isDeliveryOpen ? (
                <>
                  <span className="text-emerald-800 font-bold">Delivery is currently OPEN.</span> Administrators and volunteers can now mark prasada as Delivered, Out for Delivery, or Pending.
                </>
              ) : (
                <>
                  <span className="text-amber-800 font-bold">Delivery is currently CLOSED.</span> Ordinary administrators cannot change delivery statuses until the Super Administrator opens it.
                </>
              )}
            </p>
          </div>

          {/* Superadmin Toggle Action Button */}
          {isSuperAdmin ? (
            <button
              onClick={handleToggleDeliveryOpen}
              disabled={togglingDelivery}
              className={`w-full md:w-auto px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition shadow flex items-center justify-center gap-2 ${
                isDeliveryOpen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              } disabled:opacity-50`}
            >
              {isDeliveryOpen ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>{togglingDelivery ? 'Closing...' : 'Close Delivery (ಮುಕ್ತಾಯಗೊಳಿಸಿ)'}</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>{togglingDelivery ? 'Opening...' : 'Open Delivery (ಪ್ರಾರಂಭಿಸಿ)'}</span>
                </>
              )}
            </button>
          ) : !isDeliveryOpen ? (
            <div className="flex items-center gap-2 bg-amber-100/80 text-amber-900 border border-amber-300/80 px-3.5 py-2 rounded-xl text-xs font-semibold">
              <ShieldAlert className="h-4 w-4 text-amber-700 flex-shrink-0" />
              <span>Waiting for Superadmin to open delivery operations.</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm">
          <span className="text-[10px] sm:text-xs text-charcoal-light font-bold block uppercase tracking-wider">Total Registered</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-charcoal mt-1 block">{counts.total}</span>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/20">
          <span className="text-[10px] sm:text-xs text-emerald-700 font-bold block uppercase tracking-wider">Delivered</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1 block flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" /> {counts.delivered}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm bg-amber-50/20">
          <span className="text-[10px] sm:text-xs text-amber-700 font-bold block uppercase tracking-wider">Out Now</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-1 block flex items-center gap-1.5">
            <Truck className="h-5 w-5 sm:h-6 sm:w-6" /> {counts.outForDelivery}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm bg-blue-50/20">
          <span className="text-[10px] sm:text-xs text-blue-700 font-bold block uppercase tracking-wider">Assigned</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-1 block flex items-center gap-1.5">
            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" /> {counts.assigned}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm bg-slate-50/20">
          <span className="text-[10px] sm:text-xs text-slate-600 font-bold block uppercase tracking-wider">Pending</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-700 mt-1 block flex items-center gap-1.5">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6" /> {counts.pending}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-charcoal-light" />
            <input
              type="text"
              placeholder="Search by devotee name, book number, area, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-warm/60 border border-warm-dark rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-charcoal outline-none focus:border-accent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-charcoal-light hover:text-charcoal"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-warm/60 border border-warm-dark px-3 py-2 rounded-xl text-xs font-bold text-charcoal outline-none"
            >
              <option value="all">ALL STATUSES</option>
              <option value="PENDING">PENDING (ಬಾಕಿ)</option>
              <option value="ASSIGNED">ASSIGNED (ನಿಯೋಜಿತ)</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (ಹೊರಟಿದೆ)</option>
              <option value="DELIVERED">DELIVERED (ತಲುಪಿದೆ)</option>
              <option value="UNABLE_TO_DELIVER">UNABLE TO DELIVER (ವಿಫಲ)</option>
            </select>

            <select
              value={placeFilter}
              onChange={(e) => setPlaceFilter(e.target.value)}
              className="bg-warm/60 border border-warm-dark px-3 py-2 rounded-xl text-xs font-bold text-charcoal outline-none"
            >
              <option value="all">ALL AREAS</option>
              {uniquePlaces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={volunteerFilter}
              onChange={(e) => setVolunteerFilter(e.target.value)}
              className="col-span-2 sm:col-span-1 bg-warm/60 border border-warm-dark px-3 py-2 rounded-xl text-xs font-bold text-charcoal outline-none"
            >
              <option value="all">ALL VOLUNTEERS</option>
              {volunteers.map(v => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-charcoal-light px-1">
          <span>Showing <b>{filteredDeliveries.length}</b> of <b>{deliveries.length}</b> registered devotees</span>
          {(searchQuery || statusFilter !== 'all' || placeFilter !== 'all' || volunteerFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPlaceFilter('all');
                setVolunteerFilter('all');
              }}
              className="text-primary font-bold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Deliveries Card List */}
      {loading ? (
        <div className="py-16 text-center text-charcoal-light font-medium flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Loading delivery records...</span>
        </div>
      ) : filteredDeliveries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredDeliveries.map(del => {
            const p = del.participant;
            const devoteeName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || del.homeName || 'Anonymous Devotee';
            const areaName = del.place?.nameKannada
              ? `${del.place.name} (${del.place.nameKannada})`
              : (del.place?.name || del.participant?.place?.name || 'Unassigned Area');
            const bookNo = p?.bookNo || p?.notes;
            const phone = p?.phone;

            const canUpdateStatus = isDeliveryOpen || isSuperAdmin;

            return (
              <div
                key={del._id}
                className={`p-5 rounded-2xl border-2 shadow-sm transition space-y-4 ${getCardBorderColor(del.status)}`}
              >
                {/* Devotee Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-black/5 pb-3">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-charcoal text-lg tracking-tight">
                      {devoteeName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-charcoal-light">
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

                      {phone && (
                        <a
                          href={`tel:${phone}`}
                          className="flex items-center gap-1 text-primary hover:underline font-semibold"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="self-start">
                    {getStatusBadge(del.status)}
                  </div>
                </div>

                {/* Volunteer Assignment Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block">
                    Assign Volunteer (ಸ್ವಯಂಸೇವಕರ ನಿಯೋಜನೆ)
                  </span>
                  <select
                    value={del.assignedVolunteer?._id || ''}
                    onChange={(e) => handleAssignVolunteer(del._id, e.target.value)}
                    className="w-full bg-white border border-warm-dark rounded-xl p-2.5 text-xs sm:text-sm font-semibold text-charcoal outline-none focus:border-accent"
                  >
                    <option value="">-- Select Volunteer --</option>
                    {volunteers.map(v => (
                      <option key={v._id} value={v._id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Action Buttons */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block">
                      Update Delivery Status
                    </span>
                    {!canUpdateStatus && (
                      <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked by Superadmin
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={!canUpdateStatus}
                      onClick={() => handleUpdateStatus(del._id, 'PENDING')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                        del.status === 'PENDING'
                          ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-charcoal border-slate-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>PENDING</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canUpdateStatus}
                      onClick={() => handleUpdateStatus(del._id, 'OUT_FOR_DELIVERY')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                        del.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white hover:bg-amber-50 text-charcoal border-slate-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>OUT NOW</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canUpdateStatus}
                      onClick={() => handleUpdateStatus(del._id, 'DELIVERED')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                        del.status === 'DELIVERED'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white hover:bg-emerald-50 text-charcoal border-slate-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>DELIVERED</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canUpdateStatus}
                      onClick={() => handleUpdateStatus(del._id, 'UNABLE_TO_DELIVER')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                        del.status === 'UNABLE_TO_DELIVER'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white hover:bg-rose-50 text-charcoal border-slate-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>FAILED</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-warm-dark p-12 rounded-2xl text-center space-y-2">
          <p className="text-charcoal font-bold text-base">No devotees found matching active filters.</p>
          <p className="text-xs text-charcoal-light">Try resetting filters or registering devotees in Kathe / Vrata Sankalpa.</p>
        </div>
      )}
    </div>
  );
};

