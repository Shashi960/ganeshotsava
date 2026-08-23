import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Settings, ShieldAlert, Save } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // Settings states
  const [festivalName, setFestivalName] = useState('');
  const [currentYear, setCurrentYear] = useState('2025');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [financialVisibility, setFinancialVisibility] = useState('PUBLIC');
  const [memberPrivacy, setMemberPrivacy] = useState('HIDE_CONTACT');
  const [idolSponsor, setIdolSponsor] = useState('');
  const [annasantharpaneSponsor, setAnnasantharpaneSponsor] = useState('');
  const [bhajansSponsor, setBhajansSponsor] = useState('');
  const [samuvasadaSponsor, setSamuvasadaSponsor] = useState('');
  const [prasadaSponsor, setPrasadaSponsor] = useState('');

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data.status === 'success') {
        const s = res.data.settings;
        setFestivalName(s.festivalName || '');
        setCurrentYear(s.currentYear || '2025');
        setContactPhone(s.contactPhone || '');
        setContactEmail(s.contactEmail || '');
        setFinancialVisibility(s.financialVisibility || 'PUBLIC');
        setMemberPrivacy(s.memberPrivacy || 'HIDE_CONTACT');
        setIdolSponsor(s.idolSponsor || '');
        setAnnasantharpaneSponsor(s.annasantharpaneSponsor || '');
        setBhajansSponsor(s.bhajansSponsor || '');
        setSamuvasadaSponsor(s.samuvasadaSponsor || '');
        setPrasadaSponsor(s.prasadaSponsor || '');
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Only Super Administrators can update settings.', 'error');
      return;
    }

    try {
      const res = await api.put('/settings/edit', {
        festivalName,
        currentYear,
        contactPhone,
        contactEmail,
        financialVisibility,
        memberPrivacy,
        idolSponsor,
        annasantharpaneSponsor,
        bhajansSponsor,
        samuvasadaSponsor,
        prasadaSponsor
      });
      if (res.data.status === 'success') {
        showToast('System settings updated successfully!');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update settings.', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-warm-dark pb-4">
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <Settings className="h-7 w-7 text-accent-dark" />
          <span>System Configurations</span>
        </h1>
        <p className="text-xs text-charcoal-light">Manage core configurations for Ganeshotsava Community platform.</p>
      </div>

      {!isSuperAdmin && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-xs block uppercase">Access Restricted</span>
            <p className="text-xs">Only Super Administrators can modify settings. Ordinary administrators have read-only access.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-charcoal-light font-semibold">Loading system settings...</div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-warm-dark p-6 space-y-6 shadow-sm text-sm text-charcoal">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-xs block">Festival Title Name</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={festivalName}
                onChange={(e) => setFestivalName(e.target.value)}
                className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-xs block">Current Operational Year</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs block">Financial Ledger Visibility</label>
                <select
                  disabled={!isSuperAdmin}
                  value={financialVisibility}
                  onChange={(e) => setFinancialVisibility(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none disabled:opacity-50"
                >
                  <option value="PUBLIC">PUBLIC (Everyone can view)</option>
                  <option value="ADMIN_ONLY">ADMINS ONLY</option>
                  <option value="SUPER_ADMIN_ONLY">SUPER ADMINS ONLY</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-xs block">Member Directory Contacts Privacy</label>
                <select
                  disabled={!isSuperAdmin}
                  value={memberPrivacy}
                  onChange={(e) => setMemberPrivacy(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none disabled:opacity-50"
                >
                  <option value="SHOW_ALL">SHOW ALL (Expose phone & email to public)</option>
                  <option value="HIDE_CONTACT">HIDE CONTACT (Hide phone & email from public)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-xs block">Office Phone Contact</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs block">Office Email Contact</label>
                <input
                  type="email"
                  disabled={!isSuperAdmin}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>
            </div>

            <div className="border-t border-warm-dark pt-4 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-accent-dark">Brochure Sponsors Highlights</h3>
              
              <div className="space-y-1">
                <label className="font-bold text-xs block">Idol Sponsor (ಗಣಪತಿ ಮೂರ್ತಿ ಸೇವಾದಾರರು)</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  placeholder="e.g. Rekha & Ganesh Nagesh Nayak..."
                  value={idolSponsor}
                  onChange={(e) => setIdolSponsor(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs block">Annasantharpane Sponsor (ಅನ್ನ ಸಂತರ್ಪಣಾ ಸೇವಾದಾರರು)</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  placeholder="e.g. Rajeesh Nagesh Nayak & Family..."
                  value={annasantharpaneSponsor}
                  onChange={(e) => setAnnasantharpaneSponsor(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs block">Bhajans Sponsor (ಭಜನಾ ಕಾರ್ಯಕ್ರಮದ ಪ್ರಾಯೋಜಕರು)</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  placeholder="e.g. Thimmappa Acharya & Maruti Acharya..."
                  value={bhajansSponsor}
                  onChange={(e) => setBhajansSponsor(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs block">Samuvasada Sponsor (ಸಮುವಸದ ಪ್ರಾಯೋಜಕರು)</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  placeholder="e.g. Akshaya Acharya Salebail..."
                  value={samuvasadaSponsor}
                  onChange={(e) => setSamuvasadaSponsor(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs block">Vrata Prasada Sponsor (ಸತ್ಯ ಗಣಪತಿ ವ್ರತದ ಪ್ರಸಾದ ಹಾಗೂ ಪೂಜಾ ಸೇವಾದಾರರು)</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  placeholder="e.g. Ganapati R. Nayak..."
                  value={prasadaSponsor}
                  onChange={(e) => setPrasadaSponsor(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex justify-end pt-4 border-t border-warm-dark">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-primary text-warm font-bold px-6 py-2.5 rounded-lg hover:bg-primary-light transition shadow transform hover:-translate-y-0.5"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
