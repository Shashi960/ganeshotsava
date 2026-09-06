import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { exportKatheToExcel } from '../utils/excelExport';
import { exportKatheToPdf } from '../utils/pdfExport';
import api from '../services/api';
import { 
  BookOpen, Sparkles, Check, Send, Coins, 
  Search, Download, FileText, Lock, CheckCircle, Clock,
  Edit2, Trash2, X, MapPin, Phone
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
  const [vrataDateStr, setVrataDateStr] = useState(
    language === 'kn' ? 'ಸೆಪ್ಟೆಂಬರ್ 16, 2026 (ಬುಧವಾರ)' : 'September 16, 2026 (Wednesday)'
  );
  const [editionText, setEditionText] = useState(language === 'kn' ? '35ನೇ' : '35th');
  const [currentYearVal, setCurrentYearVal] = useState('2026');

  // Registration Form State
  const [name, setName] = useState('');
  const [homeName, setHomeName] = useState('');
  const [address, setAddress] = useState('');
  const [place, setPlace] = useState('');
  const [customPlace, setCustomPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [bookNo, setBookNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastRegisteredName, setLastRegisteredName] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState('all');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Admin Edit Modal State
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

  const fetchPlaces = async () => {
    try {
      const res = await api.get('/places?active=true');
      if (res.data.status === 'success' && res.data.places) {
        setPlaces(res.data.places);
        if (res.data.places.length > 0 && !place) {
          setPlace(res.data.places[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlaces();

    // Fetch Vrata event dynamically to map dates/editions
    api.get('/events').then(res => {
      if (res.data.status === 'success') {
        const vrataEvt = res.data.events.find((e: any) => (e.title && e.title.includes('Vrata')) || (e.titleKannada && e.titleKannada.includes('ವ್ರತ')));
        if (vrataEvt) {
          const dObj = new Date(vrataEvt.date);
          const knDate = dObj.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          const dayName = dObj.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-US', { weekday: 'long' });
          setVrataDateStr(`${knDate} (${dayName})`);
          
          const yearNum = dObj.getFullYear();
          setCurrentYearVal(yearNum.toString());
          // 35th Ganeshotsava is 2026. 2026 - 1991 = 35.
          setEditionText(language === 'kn' ? `${yearNum - 1991}ನೇ` : `${yearNum - 1991}th`);
        } else {
          setVrataDateStr(language === 'kn' ? 'ಸೆಪ್ಟೆಂಬರ್ 16, 2026 (ಬುಧವಾರ)' : 'September 16, 2026 (Wednesday)');
          setEditionText(language === 'kn' ? '35ನೇ' : '35th');
        }
      }
    }).catch(err => {
      console.error(err);
      setVrataDateStr(language === 'kn' ? 'ಸೆಪ್ಟೆಂಬರ್ 16, 2026 (ಬುಧವಾರ)' : 'September 16, 2026 (Wednesday)');
      setEditionText(language === 'kn' ? '35ನೇ' : '35th');
    });

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

  const handleOpenEdit = (p: Participant) => {
    setEditingId(p._id);
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    setEditName(fullName);
    setEditHomeName(p.homeName || '');

    const placeId = p.place && typeof p.place === 'object' ? p.place._id : (p.place || '');
    setEditPlace(placeId);
    setEditCustomPlace('');
    setEditPhone(p.phone || '');
    setEditBookNo(p.bookNo || '');
    setEditAddress(p.address || '');
    setEditYear(p.year || '2026');
    setEditConfirmed(p.confirmed || false);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editName.trim()) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಭಕ್ತರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Devotee name is required.', 'warning');
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
        showToast(language === 'kn' ? 'ಮಾಹಿತಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!' : 'Devotee details updated successfully!', 'success');
        const updated = res.data.participant;
        setParticipants(prev => prev.map(item => item._id === editingId ? { ...item, ...updated } : item));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      showToast(language === 'kn' ? 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.' : 'Failed to update devotee details.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, devoteeName?: string) => {
    const confirmMsg = language === 'kn'
      ? `ಖಚಿತವಾಗಿ ನೀವು "${devoteeName || 'ಈ ಭಕ್ತರ'}" ನೋಂದಣಿಯನ್ನು ಅಳಿಸಲು ಬಯಸುವಿರಾ?\n\nಗಮನಿಸಿ: ಇದು ಪ್ರಸಾದ ಪಟ್ಟಿಯಿಂದಲೂ ಇವರ ದಾಖಲೆಯನ್ನು ಅಳಿಸುತ್ತದೆ.`
      : `Are you sure you want to delete the registration for "${devoteeName || 'this devotee'}"?\n\nNote: This will also remove their Prasada delivery record.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/kathe/${id}`);
      if (res.data.status === 'success') {
        showToast(language === 'kn' ? 'ನೋಂದಣಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.' : 'Devotee registration deleted successfully.', 'success');
        setParticipants(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error(err);
      showToast(language === 'kn' ? 'ನೋಂದಣಿ ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to delete devotee registration.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಭಕ್ತರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : 'Please enter devotee name.', 'warning');
      return;
    }
    if (!place || (place === 'other' && !customPlace.trim())) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಸ್ಥಳ / ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ನಮೂದಿಸಿ' : 'Please select or enter place / area.', 'warning');
      return;
    }
    if (!bookNo.trim()) {
      showToast(language === 'kn' ? 'ದಯವಿಟ್ಟು ಪುಸ್ತಕ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ' : 'Please enter book number.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        firstName: name.trim(),
        lastName: '',
        homeName: homeName.trim(),
        address: address.trim(),
        place,
        customPlace: place === 'other' ? customPlace.trim() : undefined,
        phone: phone.trim(),
        bookNo: bookNo.trim(),
        registrationStatus: 'PENDING',
        confirmed: false,
        year: currentYearVal
      };

      const res = await api.post('/kathe', payload);
      if (res.data.status === 'success') {
        const registeredDevotee = name.trim();
        setLastRegisteredName(registeredDevotee);
        showToast(
          language === 'kn'
            ? `"${registeredDevotee}" ಅವರ ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!`
            : `"${registeredDevotee}" registered successfully!`,
          'success'
        );

        // Immediately add to local list without any reload
        if (res.data.participant) {
          const newParticipant = res.data.participant;
          setParticipants(prev => {
            const exists = prev.some(item => item._id === newParticipant._id);
            if (exists) return prev;
            return [newParticipant, ...prev];
          });
        }

        // Clear all text fields so form is immediately blank and ready for the next entry
        setName('');
        setHomeName('');
        setAddress('');
        setCustomPlace('');
        setPhone('');
        setBookNo('');

        // Refresh list and places in background
        fetchParticipants();
        fetchPlaces();

        // Automatically focus name input for fast consecutive entry
        setTimeout(() => {
          nameInputRef.current?.focus();
        }, 50);
      }
    } catch (error) {
      console.error(error);
      showToast(language === 'kn' ? 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ.' : 'Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlaceName = (placeObj: any) => {
    if (!placeObj) return '';
    if (typeof placeObj === 'string') return placeObj;
    return language === 'kn' ? placeObj.nameKannada : placeObj.name;
  };

  // PDF Downloader
  const handleDownloadPdf = async () => {
    if ((filteredParticipants || []).length === 0) {
      showToast('No devotees found to download.', 'warning');
      return;
    }

    setDownloadingPdf(true);
    try {
      showToast('Generating Kannada Unicode PDF...', 'info');
      await exportKatheToPdf(filteredParticipants, language, {
        filenamePrefix: 'satya_ganapati_vrata_devotees',
        year: currentYearVal
      });
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('Export PDF failed:', err);
      showToast('Failed to generate PDF document.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Excel (.xlsx) Downloader
  const handleDownloadCSV = () => {
    if ((filteredParticipants || []).length === 0) {
      showToast('No participants found to download.', 'warning');
      return;
    }

    try {
      exportKatheToExcel(filteredParticipants, language, {
        filenamePrefix: 'satya_ganapati_vrata_list',
        sheetName: 'Satya Ganapati Vrata'
      });
      showToast('Download started!', 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Failed to generate Excel file.', 'error');
    }
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
          {language === 'kn'
            ? 'ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ ಸಾಮೂಹಿಕ ಸಂಕಲ್ಪ ನೋಂದಣಿ ಹಾಗೂ ಭಕ್ತರ ವಿವರ.'
            : 'Sri Satya Ganapati Vrata Mass Sankalpa registration and public directory.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Vrata Details */}
        <div className="bg-white rounded-xl border border-warm-dark p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-accent/20 pb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-charcoal tracking-wide">
              {language === 'kn' ? 'ವ್ರತ ಕಾರ್ಯಕ್ರಮದ ಮಾಹಿತಿ' : 'Vrata Program Information'}
            </h2>
          </div>

          <div className="space-y-4 text-charcoal-light leading-relaxed text-sm sm:text-base font-kannada">
            <div className="bg-amber-50/50 p-4 border border-accent/30 rounded-lg space-y-1">
              <span className="text-xs font-bold text-secondary block uppercase">
                {language === 'kn' ? 'ದಿನಾಂಕ ಮತ್ತು ಸಮಯ' : 'DATE & TIME'}
              </span>
              <span className="font-bold text-primary text-base">{vrataDateStr}</span>
            </div>

            <p>
              {language === 'kn' ? (
                <>
                  {editionText} ವರ್ಷದ ಶ್ರೀ ಗಣೇಶೋತ್ಸವದ ಶುಭ ಸಂದರ್ಭದಲ್ಲಿ, ಸರ್ವರ ಸುಖ-ಶಾಂತಿ, ಸಮೃದ್ಧಿ ಹಾಗೂ ಲೋಕಕಲ್ಯಾಣಕ್ಕಾಗಿ ಶ್ರೀ ಗಣಪತಿ ಸನ್ನಿಧಿಯಲ್ಲಿ{' '}
                  <strong className="text-charcoal font-bold">ಸಾಮೂಹಿಕ ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ</strong>ವನ್ನು ಅತ್ಯಂತ ಶ್ರದ್ಧಾ-ಭಕ್ತಿಗಳಿಂದ ಹಮ್ಮಿಕೊಳ್ಳಲಾಗಿದೆ.
                </>
              ) : (
                <>
                  On the auspicious occasion of the {editionText} Ganeshotsava, we are conducting the{' '}
                  <strong className="text-charcoal font-bold">Mass Sri Satya Ganapati Vrata (ಸಾಮೂಹಿಕ ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತ)</strong> at the Sri Ganapati Sannidhi, for universal peace and community welfare.
                </>
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-warm-dark p-4 rounded-lg flex items-start gap-3 bg-warm/30">
                <Coins className="h-5 w-5 text-accent-dark flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-charcoal block uppercase">
                    {language === 'kn' ? 'ವ್ರತದ ಕಾಣಿಕೆ / ವಂತಿಗೆ' : 'Vrata Contribution'}
                  </span>
                  <span className="font-bold text-primary text-base">
                    {language === 'kn' ? 'ರೂ. 150/-' : 'Rs. 150/-'}
                  </span>
                  <p className="text-xs text-charcoal-light mt-0.5">
                    {language === 'kn'
                      ? 'ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ವ್ರತ ಸಂಕಲ್ಪ ಹಾಗೂ ಮನೆಗೆ ತಲುಪಿಸುವ ಪ್ರಸಾದ ಒಳಗೊಂಡಿದೆ.'
                      : 'Includes Vrata Sankalpa in your name & home-delivered Prasada.'}
                  </p>
                </div>
              </div>

              <div className="border border-warm-dark p-4 rounded-lg flex items-start gap-3 bg-warm/30">
                <Coins className="h-5 w-5 text-accent-dark flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-charcoal block uppercase">
                    {language === 'kn' ? 'ಸೇವಾ ಪೂಜಾ ರಸೀದಿ' : 'Seva Pooja Receipt'}
                  </span>
                  <span className="font-bold text-primary text-base">
                    {language === 'kn' ? 'ರೂ. 50/-' : 'Rs. 50/-'}
                  </span>
                  <p className="text-xs text-charcoal-light mt-0.5">
                    {language === 'kn'
                      ? 'ಹೆಚ್ಚುವರಿ ಸೇವೆ ಮತ್ತು ಕಾಣಿಕೆಗಳಿಗೆ ಪ್ರತ್ಯೇಕ ರಸೀದಿ ನೀಡಲಾಗುವುದು.'
                      : 'Separate receipt issued for additional offerings.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-2">
              <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent-dark" />
                <span>{language === 'kn' ? 'ವ್ರತದ ಪ್ರಸಾದ ಹಾಗೂ ಸಾಮಗ್ರಿಗಳ ಸೇವಾಕರ್ತರು' : 'Sponsor of Vrata Prasada & Items'}</span>
              </h3>
              <p className="text-xs italic text-primary-dark font-medium">
                {language === 'kn'
                  ? 'ಶ್ರೀ ಗಣಪತಿ ಆರ್. ನಾಯ್ಕ, ನಾಜಗಾರ ಕ್ರಾಸ್'
                  : 'Shri Ganapati R. Nayak, Najagara Cross (ಗಣಪತಿ ಆರ್. ನಾಯ್ಕ, ನಾಜಗಾರ ಕ್ರಾಸ್)'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form (Restricted to logged-in Admins/Users) */}
        <div className="bg-white rounded-xl border border-warm-dark p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-warm-dark pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-wide">
              {language === 'kn' ? 'ವ್ರತ ನೋಂದಣಿ' : 'Vrata Registration'}
            </h2>
            <p className="text-xs text-charcoal-light mt-1">
              {language === 'kn'
                ? 'ಮುಂದಿನ ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತಕ್ಕಾಗಿ ಭಕ್ತರ ವಿವರಗಳನ್ನು ನೋಂದಾಯಿಸಿ.'
                : 'Register devotee details for the upcoming Sri Satya Ganapati Vrata.'}
            </p>
          </div>

          {!isAuthenticated ? (
            // Notice card for public users who are not logged in
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-4">
              <Lock className="h-10 w-10 text-amber-600 mx-auto" />
              <h3 className="font-bold text-charcoal">
                {language === 'kn' ? 'ಆಡಳಿತ ಮಂಡಳಿ ನೋಂದಣಿ ಮಾತ್ರ' : 'Administrative Registration Only'}
              </h3>
              <p className="text-xs text-charcoal-light leading-relaxed">
                {language === 'kn'
                  ? 'ನಕಲು ನಮೂದುಗಳನ್ನು ತಡೆಗಟ್ಟಲು ಹಾಗೂ ನಿಖರತೆಯನ್ನು ಕಾಪಾಡಲು, ಶ್ರೀ ಸತ್ಯಗಣಪತಿ ವ್ರತದ ನೋಂದಣಿಯನ್ನು ಸಮಿತಿ ಸದಸ್ಯರು ಅಥವಾ ಆಡಳಿತ ಮಂಡಳಿಯವರು ಮಾತ್ರ ಸಲ್ಲಿಸಬಹುದಾಗಿದೆ.'
                  : 'To prevent duplicate entries and maintain database integrity, Sri Satya Ganapati Vrata registrations can only be submitted by committee members or administrative users.'}
              </p>
              <p className="text-xs font-semibold text-charcoal">
                {language === 'kn'
                  ? 'ಹೊಸ ಕುಟುಂಬಗಳನ್ನು ನೋಂದಾಯಿಸಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬಳಕೆದಾರ ಹೆಸರು ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್‌ನೊಂದಿಗೆ ಲಾಗಿನ್ ಆಗಿ.'
                  : 'Please log in with your unique username and password to register new families.'}
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center bg-primary text-warm text-xs font-bold uppercase px-6 py-2.5 rounded-lg hover:bg-primary-light transition shadow-sm"
              >
                {language === 'kn' ? 'ಲಾಗಿನ್ ಪುಟಕ್ಕೆ ಹೋಗಿ' : 'Go to Login Panel'}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">
                  {language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು (Name)' : 'Devotee Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder={language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು ನಮೂದಿಸಿ / Enter full name' : 'Enter devotee name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">
                    {language === 'kn' ? 'ಮನೆತನ / ಮನೆ ಹೆಸರು' : 'Home / Family Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'kn' ? 'ಉದಾ. ಜ್ಯೋತಿ ನಿಲಯ / Jyothi House' : 'e.g. Jyothi House'}
                    value={homeName}
                    onChange={(e) => setHomeName(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">
                    {language === 'kn' ? 'ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book No)' : 'Book Number'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'kn' ? 'ಉದಾ. Book 12 / Receipt 45' : 'e.g. Book 12 / Receipt 45'}
                    value={bookNo}
                    onChange={(e) => setBookNo(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">
                    {language === 'kn' ? 'ಸ್ಥಳ / ಪ್ರದೇಶ (Area / Place)' : 'Area / Place'} <span className="text-rose-500">*</span>
                  </label>
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
                    <option value="other">
                      {language === 'kn' ? 'ಇತರೆ (ಹೊಸ ಸ್ಥಳ ನಮೂದಿಸಿ) / Other' : 'Other / ಇತರೆ (Enter New Area)'}
                    </option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">
                    {language === 'kn' ? 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ (Phone Number)' : 'Phone Number'} <span className="text-xs font-normal text-charcoal-light">({language === 'kn' ? 'ಐಚ್ಛಿಕ' : 'Optional'})</span>
                  </label>
                  <input
                    type="tel"
                    placeholder={language === 'kn' ? 'ಉದಾ. 9845012345 (ಐಚ್ಛಿಕ)' : 'e.g. 9845012345 (Optional)'}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              {place === 'other' && (
                <div className="space-y-1 bg-amber-50/50 p-3 rounded-lg border border-accent/30 animate-fadeIn">
                  <label className="text-xs font-bold text-charcoal block">
                    {language === 'kn' ? 'ಹೊಸ ಸ್ಥಳ / ಪ್ರದೇಶದ ಹೆಸರು ನಮೂದಿಸಿ' : 'Enter Place / Area Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'kn' ? 'ಉದಾ. ಕುಮಟಾ, ಹೊನ್ನಾವರ, ಗೋಕರ್ಣ ಇತ್ಯಾದಿ' : 'e.g. Kumta, Honnavar, Gokarna etc.'}
                    value={customPlace}
                    onChange={(e) => setCustomPlace(e.target.value)}
                    className="w-full bg-white border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">
                  {language === 'kn' ? 'ವಿಳಾಸ (Address)' : 'Address'}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === 'kn' ? 'ವಿಳಾಸ ನಮೂದಿಸಿ (ಐಚ್ಛಿಕ)' : 'Enter address (optional)'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-warm font-bold py-2.5 rounded-lg hover:bg-primary-light transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {submitting 
                  ? (language === 'kn' ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting...') 
                  : (language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು ನೋಂದಾಯಿಸಿ' : 'Register Devotee')}
                <Send className="h-4 w-4" />
              </button>

              {/* Inline Success Notice (Below Submit Button, Form Stays Visible) */}
              {lastRegisteredName && (
                <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-950 p-3.5 rounded-xl flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
                  <div className="flex items-start gap-2.5 text-xs">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-emerald-900 block text-sm">
                        {language === 'kn' ? 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!' : 'Registration Successful!'}
                      </span>
                      <p className="text-emerald-800 leading-relaxed mt-0.5">
                        {language === 'kn'
                          ? `"${lastRegisteredName}" ಅವರ ಹೆಸರು ಪಟ್ಟಿಗೆ ಸೇರ್ಪಡೆಯಾಗಿದೆ. ಮುಂದಿನ ಭಕ್ತರ ಹೆಸರು ನಮೂದಿಸಬಹುದು.`
                          : `Devotee "${lastRegisteredName}" has been added to the list. You can enter the next devotee now.`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastRegisteredName(null)}
                    className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-emerald-100 transition"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
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
              <span>{language === 'kn' ? 'ನೋಂದಾಯಿತ ಭಕ್ತರ ಪಟ್ಟಿ' : 'Registered Devotees List'}</span>
              <span className="text-xs bg-warm-dark text-primary px-2.5 py-0.5 rounded-full font-bold">
                {participants.length}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-charcoal-light">
                {language === 'kn' 
                  ? 'ಶ್ರೀ ಸತ್ಯ ಗಣಪತಿ ವ್ರತದ ಸಾಮೂಹಿಕ ಸಂಕಲ್ಪದಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳುವ ಭಕ್ತರ ವಿವರಗಳು.'
                  : "Directory of devotees participating in this year's mass Sri Satya Ganapati Vrata."}
              </p>
              {isAuthenticated ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                  <CheckCircle className="h-3 w-3" />
                  {language === 'kn' ? 'ನಿರ್ವಾಹಕ ಮೋಡ್ (ತಿದ್ದುಪಡಿ / ಅಳಿಸುವಿಕೆ ಸಕ್ರಿಯ)' : 'Admin Mode (Edit & Delete Enabled)'}
                </span>
              ) : (
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark underline"
                >
                  <Lock className="h-3 w-3" />
                  {language === 'kn' ? 'ನಿರ್ವಾಹಕರೇ? ತಿದ್ದುಪಡಿ/ಅಳಿಸಲು ಲಾಗಿನ್ ಮಾಡಿ' : 'Admin? Login to Edit or Delete'}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-primary hover:bg-primary-light text-warm px-4 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span>{downloadingPdf ? (language === 'kn' ? 'ಪಿಡಿಎಫ್ ತಯಾರಾಗುತ್ತಿದೆ...' : 'Generating PDF...') : (language === 'kn' ? 'ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್' : 'Download PDF')}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              title={language === 'kn' ? 'ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್' : 'Download Excel Spreadsheet'}
              className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-warm-dark hover:bg-warm-dark/85 text-charcoal px-3 py-2.5 rounded-lg shadow-sm border border-warm-dark transition"
            >
              <Download className="h-4 w-4" />
              <span>{language === 'kn' ? 'ಎಕ್ಸೆಲ್' : 'Excel'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-warm-dark p-4 rounded-xl shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
            <input
              type="text"
              placeholder={language === 'kn' ? 'ಹೆಸರು, ಫೋನ್ ಅಥವಾ ಪುಸ್ತಕ ಸಂಖ್ಯೆಯ ಮೂಲಕ ಹುಡುಕಿ...' : 'Search by name, phone, or Book No...'}
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
              <option value="all">{language === 'kn' ? 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು / ಪ್ರದೇಶಗಳು' : 'All Places / Areas'}</option>
              {places.map(p => (
                <option key={p._id} value={p._id}>
                  {language === 'kn' ? p.nameKannada : p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingList ? (
          <div className="py-12 text-center text-charcoal-light font-semibold">
            {language === 'kn' ? 'ಭಕ್ತರ ಪಟ್ಟಿಯನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading devotee directory...'}
          </div>
        ) : filteredParticipants.length > 0 ? (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                      <th className="p-4">{language === 'kn' ? 'ಕ್ರ.ಸಂ' : 'Sl No'}</th>
                      <th className="p-4">{language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು' : 'Devotee Name'}</th>
                      <th className="p-4">{language === 'kn' ? 'ಸ್ಥಳ / ಪ್ರದೇಶ' : 'Place / Area'}</th>
                      <th className="p-4">{language === 'kn' ? 'ಪುಸ್ತಕ ಸಂಖ್ಯೆ' : 'Book Number'}</th>
                      <th className="p-4">{language === 'kn' ? 'ವರ್ಷ' : 'Year'}</th>
                      <th className="p-4">{language === 'kn' ? 'ಸಂಕಲ್ಪ ಸ್ಥಿತಿ' : 'Sankalpa Status'}</th>
                      {isAuthenticated && <th className="p-4 text-right">{language === 'kn' ? 'ಕ್ರಮಗಳು' : 'Actions'}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-dark text-sm">
                    {filteredParticipants.map((p, index) => (
                      <tr key={p._id} className="hover:bg-warm-dark/10 transition">
                        <td className="p-4 font-bold text-charcoal-light">{index + 1}</td>
                        <td className="p-4 font-bold text-charcoal">
                          <div>
                            {`${p.firstName || ''} ${p.lastName || ''}`.trim()}
                            {p.homeName && <span className="block text-xs font-normal text-charcoal-light">{language === 'kn' ? 'ಮನೆತನ: ' : 'Family: '}{p.homeName}</span>}
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
                        {isAuthenticated && (
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-warm-dark/40 rounded-lg transition border border-primary/20 shadow-sm"
                                title={language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                <span>{language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={() => handleDelete(p._id, `${p.firstName || ''} ${p.lastName || ''}`.trim())}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200 shadow-sm"
                                title={language === 'kn' ? 'ಅಳಿಸಿ' : 'Delete'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{language === 'kn' ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
              {filteredParticipants.map((p, index) => (
                <div key={p._id} className="bg-white border border-warm-dark rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-warm-dark text-charcoal text-[11px] font-bold px-2 py-0.5 rounded-md">
                          #{index + 1}
                        </span>
                        <h4 className="font-bold text-charcoal text-base">
                          {`${p.firstName || ''} ${p.lastName || ''}`.trim()}
                        </h4>
                      </div>
                      {p.homeName && (
                        <p className="text-xs text-charcoal-light mt-0.5">
                          {language === 'kn' ? 'ಮನೆತನ: ' : 'Family: '}<span className="font-semibold text-charcoal">{p.homeName}</span>
                        </p>
                      )}
                    </div>
                    {isAuthenticated && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-warm-dark/40 rounded-lg transition border border-primary/20"
                          title={language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>{language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, `${p.firstName || ''} ${p.lastName || ''}`.trim())}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200"
                          title={language === 'kn' ? 'ಅಳಿಸಿ' : 'Delete'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{language === 'kn' ? 'ಅಳಿಸಿ' : 'Delete'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-warm/60 p-2.5 rounded-lg">
                    <div>
                      <span className="text-charcoal-light block text-[10px] uppercase font-bold">
                        {language === 'kn' ? 'ಸ್ಥಳ / ಪ್ರದೇಶ' : 'Place / Area'}
                      </span>
                      <span className="font-semibold text-charcoal font-kannada flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-accent-dark shrink-0" />
                        {getPlaceName(p.place)}
                      </span>
                    </div>
                    <div>
                      <span className="text-charcoal-light block text-[10px] uppercase font-bold">
                        {language === 'kn' ? 'ಪುಸ್ತಕ ಸಂ.' : 'Book No'}
                      </span>
                      <span className="font-bold text-primary text-sm mt-0.5 block">
                        {p.bookNo || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs border-t border-warm-dark/40">
                    <span className="text-charcoal-light font-medium">
                      {language === 'kn' ? 'ವರ್ಷ: ' : 'Year: '}<strong className="text-charcoal">{p.year}</strong>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                      p.confirmed
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {p.confirmed ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {p.registrationStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light shadow-sm">
            {language === 'kn' ? 'ಯಾವುದೇ ಭಕ್ತರ ವಿವರಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No registered devotees found matching your criteria.'}
          </div>
        )}
      </div>

      {/* Admin Edit Kathe Participant Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8 relative border border-warm-dark">
            <div className="flex justify-between items-center border-b border-warm-dark pb-3 mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-accent-dark" />
                <span>{language === 'kn' ? 'ಭಕ್ತರ ವಿವರಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಿ' : 'Edit Devotee Details'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-charcoal-light hover:text-charcoal transition p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              {/* Devotee Name & Family Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ಭಕ್ತರ ಹೆಸರು (Devotee Name) *' : 'Devotee Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ಮನೆಯ ಹೆಸರು (Family / House Name)' : 'Family / House Name'}
                  </label>
                  <input
                    type="text"
                    value={editHomeName}
                    onChange={(e) => setEditHomeName(e.target.value)}
                    placeholder="e.g. Kadur / Badiger"
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Place / Area */}
              <div className="space-y-1">
                <label className="font-bold text-xs block text-charcoal">
                  {language === 'kn' ? 'ಸ್ಥಳ / ಪ್ರದೇಶ (Place / Area) *' : 'Place / Area *'}
                </label>
                <select
                  required
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
                    {language === 'kn' ? 'ಹೊಸ ಪ್ರದೇಶದ ಹೆಸರು ನಮೂದಿಸಿ *' : 'Enter Custom Area / Place Name *'}
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
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ಪುಸ್ತಕ ಸಂಖ್ಯೆ (Book Number)' : 'Book Number'}
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
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ (Phone Number)' : 'Phone Number'}
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
                <label className="font-bold text-xs block text-charcoal">
                  {language === 'kn' ? 'ವಿಳಾಸ (Address)' : 'Address'}
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
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ವರ್ಷ (Year)' : 'Year'}
                  </label>
                  <input
                    type="text"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-xl p-2.5 outline-none focus:border-accent font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-xs block text-charcoal">
                    {language === 'kn' ? 'ಸಂಕಲ್ಪ ಸ್ಥಿತಿ (Sankalpa Status)' : 'Sankalpa Status'}
                  </label>
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
                  {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 bg-primary text-warm font-bold rounded-xl hover:bg-primary-light transition shadow disabled:opacity-50"
                >
                  {savingEdit 
                    ? (language === 'kn' ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') 
                    : (language === 'kn' ? 'ಬದಲಾವಣೆ ಉಳಿಸಿ' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
