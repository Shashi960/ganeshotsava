import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { BookOpen, MapPin, Compass, Award, Building, Sparkles } from 'lucide-react';

interface FinancialRecord {
  _id: string;
  category: string;
  description: string;
  amount: number;
  type: string;
}

export const AboutView: React.FC = () => {
  const { language, t } = { ...useLanguage() };
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [archivedYear, setArchivedYear] = useState('2025');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    // Get current operational year and query preceding year's accounts
    api.get('/settings').then((settingsRes) => {
      let activeYear = '2026';
      if (settingsRes.data.status === 'success' && settingsRes.data.settings) {
        setSettings(settingsRes.data.settings);
        if (settingsRes.data.settings.currentYear) {
          activeYear = settingsRes.data.settings.currentYear;
        }
      }
      
      const prevYear = (parseInt(activeYear) - 1).toString();
      setArchivedYear(prevYear);

      return api.get(`/financials?year=${prevYear}`);
    }).then((res) => {
      if (res && res.data.status === 'success') {
        setFinancials(res.data.financials);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load dynamic financials:', err);
      setLoading(false);
    });
  }, []);

  const incomeRecords = financials.filter(f => f.type === 'INCOME' && f.category !== 'Donor Listing');
  const expenseRecords = financials.filter(f => f.type === 'EXPENSE');
  const donorRecords = financials.filter(f => f.category === 'Donor Listing');

  const totalIncome = incomeRecords.reduce((acc, cur) => acc + cur.amount, 0);
  const totalExpense = expenseRecords.reduce((acc, cur) => acc + cur.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12 pb-24">
      {/* 1. History & Introduction */}
      <section className="bg-white rounded-xl border border-warm-dark p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-6 bg-accent-dark rounded-full"></span>
            <span className="text-xs font-bold text-accent-dark uppercase tracking-widest font-sanskrit">ESTABLISHED 1991</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
            About Ganeshotsava Community
          </h1>
          <div className="text-charcoal-light space-y-4 text-sm sm:text-base leading-relaxed font-kannada">
            <p>
              {t('aboutIntroPart1')}
            </p>
            <p>
              {t('aboutIntroPart2')}
            </p>
          </div>
        </div>

        <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 space-y-4">
          <h3 className="font-bold text-primary text-lg flex items-center gap-1.5 border-b border-primary/15 pb-2">
            <Sparkles className="h-5 w-5 text-accent-dark" /> Sponsor Highlights
          </h3>
          
          <div className="space-y-3 font-kannada text-xs sm:text-sm text-charcoal">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase block">Idol Sponsor (ಗಣಪತಿ ಮೂರ್ತಿ ಸೇವಾದಾರರು)</span>
              <p className="font-bold text-charcoal-dark leading-snug">{settings.idolSponsor || "ಶ್ರೀಮತಿ ರೇಖಾ ಮತ್ತು ಗಣೇಶ ನಾಗೇಶ ನಾಯ್ಕ, ನಾಜಗಾರ (ಪ್ರಭಾತನಗರ, ಹೊನ್ನಾವರ)"}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase block">Annasantharpane Sponsor (ಅನ್ನ ಸಂತರ್ಪಣಾ ಸೇವಾದಾರರು)</span>
              <p className="font-bold text-charcoal-dark leading-snug">{settings.annasantharpaneSponsor || "ರಾಜೀಶ ನಾಗೇಶ ನಾಯ್ಕ ಹಾಗೂ ಕುಟುಂಬದವರು, ನಾಜಗಾರ (ಪ್ರಭಾತನಗರ, ಹೊನ್ನಾವರ)"}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase block">Bhajans Sponsor (ಭಜನಾ ಕಾರ್ಯಕ್ರಮದ ಪ್ರಾಯೋಜಕರು)</span>
              <p className="font-bold text-charcoal-dark leading-snug">{settings.bhajansSponsor || "ತಿಮ್ಮಪ್ಪ ಆಚಾರ್ಯ ಹಾಗೂ ಮಾಯಿತಿ ಆಚಾರ್ಯ, ಸಾಲೇಬೈಲ್"}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase block">Samuvasada Sponsor (ಸಮುವಸದ ಪ್ರಾಯೋಜಕರು)</span>
              <p className="font-bold text-charcoal-dark leading-snug">{settings.samuvasadaSponsor || "ಅಕ್ಷಯ್ಯ ಆಚಾರ್ಯ ಸಾಲೇಬೈಲ್ ಹಾಗೂ __________________"}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase block">Vrata Prasada Sponsor (ಸತ್ಯ ಗಣಪತಿ ವ್ರತದ ಪ್ರಸಾದ ಹಾಗೂ ಪೂಜಾ ಸೇವಾದಾರರು)</span>
              <p className="font-bold text-charcoal-dark leading-snug">{settings.prasadaSponsor || "ಗಣಪತಿ ಆರ್. ನಾಯ್ಕ, ನಾಗೇಶ್ವರ ಕ್ರಾಸ್"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Values Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-warm-dark p-6 shadow-sm space-y-2">
          <div className="h-10 w-10 bg-accent/15 text-accent-dark rounded-lg flex items-center justify-center mb-2">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-charcoal text-base">Community Cohesion</h3>
          <p className="text-xs sm:text-sm text-charcoal-light leading-relaxed">
            Bringing families from Najagara, Najagara Cross, Salebail, Kelaginuru, and Karki under one cultural roof.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-warm-dark p-6 shadow-sm space-y-2">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-2">
            <Building className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-charcoal text-base">Cultural Legacy</h3>
          <p className="text-xs sm:text-sm text-charcoal-light leading-relaxed">
            Passing on values through Spot drawing/painting and junior devotional Bhakti Geethe singing events.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-warm-dark p-6 shadow-sm space-y-2">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg flex items-center justify-center mb-2">
            <Award className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-charcoal text-base">Financial Integrity</h3>
          <p className="text-xs sm:text-sm text-charcoal-light leading-relaxed">
            Publishing full audited balance sheets and auction earnings for public inspection every year.
          </p>
        </div>
      </section>

      {/* 3. Traditional Financial Statements */}
      <section className="space-y-4">
        <div className="border-b border-accent/20 pb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-primary tracking-wide">
            Annual Financial Accounts ({archivedYear})
          </h2>
          <p className="text-xs text-charcoal-light font-kannada">Audited statement of receipts and expenditures from the brochure</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-charcoal-light">Loading financial statement...</div>
        ) : financials.length > 0 ? (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white rounded-xl border border-warm-dark shadow-sm overflow-hidden p-4">
              {/* Income Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded text-sm uppercase tracking-wider flex justify-between">
                  <span>{t('income')} (Receipts)</span>
                  <span>₹{totalIncome.toLocaleString()}</span>
                </h3>
                
                <div className="border border-warm-dark rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-warm-dark/30 border-b border-warm-dark font-bold text-charcoal">
                        <th className="p-2">Category</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-dark font-kannada">
                      {incomeRecords.map(inc => (
                        <tr key={inc._id} className="hover:bg-warm-dark/10">
                          <td className="p-2 font-bold text-charcoal">{inc.category}</td>
                          <td className="p-2 text-charcoal-light">{inc.description}</td>
                          <td className="p-2 text-right font-extrabold text-charcoal">₹{inc.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded text-sm uppercase tracking-wider flex justify-between">
                  <span>{t('expense')} (Expenditures)</span>
                  <span>₹{totalExpense.toLocaleString()}</span>
                </h3>

                <div className="border border-warm-dark rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-warm-dark/30 border-b border-warm-dark font-bold text-charcoal">
                        <th className="p-2">Category</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-dark font-kannada">
                      {expenseRecords.map(exp => (
                        <tr key={exp._id} className="hover:bg-warm-dark/10">
                          <td className="p-2 font-bold text-charcoal">{exp.category}</td>
                          <td className="p-2 text-charcoal-light">{exp.description}</td>
                          <td className="p-2 text-right font-extrabold text-charcoal">₹{exp.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Prominent Donors Grid (Image 5) */}
            {donorRecords.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-accent/20 pb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-primary tracking-wide">
                    Prominent Donors List ({archivedYear})
                  </h3>
                  <p className="text-xs text-charcoal-light font-kannada">Devotees who made contributions of Rs. 500 and above in 2025</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white rounded-xl border border-warm-dark p-6 shadow-sm">
                  {donorRecords.map((d, index) => (
                    <div key={d._id} className="flex justify-between items-center p-3 bg-warm rounded-lg border border-warm-dark font-kannada text-xs sm:text-sm">
                      <span className="font-bold text-charcoal leading-snug">{index + 1}. {d.description}</span>
                      <span className="font-extrabold text-primary flex-shrink-0 ml-4">₹{d.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-warm-dark p-8 text-center text-charcoal-light">
            Financial statement is configured as hidden by the Administrator.
          </div>
        )}
      </section>
    </div>
  );
};
