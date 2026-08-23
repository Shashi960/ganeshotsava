import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { BookOpen, Sparkles, Check, Send, Coins, HelpCircle } from 'lucide-react';

interface Place {
  _id: string;
  name: string;
  nameKannada: string;
}

export const KatheView: React.FC = () => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  
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
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
  }, [language]);

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
        notes,
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
        setNotes('');
      }
    } catch (error) {
      console.error(error);
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navKathe')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          Join the community for the Mass Sri Satya Ganapati Vrata.
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

        {/* Right Column: Public Registration Form */}
        <div className="bg-white rounded-xl border border-warm-dark p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-warm-dark pb-4">
            <h2 className="text-xl font-bold text-charcoal tracking-wide">
              Vrata Registration
            </h2>
            <p className="text-xs text-charcoal-light mt-1">
              Submit your family details to participate in the mass Sankalpa.
            </p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-lg text-center space-y-3">
              <div className="h-12 w-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg">Registration Submitted!</h3>
              <p className="text-sm">
                Thank you for registering. The committee will perform the Vrata Sankalpa under your family name on **{vrataDateStr.split(' ')[0]}**. Prasada will be sent to your address.
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Home / Family Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jyothi Home"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                />
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Special Notes / Sankalpa Details</label>
                <textarea
                  rows={2}
                  placeholder="Mention gothra, nakshatra or special wishes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-warm font-bold py-2.5 rounded-lg hover:bg-primary-light transition flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Registration'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
