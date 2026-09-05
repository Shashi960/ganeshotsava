import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BookOpen, Sparkles, Check, Send, Coins, 
  Search, Download, Lock, CheckCircle, Clock 
} from 'lucide-react';

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
  bookNo?: string;
  confirmed: boolean;
  registrationStatus: string;
  year: string;
}

export const KatheView: React.FC = () => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // Dynamic Vrata states based on scheduled events
  const [vrataDateStr, setVrataDateStr] = useState('16-09-2026 Wednesday (ಬುಧವಾರ ಬೆಳಿಗ್ಗೆ)');
  const [editionText, setEditionText] = useState('35th');
  const [currentYearVal, setCurrentYearVal] = useState('2026');

  // Registration Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [homeName, setHomeName] = useState('');
  const [address, setAddress] = useState('');
  const [place, setPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [bookNo, setBookNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('all');

  useEffect(() => {
    // Fetch places
    api.get('/places?active=true').then(res => {
      if (res.data.status === 'success') {
        setPlaces(res.data.places);
        if (res.data.places.length > 0) {
          setPlace(res.data.places[0]._id);
        }
      }
    }).catch(err => console.error(err));

    // Fetch Vrata event dynamically to map dates/editions
    api.get('/events').then(res => {
      if (res.data.status === 'success') {
        const vrataEvt = res.data.events.find((e: any) => e.title.includes('Vrata') || e.titleKannada.includes('ವ್ರತ'));
        if (vrataEvt) {
          const dObj = new Date(vrataEvt.date);
          const knDate = dObj.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          const dayName = dObj.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-US', { weekday: 'long' });
          setVrataDateStr(`${knDate} (${dayName})`);
          
          const yearNum = dObj.getFullYear();
          setCurrentYearVal(yearNum.toString());
          // 35th Ganeshotsava is 2026. 2026 - 1991 = 35.
          setEditionText(`${yearNum - 1991}th`);
        }
      }
    }).catch(err => console.error(err));

    fetchParticipants();
  }, [language]);

  const fetchParticipants = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/kathe');
      if (res.data.status === 'success') {
        setParticipants(res.data.participants || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !place || !phone) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName,
        lastName,
        homeName,
        address,
        place,
        phone,
        bookNo,
        registrationStatus: 'PENDING',
        confirmed: false,
        year: currentYearVal
      };

      const res = await api.post('/kathe', payload);
      if (res.data.status === 'success') {
        setSuccess(true);
        showToast('Registration submitted successfully!', 'success');
        // Clear form
        setFirstName('');
        setLastName('');
        setHomeName('');
        setAddress('');
        setPhone('');
        setBookNo('');
        fetchParticipants(); // Refresh list immediately
      }
    } catch (error) {
      console.error(error);
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlaceName = (placeObj: any) => {
    if (!placeObj) return '';
    if (typeof placeObj === 'string') return placeObj;
    return language === 'kn' ? placeObj.nameKannada : placeObj.name;
  };

  // CSV Downloader
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
      'Book Number',
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
        p.bookNo || '',
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
    link.setAttribute('download', `satya_ganapati_vrata_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started!', 'success');
  };

  // Filter Logic
  const filteredParticipants = (participants || []).filter(p => {
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const searchStr = (search || '').toLowerCase();
    const matchesSearch = 
      fullName.includes(searchStr) || 
      (p.phone || '').includes(searchStr) || 
      (p.bookNo || '').toLowerCase().includes(searchStr);
    
    const placeId = p.place && typeof p.place === 'object' ? p.place._id : p.place;
    const matchesPlace = selectedPlace === 'all' || placeId === selectedPlace;

    return matchesSearch && matchesPlace;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navKathe')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          Sri Satya Ganapati Vrata Mass Sankalpa registration and public directory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Vrata Details */}
        <div className="bg-white rounded-xl border border-warm-dark p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-accent/20 pb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-charcoal tracking-wide">
              Vrata Program Information
            </h2>
          </div>

          <div className="space-y-4 text-charcoal-light leading-relaxed text-sm sm:text-base font-kannada">
            <div className="bg-amber-50/50 p-4 border border-accent/30 rounded-lg space-y-1">
              <span className="text-xs font-bold text-secondary block uppercase">DATE & TIME</span>
              <span className="font-bold text-primary text-base">{vrataDateStr}</span>
            </div>

            <p>
              On the auspicious occasion of the {editionText} Ganeshotsava, we are conducting the **Mass Sri Satya Ganapati Vrata (ಸಾಮೂಹಿಕ ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ)** at the Sri Ganapati Sannidhi, for universal peace and community welfare.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-warm-dark p-4 rounded-lg flex items-start gap-3">
                <Coins className="h-5 w-5 text-accent-dark flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-charcoal block uppercase">Vrata Contribution</span>
                  <span className="font-bold text-charcoal text-base">Rs. 150/-</span>
                  <p className="text-xs text-charcoal-light mt-0.5">Includes Vrata Sankalpa in your name & home-delivered Prasada.</p>
                </div>
              </div>

              <div className="border border-warm-dark p-4 rounded-lg flex items-start gap-3">
                <Coins className="h-5 w-5 text-accent-dark flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-charcoal block uppercase">Seva Pooja Receipt</span>
                  <span className="font-bold text-charcoal text-base">Rs. 50/-</span>
                  <p className="text-xs text-charcoal-light mt-0.5">Separate receipt issued for additional offerings.</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-2">
              <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Sponsor of Vrata Prasada & Items
              </h3>
              <p className="text-xs italic text-primary-dark">
                Shri Ganapati R. Nayak, Najagara Cross (ಗಣಪತಿ ಆರ್. ನಾಯ್ಕ, ನಾಜಗಾರ ಕ್ರಾಸ್)
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form (Restricted to logged-in Admins/Users) */}
        <div className="bg-white rounded-xl border border-warm-dark p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-warm-dark pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-wide">
              Vrata Registration
            </h2>
            <p className="text-xs text-charcoal-light mt-1">
              Register devotee details for the upcoming Sri Satya Ganapati Vrata.
            </p>
          </div>

          {!isAuthenticated ? (
            // Notice card for public users who are not logged in
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-4">
              <Lock className="h-10 w-10 text-amber-600 mx-auto" />
              <h3 className="font-bold text-charcoal">Administrative Registration Only</h3>
              <p className="text-xs text-charcoal-light leading-relaxed">
                To prevent duplicate entries and maintain database integrity, Sri Satya Ganapati Vrata registrations can only be submitted by committee members or administrative users. 
              </p>
              <p className="text-xs font-semibold text-charcoal">
                Please log in with your unique username and password to register new families.
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center bg-primary text-warm text-xs font-bold uppercase px-6 py-2.5 rounded-lg hover:bg-primary-light transition shadow-sm"
              >
                Go to Login Panel
              </Link>
            </div>
          ) : success ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-lg text-center space-y-3">
              <div className="h-12 w-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">Registration Submitted!</h3>
              <p className="text-sm">
                Thank you for registering. The committee will perform the Vrata Sankalpa under your family name. Prasada will be sent to your address.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                Register another family
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">First Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Last Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Home / Family Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jyothi House"
                    value={homeName}
                    onChange={(e) => setHomeName(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Book Number <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Book 12 / Receipt 45"
                    value={bookNo}
                    onChange={(e) => setBookNo(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Area / Place <span className="text-rose-500">*</span></label>
                  <select
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  >
                    {places.map((p) => (
                      <option key={p._id} value={p._id}>
                        {language === 'kn' ? p.nameKannada : p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Phone Number <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-warm font-bold py-2.5 rounded-lg hover:bg-primary-light transition flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Register Devotee'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Public Registrations Directory (Read-only for all users) */}
      <div className="space-y-6 pt-6 border-t border-warm-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-accent-dark" />
              <span>Registered Devotees List</span>
            </h2>
            <p className="text-xs text-charcoal-light mt-1">
              Public read-only directory of devotees participating in this year's mass Sri Satya Ganapati Vrata.
            </p>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-warm-dark hover:bg-warm-dark/85 text-charcoal px-4 py-2.5 rounded-lg shadow-sm border border-warm-dark transition"
          >
            <Download className="h-4 w-4" />
            <span>Download Vrata List (CSV)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-warm-dark p-4 rounded-xl shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
            <input
              type="text"
              placeholder="Search by name, phone, or Book No..."
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
        </div>

        {loadingList ? (
          <div className="py-12 text-center text-charcoal-light font-semibold">Loading devotee directory...</div>
        ) : filteredParticipants.length > 0 ? (
          <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                    <th className="p-4">Sl No</th>
                    <th className="p-4">Devotee Name</th>
                    <th className="p-4">Place / Area</th>
                    <th className="p-4">Book Number</th>
                    <th className="p-4">Year</th>
                    <th className="p-4">Sankalpa Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-dark text-sm">
                  {filteredParticipants.map((p, index) => (
                    <tr key={p._id} className="hover:bg-warm-dark/10 transition">
                      <td className="p-4 font-bold text-charcoal-light">{index + 1}</td>
                      <td className="p-4 font-bold text-charcoal">
                        <div>
                          {p.firstName} {p.lastName}
                          {p.homeName && <span className="block text-xs font-normal text-charcoal-light">Family: {p.homeName}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-charcoal-light font-medium font-kannada">
                        {getPlaceName(p.place)}
                      </td>
                      <td className="p-4 text-charcoal font-bold">
                        {p.bookNo || '-'}
                      </td>
                      <td className="p-4 font-bold text-charcoal">
                        {p.year}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          p.confirmed
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {p.confirmed ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {p.registrationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light shadow-sm">
            No registered devotees found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
