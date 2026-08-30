import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

interface AuctionItem {
  _id: string;
  itemName: string;
  itemNameKannada: string;
  buyer?: string;
  amount: number;
  paymentStatus: string;
  paymentDate?: string;
}

export const AdminAuction: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AuctionItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemNameKannada, setItemNameKannada] = useState('');
  const [buyer, setBuyer] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auction');
      if (res.data.status === 'success') {
        setItems(res.data.auctions);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch auction items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemName('');
    setItemNameKannada('');
    setBuyer('');
    setAmount('');
    setPaymentStatus('UNPAID');
    setShowModal(true);
  };

  const handleOpenEdit = (item: AuctionItem) => {
    setEditingItem(item);
    setItemName(item.itemName);
    setItemNameKannada(item.itemNameKannada);
    setBuyer(item.buyer || '');
    setAmount(item.amount);
    setPaymentStatus(item.paymentStatus);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemNameKannada || amount === '') {
      showToast('Please fill in required fields.', 'warning');
      return;
    }

    const payload = {
      itemName,
      itemNameKannada,
      buyer: buyer || undefined,
      amount: Number(amount),
      paymentStatus
    };

    try {
      if (editingItem) {
        // Edit Item
        const res = await api.put(`/auction/${editingItem._id}`, payload);
        if (res.data.status === 'success') {
          showToast('Auction item updated successfully!', 'success');
          setItems(prev => prev.map(item => item._id === editingItem._id ? res.data.auction : item));
        }
      } else {
        // Add Item
        const res = await api.post('/auction', payload);
        if (res.data.status === 'success') {
          showToast('Auction item added successfully!', 'success');
          setItems(prev => [res.data.auction, ...prev]);
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to save auction item.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this auction item?')) return;

    try {
      const res = await api.delete(`/auction/${id}`);
      if (res.data.status === 'success') {
        showToast('Auction item deleted successfully.', 'success');
        setItems(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete auction item.', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <CircleDollarSign className="h-7 w-7 text-accent-dark" />
            <span>Auction Ledger Management (ಹರಾಜು ವಿವರ)</span>
          </h1>
          <p className="text-xs text-charcoal-light mt-1">
            Manage Ganeshotsava auction items, winners, final amounts, and update payment status.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-primary text-warm hover:bg-primary-light px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Auction Item</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal-light font-semibold">Loading ledger items...</div>
      ) : items.length > 0 ? (
        <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                  <th className="p-4">Item Name / ಹರಾಜು ಸಾಮಾನು</th>
                  <th className="p-4">Winner / ಕೊಳ್ಳುಗರು</th>
                  <th className="p-4">Final Amount</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark text-sm">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-warm-dark/10 transition">
                    <td className="p-4 font-bold text-charcoal font-kannada">
                      <div>
                        {language === 'kn' ? item.itemNameKannada : item.itemName}
                        <span className="block text-[10px] text-charcoal-light/70 font-normal">
                          {language === 'kn' ? item.itemName : item.itemNameKannada}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-charcoal-light">
                      {item.buyer || <span className="text-rose-500 italic">No Winner Listed</span>}
                    </td>
                    <td className="p-4 font-extrabold text-charcoal">
                      Rs. {item.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.paymentStatus)}`}>
                        {item.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit"
                          className="p-1.5 bg-warm border border-warm-dark text-charcoal hover:bg-warm-dark rounded-lg transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Delete"
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
          No auction items found. Click "Add Auction Item" to register the first one.
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-warm-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-warm-dark flex items-center justify-between bg-warm">
              <h2 className="font-bold text-primary flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5" />
                <span>{editingItem ? 'Edit Auction Item' : 'Add New Auction Item'}</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-charcoal hover:text-rose-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Item Name (English) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silver Kalasha"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Item Name (Kannada) <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ಬೆಳ್ಳಿ ಕಳಶ"
                  value={itemNameKannada}
                  onChange={(e) => setItemNameKannada(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Winner / Buyer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mahabaleshwar Bhat"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Final Bid (Rs.) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Payment Status <span className="text-rose-500">*</span></label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-warm font-bold py-2.5 rounded-lg hover:bg-primary-light transition flex items-center justify-center gap-2 mt-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingItem ? 'Save Changes' : 'Register Item'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
