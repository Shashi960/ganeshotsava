import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Plus, Edit2, Trash2, Coins, TrendingUp, TrendingDown, Users, X } from 'lucide-react';

interface FinancialRecord {
  _id: string;
  year: string;
  category: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  visibility: 'PUBLIC' | 'ADMIN_ONLY' | 'SUPER_ADMIN_ONLY';
}

interface YearItem {
  _id: string;
  year: string;
  isCurrent: boolean;
}

export const AdminFinancials: React.FC = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [years, setYears] = useState<YearItem[]>([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'ADMIN_ONLY'>('PUBLIC');

  useEffect(() => {
    // Fetch years
    api.get('/years').then(res => {
      if (res.data.status === 'success') {
        setYears(res.data.years);
        const currentYearObj = res.data.years.find((y: any) => y.isCurrent);
        if (currentYearObj) {
          // By default, let's select the archived preceding year to edit balance sheets
          const prevYear = (parseInt(currentYearObj.year) - 1).toString();
          setSelectedYear(prevYear);
        }
      }
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchFinancials();
  }, [selectedYear]);

  const fetchFinancials = () => {
    setLoading(true);
    api.get(`/financials?year=${selectedYear}`).then(res => {
      if (res.data.status === 'success') {
        setRecords(res.data.financials);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleOpenAddModal = (defaultType: 'INCOME' | 'EXPENSE', defaultCategory = '') => {
    setEditingId(null);
    setCategory(defaultCategory);
    setDescription('');
    setAmount('');
    setType(defaultType);
    setVisibility('PUBLIC');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: FinancialRecord) => {
    setEditingId(r._id);
    setCategory(r.category);
    setDescription(r.description);
    setAmount(r.amount.toString());
    setType(r.type);
    setVisibility(r.visibility === 'SUPER_ADMIN_ONLY' ? 'ADMIN_ONLY' : r.visibility as any);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description || !amount) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }

    const payload = {
      year: selectedYear,
      category,
      description,
      amount: parseFloat(amount),
      type,
      visibility
    };

    try {
      if (editingId) {
        await api.put(`/financials/${editingId}`, payload);
        showToast('Financial record updated!');
      } else {
        await api.post('/financials', payload);
        showToast('Financial record created successfully!');
      }
      setIsModalOpen(false);
      fetchFinancials();
    } catch (error) {
      console.error(error);
      showToast('Failed to save financial details.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record? This action cannot be undone.')) return;
    try {
      await api.delete(`/financials/${id}`);
      showToast('Record deleted.');
      fetchFinancials();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete record.', 'error');
    }
  };

  // Groupings
  const incomeRecords = records.filter(r => r.type === 'INCOME' && r.category !== 'Donor Listing');
  const expenseRecords = records.filter(r => r.type === 'EXPENSE');
  const donorRecords = records.filter(r => r.category === 'Donor Listing');

  const totalIncome = incomeRecords.reduce((acc, cur) => acc + cur.amount, 0);
  const totalExpense = expenseRecords.reduce((acc, cur) => acc + cur.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-warm-dark p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-wide">
            Jama Karchu & Donors Manager
          </h1>
          <p className="text-xs text-charcoal-light mt-1">
            Manage festival receipts, expenditures, and prominent donor rolls.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-charcoal">Select Accounts Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-warm border border-warm-dark text-sm rounded-lg px-3 py-2 text-charcoal font-bold outline-none"
          >
            {years.map(y => (
              <option key={y._id} value={y.year}>{y.year} Accounts</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-warm-dark rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal-light block uppercase">Total Receipts</span>
            <span className="text-2xl font-extrabold text-emerald-700">₹{totalIncome.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-warm-dark rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-rose-50 text-rose-700 rounded-lg flex items-center justify-center">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal-light block uppercase">Total Expenditures</span>
            <span className="text-2xl font-extrabold text-rose-700">₹{totalExpense.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white border border-warm-dark rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal-light block uppercase">Prominent Donors</span>
            <span className="text-2xl font-extrabold text-amber-700">{donorRecords.length} Devotees</span>
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Receipts & Income */}
        <div className="bg-white border border-warm-dark rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-warm-dark pb-3">
            <h3 className="font-bold text-charcoal text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" /> Receipts (Income)
            </h3>
            <button
              onClick={() => handleOpenAddModal('INCOME')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Income
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-warm border-b border-warm-dark text-charcoal font-bold">
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark/50">
                {incomeRecords.length > 0 ? (
                  incomeRecords.map(r => (
                    <tr key={r._id} className="hover:bg-warm/50 text-charcoal-light">
                      <td className="p-2.5 font-bold text-charcoal">{r.category}</td>
                      <td className="p-2.5">{r.description}</td>
                      <td className="p-2.5 text-right font-bold text-charcoal">₹{r.amount.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEditModal(r)} className="text-secondary hover:text-secondary-dark p-1">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(r._id)} className="text-rose-600 hover:text-rose-800 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-charcoal-light/70 italic">No receipts recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenditures & Expenses */}
        <div className="bg-white border border-warm-dark rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-warm-dark pb-3">
            <h3 className="font-bold text-charcoal text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-rose-600" /> Expenditures (Expenses)
            </h3>
            <button
              onClick={() => handleOpenAddModal('EXPENSE')}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Expense
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-warm border-b border-warm-dark text-charcoal font-bold">
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark/50">
                {expenseRecords.length > 0 ? (
                  expenseRecords.map(r => (
                    <tr key={r._id} className="hover:bg-warm/50 text-charcoal-light">
                      <td className="p-2.5 font-bold text-charcoal">{r.category}</td>
                      <td className="p-2.5">{r.description}</td>
                      <td className="p-2.5 text-right font-bold text-charcoal">₹{r.amount.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenEditModal(r)} className="text-secondary hover:text-secondary-dark p-1">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(r._id)} className="text-rose-600 hover:text-rose-800 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-charcoal-light/70 italic">No expenditures recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Prominent Donors Section */}
      <div className="bg-white border border-warm-dark rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-warm-dark pb-3">
          <h3 className="font-bold text-charcoal text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" /> Prominent Donors Rolls (₹500 & Above)
          </h3>
          <button
            onClick={() => handleOpenAddModal('INCOME', 'Donor Listing')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Donor Listing
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {donorRecords.length > 0 ? (
            donorRecords.map((d, idx) => (
              <div key={d._id} className="flex justify-between items-center p-3 bg-warm border border-warm-dark rounded-lg font-kannada">
                <div className="space-y-0.5">
                  <span className="text-xs text-charcoal-light font-sans block">#{idx + 1} Donor</span>
                  <span className="font-bold text-charcoal text-sm">{d.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-primary text-sm">₹{d.amount.toLocaleString()}</span>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleOpenEditModal(d)} className="text-secondary hover:text-secondary-dark p-0.5">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(d._id)} className="text-rose-600 hover:text-rose-800 p-0.5">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-charcoal-light/70 italic">No prominent donors logged.</div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-warm-dark w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-primary text-warm p-4 flex justify-between items-center">
              <h3 className="font-bold text-base tracking-wide">
                {editingId ? 'Edit Financial Record' : `Add New ${type === 'INCOME' ? 'Receipt (Income)' : 'Expenditure (Expense)'}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-warm/80 hover:text-warm transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="INCOME">Receipt (Income)</option>
                  <option value="EXPENSE">Expenditure (Expense)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Category</label>
                {category === 'Donor Listing' ? (
                  <input
                    type="text"
                    disabled
                    value="Donor Listing"
                    className="w-full bg-warm-dark/20 border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal-light cursor-not-allowed outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Printing, Donation, Pooja Seva"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">
                  {category === 'Donor Listing' ? 'Donor Full Name (Kannada/English)' : 'Description'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={category === 'Donor Listing' ? 'e.g. ಶ್ರೀ ದುರ್ಗಾಂಬಾ ಹೋಟೆಲ್' : 'e.g. Audited ledger carryforward'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent font-kannada"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Who can view this?</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="PUBLIC">Public & Guests (Shared online)</option>
                  <option value="ADMIN_ONLY">Committee Admins Only (Private)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-warm-dark text-xs font-bold uppercase py-2.5 rounded-lg text-charcoal hover:bg-warm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-warm text-xs font-bold uppercase py-2.5 rounded-lg hover:bg-primary-dark transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
