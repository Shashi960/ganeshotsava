import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { CheckCircle2, Truck, ClipboardList, AlertCircle, RefreshCw, Filter, ShieldAlert } from 'lucide-react';

interface Volunteer {
  _id: string;
  name: string;
}

interface Delivery {
  _id: string;
  homeName?: string;
  address?: string;
  place: { name: string; nameKannada: string };
  assignedVolunteer?: { _id: string; name: string };
  status: 'PENDING' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'UNABLE_TO_DELIVER';
}

export const AdminPrasada: React.FC = () => {
  const { showToast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [volunteerFilter, setVolunteerFilter] = useState('all');

  useEffect(() => {
    fetchDeliveries();
    api.get('/volunteers?active=true').then(res => {
      if (res.data.status === 'success') setVolunteers(res.data.volunteers);
    });
  }, [statusFilter, volunteerFilter]);

  const fetchDeliveries = () => {
    setLoading(true);
    let url = '/prasada';
    const params = [];
    if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
    if (volunteerFilter !== 'all') params.push(`assignedVolunteer=${volunteerFilter}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    api.get(url).then(res => {
      if (res.data.status === 'success') {
        setDeliveries(res.data.deliveries);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.put(`/prasada/${id}/status`, { status: newStatus });
      if (res.data.status === 'success') {
        showToast(`Delivery status updated to ${newStatus.replace(/_/g, ' ')}!`);
        fetchDeliveries();
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update delivery status.', 'error');
    }
  };

  const handleAssignVolunteer = async (id: string, volunteerId: string) => {
    try {
      const res = await api.put(`/prasada/${id}/status`, { assignedVolunteer: volunteerId || null });
      if (res.data.status === 'success') {
        showToast('Volunteer assigned successfully!');
        fetchDeliveries();
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to assign volunteer.', 'error');
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-emerald-50 border-emerald-300';
      case 'OUT_FOR_DELIVERY': return 'bg-amber-50 border-amber-300 animate-pulse';
      case 'ASSIGNED': return 'bg-blue-50 border-blue-300';
      case 'UNABLE_TO_DELIVER': return 'bg-rose-50 border-rose-300';
      case 'PENDING':
      default:
        return 'bg-slate-50 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">Prasada Delivery Operations</h1>
          <p className="text-xs text-charcoal-light">Manage field deliveries, assign volunteers, and track statuses.</p>
        </div>
        <button
          onClick={fetchDeliveries}
          className="p-2 border border-warm-dark hover:bg-warm rounded-lg text-charcoal-light hover:text-charcoal inline-flex items-center gap-1 text-xs font-bold uppercase transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Operational Filters Row */}
      <div className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-charcoal-light uppercase">
          <Filter className="h-4 w-4" />
          <span>Quick Filters:</span>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-warm border border-warm-dark p-2 rounded-lg text-xs font-bold text-charcoal"
          >
            <option value="all">ALL STATUSES</option>
            <option value="PENDING">PENDING</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="UNABLE_TO_DELIVER">UNABLE TO DELIVER</option>
          </select>

          <select
            value={volunteerFilter}
            onChange={(e) => setVolunteerFilter(e.target.value)}
            className="bg-warm border border-warm-dark p-2 rounded-lg text-xs font-bold text-charcoal"
          >
            <option value="all">ALL VOLUNTEERS</option>
            {volunteers.map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile-Friendly delivery cards */}
      {loading ? (
        <div className="py-12 text-center text-charcoal-light">Loading delivery operations board...</div>
      ) : deliveries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliveries.map(del => (
            <div
              key={del._id}
              className={`p-5 rounded-xl border-2 shadow-sm transition space-y-4 ${getStatusBgColor(del.status)}`}
            >
              <div className="flex justify-between items-start border-b border-black/5 pb-2">
                <div>
                  <h3 className="font-extrabold text-charcoal text-base">
                    {del.homeName || 'Anonymous Devotee'}
                  </h3>
                  <p className="text-xs text-charcoal-light font-medium mt-0.5">
                    Area: {del.place.name} ({del.place.nameKannada})
                  </p>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border-2 bg-white">
                  {del.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Volunteer Assignment selector dropdown */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-charcoal-light uppercase">Assign Volunteer</span>
                <select
                  value={del.assignedVolunteer?._id || ''}
                  onChange={(e) => handleAssignVolunteer(del._id, e.target.value)}
                  className="w-full bg-white border border-warm-dark rounded-lg p-2 text-xs font-bold text-charcoal"
                >
                  <option value="">Choose Volunteer...</option>
                  {volunteers.map(v => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Large Status Action Buttons - Minimum Clicks required! */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-charcoal-light uppercase block">Update Delivery Status</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(del._id, 'PENDING')}
                    className={`py-1.5 rounded text-xs font-bold border transition ${del.status === 'PENDING' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white hover:bg-slate-100 text-charcoal border-slate-300'}`}
                  >
                    PENDING
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(del._id, 'OUT_FOR_DELIVERY')}
                    className={`py-1.5 rounded text-xs font-bold border transition ${del.status === 'OUT_FOR_DELIVERY' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white hover:bg-amber-100 text-charcoal border-slate-300'}`}
                  >
                    OUT NOW
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(del._id, 'DELIVERED')}
                    className={`py-1.5 rounded text-xs font-bold border transition ${del.status === 'DELIVERED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-emerald-100 text-charcoal border-slate-300'}`}
                  >
                    DELIVERED
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(del._id, 'UNABLE_TO_DELIVER')}
                    className={`py-1.5 rounded text-xs font-bold border transition ${del.status === 'UNABLE_TO_DELIVER' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white hover:bg-rose-100 text-charcoal border-slate-300'}`}
                  >
                    FAILED
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-warm-dark p-8 rounded-xl text-center text-charcoal-light">
          No delivery records match active filters.
        </div>
      )}
    </div>
  );
};
