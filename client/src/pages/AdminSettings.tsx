import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Settings, ShieldAlert, Save, Shirt, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [prasadaDeliveryOpen, setPrasadaDeliveryOpen] = useState(false);
  const [tshirtSectionEnabled, setTshirtSectionEnabled] = useState(true);

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
        setPrasadaDeliveryOpen(s.prasadaDeliveryOpen === true || s.prasadaDeliveryOpen === 'true');
        setTshirtSectionEnabled(s.tshirtSectionEnabled !== false && s.tshirtSectionEnabled !== 'false');
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
        prasadaSponsor,
        prasadaDeliveryOpen,
        tshirtSectionEnabled
      });
      if (res.data.status === 'success') {
        showToast('System settings updated successfully!');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update settings.', 'error');
    }
  };

  const handleClearAllTshirts = async () => {
    if (!isSuperAdmin) {
      showToast('Only Super Administrators can clear records.', 'error');
      return;
    }
    const confirmText = prompt(
      'WARNING: This will permanently delete ALL recorded T-shirt sizes for the active year.\n\nType "CLEAR" to confirm:'
    );
    if (confirmText !== 'CLEAR') {
      showToast('Action cancelled.');
      return;
    }

    try {
      const res = await api.delete('/tshirt/clear/all');
      if (res.data.status === 'success') {
        showToast(res.data.message || 'All T-shirt orders cleared successfully!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to clear T-shirt orders.', 'error');
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

              <div className="space-y-1">
                <label className="font-bold text-xs block">Prasada Delivery Operations Status</label>
                <select
                  disabled={!isSuperAdmin}
                  value={prasadaDeliveryOpen ? 'OPEN' : 'CLOSED'}
                  onChange={(e) => setPrasadaDeliveryOpen(e.target.value === 'OPEN')}
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2.5 outline-none disabled:opacity-50 font-bold"
                >
                  <option value="OPEN">OPEN (ವಿತರಣೆ ಮುಕ್ತ - Admins can update status)</option>
                  <option value="CLOSED">CLOSED (ವಿತರಣೆ ಮುಚ್ಚಿದೆ - Status updates locked)</option>
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

          {/* Temporary Member T-Shirt Module Section */}
          <div className="bg-white border border-warm-dark rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-warm-dark pb-3">
              <div className="flex items-center gap-2">
                <Shirt className="h-5 w-5 text-accent-dark" />
                <div>
                  <h2 className="font-bold text-charcoal text-base">Temporary Member T-Shirt Module (ತಾತ್ಕಾಲಿಕ ಟಿ-ಶರ್ಟ್ ವಿಭಾಗ)</h2>
                  <p className="text-xs text-charcoal-light">Manage visibility, access, and records for the member T-shirt campaign.</p>
                </div>
              </div>
              <Link
                to="/tshirt"
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Open Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-warm p-3 rounded-lg border border-warm-dark">
                <div>
                  <span className="text-xs font-bold text-charcoal block">Enable T-Shirt Section in Website (ಟಿ-ಶರ್ಟ್ ವಿಭಾಗ ಸಕ್ರಿಯಗೊಳಿಸಿ)</span>
                  <span className="text-[11px] text-charcoal-light">
                    When enabled, the T-Shirt link is visible in the Navbar & Mobile Drawer. When disabled, it is hidden from public navigation.
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={tshirtSectionEnabled}
                  onChange={(e) => setTshirtSectionEnabled(e.target.checked)}
                  className="h-5 w-5 accent-primary cursor-pointer disabled:opacity-50"
                />
              </div>

              {isSuperAdmin && (
                <div className="flex items-center justify-between pt-2 border-t border-warm-dark">
                  <span className="text-xs text-rose-800 font-medium">
                    Need to remove all T-shirt records for a fresh campaign?
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllTshirts}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All T-Shirts</span>
                  </button>
                </div>
              )}
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
