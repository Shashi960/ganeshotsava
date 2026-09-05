import React, { useState, useEffect } from 'react';
import { BookOpen, Download, FileText, Search, Trash2, CheckCircle, Clock, Edit2, X, MapPin, Phone } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { exportKatheToExcel } from '../utils/excelExport';
import { exportKatheToPdf } from '../utils/pdfExport';
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHomeName, setEditHomeName] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editCustomPlace, setEditCustomPlace] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBookNo, setEditBookNo] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editYear, setEditYear] = useState('2026');
  const [editConfirmed, setEditConfirmed] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const handleOpenEdit = (p: Participant) => {
    setEditingId(p._id);
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    setEditName(fullName);
    setEditHomeName(p.homeName || '');

    const placeId = p.place && typeof p.place === 'object' ? p.place._id : (p.place || '');
    setEditPlace(placeId);
    setEditCustomPlace('');
    setEditPhone(p.phone || '');
    setEditBookNo(p.bookNo || p.notes || '');
    setEditAddress(p.address || '');
    setEditYear(p.year || '2026');
    setEditConfirmed(p.confirmed || false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editName.trim()) {
      showToast('Devotee name is required.', 'warning');
      return;
    }

    setSavingEdit(true);
    try {
      const payload: any = {
        name: editName.trim(),
        homeName: editHomeName.trim(),
        place: editPlace,
        customPlace: editPlace === 'other' ? editCustomPlace.trim() : undefined,
        phone: editPhone.trim(),
        bookNo: editBookNo.trim(),
        address: editAddress.trim(),
        year: editYear,
        confirmed: editConfirmed,
        registrationStatus: editConfirmed ? 'CONFIRMED' : 'PENDING'
      };

      const res = await api.put(`/kathe/${editingId}`, payload);
      if (res.data.status === 'success' && res.data.participant) {
        showToast('Devotee details updated successfully!', 'success');
        const updated = res.data.participant;
        setParticipants(prev => prev.map(item => item._id === editingId ? { ...item, ...updated } : item));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update devotee details.', 'error');
    } finally {
      setSavingEdit(false);
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

  // PDF Downloader Utility
  const handleDownloadPdf = async () => {
    if ((filteredParticipants || []).length === 0) {
      showToast('No registrations found to download.', 'warning');
      return;
    }

    setDownloadingPdf(true);
    try {
      showToast('Generating Kannada Unicode PDF...', 'info');
      await exportKatheToPdf(filteredParticipants, language, {
        filenamePrefix: 'kathe_registrations'
      });
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Export PDF failed:', err);
      showToast('Failed to generate PDF document.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Excel (.xlsx) Downloader Utility
  const handleDownloadCSV = () => {
    if ((filteredParticipants || []).length === 0) {
      showToast('No participants found to download.', 'warning');
      return;
    }

    try {
      exportKatheToExcel(filteredParticipants, language, {
        filenamePrefix: 'kathe_registrations',
        sheetName: 'Kathe Registrations'
      });
      showToast('Download started!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to generate Excel file.', 'error');
    }
  };

  const getPlaceName = (placeObj: any) => {
    if (!placeObj) return '';
    if (typeof placeObj === 'string') return placeObj;
    return language === 'kn' ? (placeObj.nameKannada || placeObj.name) : (placeObj.name || placeObj.nameKannada);
  };

  // Filter logic
  const filteredParticipants = (participants || []).filter(p => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const searchStr = (search || '').toLowerCase();
    const matchesSearch =
      fullName.includes(searchStr) ||
      (p.phone || '').includes(searchStr) ||
      (p.bookNo || '').toLowerCase().includes(searchStr) ||
      (p.homeName || '').toLowerCase().includes(searchStr);

    const placeId = p.place && typeof p.place === 'object' ? p.place._id : p.place;
    const matchesPlace = selectedPlace === 'all' || placeId === selectedPlace;

    const matchesStatus = selectedStatus === 'all' || p.registrationStatus === selectedStatus;

    return matchesSearch && matchesPlace && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-accent-dark" />
            <span>Sri Satya Ganapati Vrata (Kathe) Registrations</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-light mt-1">
            Track, edit, and verify Mass Satya Ganapati Vrata registrations for the active Ganeshotsava year.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-primary text-warm hover:bg-primary-light px-4 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            title="Export Excel Spreadsheet"
            className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-warm-dark hover:bg-warm-dark/85 text-charcoal px-3 py-2.5 rounded-lg shadow-sm border border-warm-dark transition"
          >
            <Download className="h-4 w-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-white border border-warm-dark p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
          <input
            type="text"
            placeholder="Search by devotee name, book no, or phone..."
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
        <>
          {/* MOBILE VIEW: Touch-Friendly Card Grid */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredParticipants.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-xl border border-warm-dark p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-charcoal text-base">
                      {`${p.firstName || ''} ${p.lastName || ''}`.trim()}
                    </h3>
                    {p.homeName && (
                      <p className="text-xs text-charcoal-light">Family / Home: {p.homeName}</p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    p.confirmed
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {p.registrationStatus}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-light border-t border-warm-dark/50 pt-2">
                  <span className="flex items-center gap-1 font-medium text-charcoal">
                    <MapPin className="h-3.5 w-3.5 text-accent-dark" />
                    <span>{getPlaceName(p.place)}</span>
                  </span>

                  {p.bookNo && (
                    <span className="bg-warm px-2 py-0.5 rounded font-bold text-primary border border-warm-dark">
                      Book #{p.bookNo}
                    </span>
                  )}

                  {p.phone && (
                    <span className="flex items-center gap-1 text-charcoal-light">
                      <Phone className="h-3 w-3" />
                      <span>{p.phone}</span>
                    </span>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-end gap-2 border-t border-warm-dark/50 pt-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleToggleConfirm(p)}
                    title={p.confirmed ? 'Set as Pending' : 'Mark as Confirmed'}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      p.confirmed
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{p.confirmed ? 'Pending' : 'Confirm'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: Full Structured Table */}
          <div className="hidden sm:block bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
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
                          {`${p.firstName || ''} ${p.lastName || ''}`.trim()}
                          {p.homeName && <span className="block text-xs font-normal text-charcoal-light">Family: {p.homeName}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-charcoal-light font-medium font-kannada">
                        {getPlaceName(p.place)}
                      </td>
                      <td className="p-4 text-charcoal-light">
                        <div>
                          {p.phone || '-'}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Devotee Details"
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition inline-flex items-center gap-1 text-xs font-bold"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Edit</span>
                          </button>

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
        </>
      ) : (
        <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light shadow-sm">
          No Kathe registrations match your filters.
        </div>
      )}

      {/* EDIT MODAL DIALOG */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-warm-dark max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-warm-dark pb-3">
              <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-accent-dark" />
                <span>Edit Kathe Devotee Details</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-warm text-charcoal-light"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm text-charcoal">
              {/* Devotee Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-xs block">
                  Devotee Name (ಭಕ್ತರ ಹೆಸರು) *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Shashank Kodiya or ಕನ್ನಡದಲ್ಲಿ ಹೆಸರು"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-semibold"
                />
              </div>

              {/* Family / Home Name */}
              <div className="space-y-1">
                <label className="font-bold text-xs block">
                  Family / Home Name (ಮನೆತನ / ಮನೆ ಹೆಸರು)
                </label>
                <input
                  type="text"
                  value={editHomeName}
                  onChange={(e) => setEditHomeName(e.target.value)}
                  placeholder="e.g. Kodiya Mane"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent"
                />
              </div>

              {/* Area / Place Dropdown */}
              <div className="space-y-1">
                <label className="font-bold text-xs block">
                  Area / Place (ಪ್ರದೇಶ / ಸ್ಥಳ) *
                </label>
                <select
                  value={editPlace}
                  onChange={(e) => setEditPlace(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-medium"
                >
                  <option value="">-- Select Place --</option>
                  {places.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.nameKannada})
                    </option>
                  ))}
                  <option value="other">+ Other Place (ಇತರ ಪ್ರದೇಶ)</option>
                </select>
              </div>

              {/* Custom Place Input if 'other' is selected */}
              {editPlace === 'other' && (
                <div className="space-y-1">
                  <label className="font-bold text-xs block text-primary">
                    Enter Custom Area / Place Name (ಹೊಸ ಪ್ರದೇಶದ ಹೆಸರು) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCustomPlace}
                    onChange={(e) => setEditCustomPlace(e.target.value)}
                    placeholder="Enter place name in Kannada or English"
                    className="w-full bg-warm border border-accent rounded-xl p-2.5 outline-none font-semibold"
                  />
                </div>
              )}

              {/* Book Number & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs block">
                    Book Number (ಪುಸ್ತಕ ಸಂಖ್ಯೆ)
                  </label>
                  <input
                    type="text"
                    value={editBookNo}
                    onChange={(e) => setEditBookNo(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block">
                    Phone Number (ದೂರವಾಣಿ ಸಂಖ್ಯೆ)
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Optional phone number"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="font-bold text-xs block">
                  Address (ವಿಳಾಸ)
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Address or landmark"
                  className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent"
                />
              </div>

              {/* Year & Sankalpa Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs block">Year (ವರ್ಷ)</label>
                  <input
                    type="text"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block">Sankalpa Status (ಸಂಕಲ್ಪ ಸ್ಥಿತಿ)</label>
                  <select
                    value={editConfirmed ? 'CONFIRMED' : 'PENDING'}
                    onChange={(e) => setEditConfirmed(e.target.value === 'CONFIRMED')}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none font-bold"
                  >
                    <option value="PENDING">PENDING (ಸಂಕಲ್ಪ ಬಾಕಿ)</option>
                    <option value="CONFIRMED">CONFIRMED (ಸಂಕಲ್ಪ ಪೂರ್ಣ)</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 border-t border-warm-dark pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 border border-warm-dark rounded-xl text-charcoal hover:bg-warm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 bg-primary text-warm font-bold rounded-xl hover:bg-primary-light transition shadow disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

