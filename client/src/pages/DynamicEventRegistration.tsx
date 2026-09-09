import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowLeft,
  Calendar,
  Layers,
  User,
  Phone,
  Home,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { CustomEventItem } from './AdminCustomEvents';

export const DynamicEventRegistration: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<CustomEventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [homeName, setHomeName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get(`/custom-events/slug/${slug}`);
      if (res.data.status === 'restricted') {
        setIsRestricted(true);
        setEvent(res.data.event);
      } else if (res.data.status === 'success') {
        setEvent(res.data.event);
        if (res.data.event.categoryOptions?.length > 0) {
          setCategory(res.data.event.categoryOptions[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('Event not found or failed to load.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.' : 'Please enter your name.',
        'warning'
      );
      return;
    }

    if (!event) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
        homeName: homeName.trim(),
        category: category.trim(),
        quantity: event.enableQuantity ? Math.max(1, quantity || 1) : 1,
        notes: notes.trim(),
      };

      const res = await api.post(`/custom-events/${event._id}/registrations`, payload);
      if (res.data.status === 'success') {
        setSubmittedSuccess(res.data.registration);
        showToast(
          language === 'kn'
            ? 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ!'
            : 'Registration recorded successfully!',
          'success'
        );
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to submit registration.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-charcoal-light font-semibold">
        {language === 'kn' ? 'ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading event registration...'}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-charcoal font-kannada">
          {language === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ಕಂಡುಬಂದಿಲ್ಲ' : 'Event Not Found'}
        </h2>
        <p className="text-xs text-charcoal-light">
          {language === 'kn'
            ? 'ನೀವು ಹುಡುಕುತ್ತಿರುವ ಕಾರ್ಯಕ್ರಮ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ತೆಗೆದುಹಾಕಲಾಗಿದೆ.'
            : 'The requested event is not available or has been removed.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-warm font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'kn' ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Return Home'}</span>
        </Link>
      </div>
    );
  }

  // Access Permission Restricted: ADMIN_ONLY
  if (isRestricted && !isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center mx-auto border border-indigo-200 shadow-sm">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-primary font-kannada">
            {event.titleKannada}
          </h1>
          <h2 className="text-sm font-bold text-charcoal">{event.title}</h2>
        </div>
        <div className="bg-white border border-warm-dark rounded-2xl p-6 shadow-sm space-y-3">
          <span className="font-bold text-sm text-charcoal block">
            {language === 'kn'
              ? 'ಈ ಕಾರ್ಯಕ್ರಮದ ನೋಂದಣಿಯನ್ನು ಸಮಿತಿ ವತಿಯಿಂದ ನೇರವಾಗಿ ನಿರ್ವಹಿಸಲಾಗುತ್ತಿದೆ.'
              : 'This registration is restricted to committee organizers.'}
          </span>
          <p className="text-xs text-charcoal-light leading-relaxed">
            {language === 'kn'
              ? 'ಹೆಚ್ಚಿನ ವಿವರ ಹಾಗೂ ನೋಂದಣಿಗಾಗಿ ದಯವಿಟ್ಟು ಗಣೇಶೋತ್ಸವ ಸೇವಾ ಸಮಿತಿಯ ಸದಸ್ಯರನ್ನು ಅಥವಾ ಸಂಘಟಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
              : 'For participation and registration details, please contact the Ganeshotsava Seva Samiti members.'}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-warm font-bold text-xs rounded-xl hover:bg-primary-light transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'kn' ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Return to Home'}</span>
        </Link>
      </div>
    );
  }

  // Event Closed Notice
  if (event.status === 'CLOSED') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-primary font-kannada">
            {event.titleKannada}
          </h1>
          <h2 className="text-sm font-bold text-charcoal">{event.title}</h2>
        </div>
        <div className="bg-white border border-warm-dark rounded-2xl p-6 shadow-sm space-y-2">
          <span className="font-bold text-sm text-rose-800 block">
            {language === 'kn' ? 'ನೋಂದಣಿ ಮುಕ್ತಾಯಗೊಂಡಿದೆ' : 'Registrations Closed'}
          </span>
          <p className="text-xs text-charcoal-light leading-relaxed">
            {language === 'kn'
              ? 'ಈ ಕಾರ್ಯಕ್ರಮದ ನೋಂದಣಿ ಪ್ರಕ್ರಿಯೆ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ಸಂಘಟಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
              : 'Registration has concluded for this event. Please contact the organizers for more info.'}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-warm font-bold text-xs rounded-xl hover:bg-primary-light transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'kn' ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Return to Home'}</span>
        </Link>
      </div>
    );
  }

  // Registration Submitted Success View
  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-scaleUp">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="h-9 w-9" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-primary font-kannada">
            {language === 'kn' ? 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!' : 'Registration Successful!'}
          </h1>
          <p className="text-xs text-charcoal-light">
            {language === 'kn'
              ? `${event.titleKannada} ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ನಿಮ್ಮ ವಿವರಗಳು ದಾಖಲಾಗಿವೆ.`
              : `Your details have been recorded for ${event.title}.`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-warm-dark p-6 text-left space-y-3 shadow-sm text-sm">
          <div className="flex justify-between border-b border-warm-dark pb-2">
            <span className="text-xs text-charcoal-light">ಹೆಸರು (Name):</span>
            <span className="font-extrabold text-charcoal">{submittedSuccess.name}</span>
          </div>
          {submittedSuccess.category && (
            <div className="flex justify-between border-b border-warm-dark pb-2">
              <span className="text-xs text-charcoal-light">ವರ್ಗ (Category):</span>
              <span className="font-bold text-primary">{submittedSuccess.category}</span>
            </div>
          )}
          {submittedSuccess.homeName && (
            <div className="flex justify-between border-b border-warm-dark pb-2">
              <span className="text-xs text-charcoal-light">ಮನೆತನ (Home):</span>
              <span className="font-medium text-charcoal">{submittedSuccess.homeName}</span>
            </div>
          )}
          {submittedSuccess.quantity > 1 && (
            <div className="flex justify-between border-b border-warm-dark pb-2">
              <span className="text-xs text-charcoal-light">ಸಂಖ್ಯೆ (Qty):</span>
              <span className="font-bold text-charcoal">{submittedSuccess.quantity}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmittedSuccess(null);
              setName('');
              setPhone('');
              setHomeName('');
              setNotes('');
            }}
            className="px-5 py-2.5 bg-primary hover:bg-primary-light text-warm font-bold text-xs rounded-xl shadow-xs transition"
          >
            {language === 'kn' ? 'ಮತ್ತೊಂದು ನೋಂದಣಿ ಮಾಡಿ' : 'Register Another Person'}
          </button>

          <Link
            to="/"
            className="px-5 py-2.5 bg-warm hover:bg-warm-dark border border-warm-dark text-charcoal font-bold text-xs rounded-xl transition"
          >
            {language === 'kn' ? 'ಮುಖಪುಟ' : 'Home'}
          </Link>
        </div>
      </div>
    );
  }

  // Public Registration Form
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Event Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-dark text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>{language === 'kn' ? 'ವಿಶೇಷ ನೋಂದಣಿ' : 'Special Registration'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-kannada">
          {event.titleKannada}
        </h1>
        <h2 className="text-sm sm:text-base font-bold text-charcoal">{event.title}</h2>
        {event.description && (
          <p className="text-xs sm:text-sm text-charcoal-light max-w-lg mx-auto leading-relaxed pt-1">
            {event.description}
          </p>
        )}
      </div>

      {/* Admin Quick Link if logged in */}
      {isAuthenticated && (
        <div className="bg-accent/15 border border-accent/40 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="font-bold text-primary flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-accent-dark" />
            <span>Admin Mode Active</span>
          </span>
          <Link
            to={`/admin/custom-events/${event._id}`}
            className="font-extrabold text-primary hover:underline"
          >
            Open Admin Roster & Download PDF &rarr;
          </Link>
        </div>
      )}

      {/* Registration Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border-2 border-accent/40 p-5 sm:p-8 shadow-md space-y-5"
      >
        <div className="border-b border-warm-dark pb-3">
          <h3 className="font-extrabold text-charcoal text-base">
            {language === 'kn' ? 'ನೋಂದಣಿ ನಮೂನೆ (Registration Form)' : 'Participant Registration'}
          </h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            {language === 'kn' ? 'ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.' : 'Please fill in participant details.'}
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-charcoal block">
            {language === 'kn' ? 'ಭಾಗವಹಿಸುವವರ ಪೂರ್ಣ ಹೆಸರು' : 'Participant Full Name'}{' '}
            <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={language === 'kn' ? 'ಉದಾ. ಗಣೇಶ ನಾಯ್ಕ' : 'e.g. Ganesh Nayak'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-warm border border-warm-dark rounded-xl px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-accent"
          />
        </div>

        {/* Mobile & Home */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal block">
              {language === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Phone)' : 'Mobile Phone'}
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-warm border border-warm-dark rounded-xl px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal block">
              {language === 'kn' ? 'ಮನೆತನ / ವಿಳಾಸ (Home / Address)' : 'Home / Address'}
            </label>
            <input
              type="text"
              placeholder={language === 'kn' ? 'ಉದಾ. ನಾಜಗಾರ ಕ್ರಾಸ್' : 'e.g. Najagara Cross'}
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              className="w-full bg-warm border border-warm-dark rounded-xl px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Categories if configured */}
        {event.categoryOptions && event.categoryOptions.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-charcoal block">
              {language === 'kn' ? 'ವರ್ಗ / ಆಯ್ಕೆ (Category / Option)' : 'Select Category / Option'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {event.categoryOptions.map((opt) => {
                const isSel = category === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCategory(opt)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-extrabold transition cursor-pointer ${
                      isSel
                        ? 'bg-accent text-primary-dark border-accent-dark shadow-xs ring-2 ring-accent/40'
                        : 'bg-warm hover:bg-warm-dark border-warm-dark text-charcoal'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity if enabled */}
        {event.enableQuantity && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-charcoal block">
              {language === 'kn' ? 'ಸಂಖ್ಯೆ (Quantity / Count)' : 'Quantity / Count'}
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-24 bg-warm border border-warm-dark rounded-xl px-3.5 py-2 text-sm font-bold text-primary outline-none focus:border-accent"
            />
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-charcoal block">
            {language === 'kn' ? 'ಹೆಚ್ಚುವರಿ ವಿವರ / ಟಿಪ್ಪಣಿ (Notes / Remarks)' : 'Additional Notes (Optional)'}
          </label>
          <input
            type="text"
            placeholder={language === 'kn' ? 'ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ...' : 'Optional notes...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-warm border border-warm-dark rounded-xl px-3.5 py-2 text-xs text-charcoal outline-none focus:border-accent"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary hover:bg-primary-light text-warm font-extrabold text-sm sm:text-base rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle className="h-5 w-5 text-accent" />
            <span>
              {submitting
                ? language === 'kn'
                  ? 'ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ...'
                  : 'Submitting...'
                : language === 'kn'
                ? 'ನೋಂದಣಿ ಸಲ್ಲಿಸಿ (Submit Registration)'
                : 'Submit Registration'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
