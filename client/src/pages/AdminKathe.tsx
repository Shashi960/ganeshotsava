import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Search, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

interface Place {
  _id: string;
  name: string;
  nameKannada: string;
}

interface Participant {
  _id: string;
  firstName: string;
  lastName: string;
  homeName?: string;
  address?: string;
  place: Place | string;
  phone: string;
  notes?: string;
  bookNo?: string;
  confirmed: boolean;
  registrationStatus: string;
  year: string;
}

export const AdminKathe: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [participantsRes, placesRes] = await Promise.all([
        api.get('/kathe'),
        api.get('/places')
      ]);

      if (participantsRes.data.status === 'success') {
        setParticipants(participantsRes.data.participants || []);
      }
      if (placesRes.data.status === 'success') {
        setPlaces(placesRes.data.places);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch Kathe registrations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConfirm = async (p: Participant) => {
    try {
      const updatedConfirmed = !p.confirmed;
      const res = await api.put(`/kathe/${p._id}`, {
        confirmed: updatedConfirmed,
        registrationStatus: updatedConfirmed ? 'CONFIRMED' : 'PENDING'
      });

      if (res.data.status === 'success') {
        showToast(
          `Registration ${updatedConfirmed ? 'confirmed' : 'set to pending'} successfully!`,
          'success'
        );
        setParticipants(prev =>
          prev.map(item =>
            item._id === p._id
              ? { ...item, confirmed: updatedConfirmed, registrationStatus: updatedConfirmed ? 'CONFIRMED' : 'PENDING' }
              : item
          )
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) return;

    try {
      const res = await api.delete(`/kathe/${id}`);
      if (res.data.status === 'success') {
        showToast('Registration deleted successfully.', 'success');
        setParticipants(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete registration.', 'error');
    }
  };

  // CSV Downloader Utility
  const handleDownloadCSV = () => {
    if (filteredParticipants.length === 0) {
      showToast('No participants found to download.', 'warning');
      return;
    }

    const headers = [
      'First Name',
      'Last Name',
      'Home/Family Name',
      'Phone Number',
      'Place/Area',
      'Address',
      'Sankalpa Notes',
      'Status',
      'Year'
    ];

    const rows = filteredParticipants.map(p => {
      const placeName = p.place && typeof p.place === 'object' 
        ? (language === 'kn' ? p.place.nameKannada : p.place.name)
        : p.place;
      
      return [
        p.firstName,
        p.lastName,
        p.homeName || '',
        p.phone || '',
        placeName || '',
        p.address || '',
        (p.notes || '').replace(/\r?\n|\r/g, ' '),
        p.registrationStatus,
        p.year
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kathe_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started!', 'success');
  };

  const getPlaceName = (placeObj: any) => {
    if (!placeObj) return '';
    if (typeof placeObj === 'string') return placeObj;
    return language === 'kn' ? placeObj.nameKannada : placeObj.name;
  };

  // Filter logic
  const filteredParticipants = (participants || []).filter(p => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const searchStr = (search || '').toLowerCase();
    const matchesSearch = 
      fullName.includes(searchStr) || 
      (p.phone || '').includes(searchStr) || 
      (p.bookNo || '').toLowerCase().includes(searchStr);
    
    const placeId = p.place && typeof p.place === 'object' ? p.place._id : p.place;
    const matchesPlace = selectedPlace === 'all' || placeId === selectedPlace;

    const matchesStatus = selectedStatus === 'all' || p.registrationStatus === selectedStatus;

    return matchesSearch && matchesPlace && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-accent-dark" />
            <span>Sri Satya Ganapati Vrata (Kathe) Registrations</span>
          </h1>
          <p className="text-xs text-charcoal-light mt-1">
            Track and verify Mass Satya Ganapati Vrata registrations for the active Ganeshotsava year.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-primary text-warm hover:bg-primary-light px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV / Download List</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-warm-dark p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
          />
        </div>

        <div>
          <select
            value={selectedPlace}
            onChange={(e) => setSelectedPlace(e.target.value)}
            className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
          >
            <option value="all">All Places / Areas</option>
            {places.map(p => (
              <option key={p._id} value={p._id}>
                {language === 'kn' ? p.nameKannada : p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending (Sankalpa Not Done)</option>
            <option value="CONFIRMED">Confirmed (Sankalpa Completed)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal-light font-semibold">Loading registrations...</div>
      ) : filteredParticipants.length > 0 ? (
        <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                  <th className="p-4">Devotee Name</th>
                  <th className="p-4">Place / Area</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Book Number</th>
                  <th className="p-4">Year</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark text-sm">
                {filteredParticipants.map((p) => (
                  <tr key={p._id} className="hover:bg-warm-dark/10 transition">
                    <td className="p-4 font-bold text-charcoal">
                      <div>
                        {p.firstName} {p.lastName}
                        {p.homeName && <span className="block text-xs font-normal text-charcoal-light">Family: {p.homeName}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-charcoal-light font-medium font-kannada">
                      {getPlaceName(p.place)}
                    </td>
                    <td className="p-4 text-charcoal-light">
                      <div>
                        {p.phone}
                        {p.address && <span className="block text-[10px] text-charcoal-light/75 max-w-xs truncate">{p.address}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-charcoal font-bold">
                      {p.bookNo || '-'}
                    </td>
                    <td className="p-4 font-bold text-charcoal">
                      {p.year}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.confirmed
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {p.registrationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleConfirm(p)}
                          title={p.confirmed ? 'Set as Pending' : 'Mark as Confirmed'}
                          className={`p-1.5 rounded-lg border transition ${
                            p.confirmed
                              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          title="Delete Registration"
                          className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light shadow-sm">
          No Kathe registrations match your filters.
        </div>
      )}
    </div>
  );
};
