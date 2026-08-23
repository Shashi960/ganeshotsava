import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { Award, CheckCircle, Clock, CircleDollarSign } from 'lucide-react';

interface AuctionItem {
  _id: string;
  itemName: string;
  itemNameKannada: string;
  buyer?: string;
  amount: number;
  paymentStatus: string;
  paymentDate?: string;
}

export const AuctionView: React.FC = () => {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    let url = '/auction';
    if (statusFilter !== 'all') {
      url += `?paymentStatus=${statusFilter}`;
    }
    api.get(url).then(res => {
      if (res.data.status === 'success') {
        setItems(res.data.auctions);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [statusFilter]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'UNPAID':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-wide">
          {t('navAuction')}
        </h1>
        <p className="text-charcoal-light max-w-lg mx-auto text-sm sm:text-base">
          View community auction items, buyers, final bids, and payment status.
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-center border-b border-warm-dark pb-4 gap-2">
        {['all', 'PAID', 'UNPAID', 'PARTIALLY_PAID'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
              statusFilter === st
                ? 'bg-primary text-warm border border-primary'
                : 'bg-warm-dark hover:bg-warm-dark/80 text-charcoal border border-transparent'
            }`}
          >
            {st === 'all' ? 'All Items' : st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal-light">Loading auction ledger...</div>
      ) : items.length > 0 ? (
        <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                  <th className="p-4">Item Name / ಹರಾಜು ಸಾಮಾನು</th>
                  <th className="p-4">Winner / ಕೊಳ್ಳುಗರು</th>
                  <th className="p-4">Final Bid Amount</th>
                  <th className="p-4">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark text-sm">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-warm-dark/10 transition">
                    <td className="p-4 font-bold text-charcoal font-kannada">
                      {language === 'kn' ? item.itemNameKannada : item.itemName}
                    </td>
                    <td className="p-4 font-semibold text-charcoal-light">
                      {item.buyer || 'Anonymous Devotee'}
                    </td>
                    <td className="p-4 font-extrabold text-primary">
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusStyle(item.paymentStatus)}`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-warm-dark p-12 text-center text-charcoal-light font-semibold">
          No auction items found matching the selected filter.
        </div>
      )}
    </div>
  );
};
