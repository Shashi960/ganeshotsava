import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { exportTshirtToPdf } from '../utils/pdfExport';
import {
  Shirt,
  Search,
  CheckCircle,
  Users,
  UserPlus,
  Trash2,
  FileText,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Square,
  Edit2,
  X,
} from 'lucide-react';

interface MemberItem {
  _id: string;
  firstName: string;
  lastName: string;
  homeName?: string;
  memberType: string;
  role?: string;
  phone?: string;
}

interface TshirtOrderItem {
  _id: string;
  member?: MemberItem;
  name: string;
  homeName?: string;
  memberType: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
  phone?: string;
  notes?: string;
  year: string;
  createdAt: string;
}

interface SizeStats {
  total: number;
  breakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  year: string;
}

const SIZES: Array<{ label: string; chest: string; key: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' }> = [
  { label: 'S', chest: '36"', key: 'S' },
  { label: 'M', chest: '38"', key: 'M' },
  { label: 'L', chest: '40"', key: 'L' },
  { label: 'XL', chest: '42"', key: 'XL' },
  { label: 'XXL', chest: '44"', key: 'XXL' },
  { label: '3XL', chest: '46"', key: '3XL' },
];

export const TshirtView: React.FC = () => {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [availableMembers, setAvailableMembers] = useState<MemberItem[]>([]);
  const [orders, setOrders] = useState<TshirtOrderItem[]>([]);
  const [stats, setStats] = useState<SizeStats>({
    total: 0,
    breakdown: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 },
    typeBreakdown: {},
    year: '2026',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sectionEnabled, setSectionEnabled] = useState<boolean>(true);

  // Form Selection States
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customHomeName, setCustomHomeName] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | ''>('');

  // Filtering states for unassigned members checkboxes
  const [memberSearch, setMemberSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Member' | 'Junior Member' | 'Senior Member'>('ALL');

  // Filtering states for recorded table
  const [tableSearch, setTableSearch] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState<TshirtOrderItem | null>(null);
  const [editSize, setEditSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL'>('L');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Check if section is enabled in system settings
      const [settingsRes, membersRes, ordersRes] = await Promise.all([
        api.get('/settings').catch(() => null),
        api.get('/tshirt/available-members'),
        api.get('/tshirt'),
      ]);

      if (settingsRes?.data?.status === 'success' && settingsRes.data.settings) {
        if (settingsRes.data.settings.tshirtSectionEnabled !== undefined) {
          setSectionEnabled(Boolean(settingsRes.data.settings.tshirtSectionEnabled));
        }
      }

      if (membersRes?.data?.status === 'success') {
        setAvailableMembers(membersRes.data.members || []);
      }

      if (ordersRes?.data?.status === 'success') {
        setOrders(ordersRes.data.orders || []);
        if (ordersRes.data.stats) {
          setStats(ordersRes.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load T-shirt data:', err);
      showToast(language === 'kn' ? 'ಮಾಹಿತಿ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ' : 'Failed to load T-shirt data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch only available members
  const refreshMembers = async () => {
    try {
      const res = await api.get('/tshirt/available-members');
      if (res.data.status === 'success') {
        setAvailableMembers(res.data.members || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered available members
  const filteredAvailableMembers = useMemo(() => {
    return availableMembers.filter((m) => {
      const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      const home = (m.homeName || '').toLowerCase();
      const s = memberSearch.toLowerCase();
      const matchesSearch = fullName.includes(s) || home.includes(s);

      const matchesType =
        typeFilter === 'ALL' ||
        m.memberType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [availableMembers, memberSearch, typeFilter]);

  // Filtered recorded orders for table
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const s = tableSearch.toLowerCase();
      const matchesSearch =
        (o.name || '').toLowerCase().includes(s) ||
        (o.homeName || '').toLowerCase().includes(s) ||
        (o.memberType || '').toLowerCase().includes(s);

      const matchesSize = sizeFilter === 'ALL' || o.size === sizeFilter;
      return matchesSearch && matchesSize;
    });
  }, [orders, tableSearch, sizeFilter]);

  const handleSelectMember = (memberId: string) => {
    if (selectedMemberId === memberId) {
      setSelectedMemberId('');
    } else {
      setSelectedMemberId(memberId);
      setIsOtherSelected(false);
    }
  };

  const handleSelectOther = () => {
    setIsOtherSelected(!isOtherSelected);
    if (!isOtherSelected) {
      setSelectedMemberId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOtherSelected && !selectedMemberId) {
      showToast(
        language === 'kn'
          ? 'ದಯವಿಟ್ಟು ಪಟ್ಟಿಯಿಂದ ಒಬ್ಬ ಸದಸ್ಯರನ್ನು ಅಥವಾ "ಇತರೆ" ಆಯ್ಕೆಮಾಡಿ.'
          : 'Please select a member checkbox or choose "Other".',
        'warning'
      );
      return;
    }

    if (isOtherSelected && !customName.trim()) {
      showToast(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ವ್ಯಕ್ತಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.' : 'Please enter devotee / member name.',
        'warning'
      );
      return;
    }

    if (!selectedSize) {
      showToast(
        language === 'kn' ? 'ದಯವಿಟ್ಟು ಟಿ-ಶರ್ಟ್ ಅಳತೆ (Size) ಆಯ್ಕೆಮಾಡಿ.' : 'Please select a T-shirt size.',
        'warning'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        size: selectedSize,
      };

      if (isOtherSelected) {
        payload.name = customName.trim();
        payload.homeName = customHomeName.trim();
      } else {
        payload.memberId = selectedMemberId;
      }

      const res = await api.post('/tshirt', payload);

      if (res.data.status === 'success' && res.data.orders?.length > 0) {
        const newOrder = res.data.orders[0];
        const recordedName = newOrder.name;

        showToast(
          language === 'kn'
            ? `"${recordedName}" ಅವರ ಟಿ-ಶರ್ಟ್ ಅಳತೆ (${selectedSize}) ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಾಗಿದೆ!`
            : `T-Shirt size (${selectedSize}) for "${recordedName}" recorded successfully!`,
          'success'
        );

        // 1. Immediately remove selected member from the available members checkbox list
        if (selectedMemberId) {
          setAvailableMembers((prev) => prev.filter((m) => m._id !== selectedMemberId));
        }

        // 2. Add to recorded orders list at top
        setOrders((prev) => [newOrder, ...prev]);

        // 3. Update summary statistics
        setStats((prev) => {
          const prevCount = prev.breakdown[selectedSize] || 0;
          return {
            ...prev,
            total: prev.total + 1,
            breakdown: {
              ...prev.breakdown,
              [selectedSize]: prevCount + 1,
            },
          };
        });

        // 4. Reset form selection
        setSelectedMemberId('');
        setIsOtherSelected(false);
        setCustomName('');
        setCustomHomeName('');
        setSelectedSize('');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to record T-shirt order';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (orderId: string, devoteeName: string) => {
    const confirmMsg =
      language === 'kn'
        ? `ಖಚಿತವಾಗಿ "${devoteeName}" ಅವರ ಟಿ-ಶರ್ಟ್ ದಾಖಲೆಯನ್ನು ಅಳಿಸಲು ಬಯಸುವಿರಾ?\n(ಗಮನಿಸಿ: ಅಳಿಸಿದರೆ ಇವರ ಹೆಸರು ಪುನಃ ಲಭ್ಯವಿರುವ ಸದಸ್ಯರ ಪಟ್ಟಿಗೆ ಸೇರ್ಪಡೆಯಾಗುತ್ತದೆ)`
        : `Are you sure you want to delete the T-shirt record for "${devoteeName}"?\n(They will return to the unassigned members checkbox list)`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.delete(`/tshirt/${orderId}`);
      if (res.data.status === 'success') {
        showToast(
          language === 'kn' ? 'ದಾಖಲೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ.' : 'Record deleted successfully.',
          'success'
        );

        const removedOrder = orders.find((o) => o._id === orderId);
        setOrders((prev) => prev.filter((o) => o._id !== orderId));

        if (removedOrder) {
          setStats((prev) => {
            const count = prev.breakdown[removedOrder.size] || 1;
            return {
              ...prev,
              total: Math.max(0, prev.total - 1),
              breakdown: {
                ...prev.breakdown,
                [removedOrder.size]: Math.max(0, count - 1),
              },
            };
          });
        }

        // Refresh available members so the member returns to the list
        refreshMembers();
      }
    } catch (err) {
      console.error(err);
      showToast(language === 'kn' ? 'ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.' : 'Failed to delete record.', 'error');
    }
  };

  const handleOpenEdit = (order: TshirtOrderItem) => {
    setEditingOrder(order);
    setEditSize(order.size);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/tshirt/${editingOrder._id}`, { size: editSize });
      if (res.data.status === 'success') {
        showToast(language === 'kn' ? 'ಅಳತೆ ನವೀಕರಿಸಲಾಗಿದೆ.' : 'Size updated successfully.', 'success');
        const oldSize = editingOrder.size;
        setOrders((prev) =>
          prev.map((o) => (o._id === editingOrder._id ? { ...o, size: editSize } : o))
        );

        // Update stats
        if (oldSize !== editSize) {
          setStats((prev) => ({
            ...prev,
            breakdown: {
              ...prev.breakdown,
              [oldSize]: Math.max(0, (prev.breakdown[oldSize] || 1) - 1),
              [editSize]: (prev.breakdown[editSize] || 0) + 1,
            },
          }));
        }

        setEditingOrder(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update size', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (orders.length === 0) {
      showToast(
        language === 'kn' ? 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ.' : 'No T-shirt records to download.',
        'warning'
      );
      return;
    }

    setDownloadingPdf(true);
    try {
      showToast(
        language === 'kn' ? 'ಕನ್ನಡ ಯೂನಿಕೋಡ್ ಪಿಡಿಎಫ್ ತಯಾರಾಗುತ್ತಿದೆ...' : 'Generating vector PDF document...',
        'info'
      );

      await exportTshirtToPdf(orders, language, {
        filenamePrefix: 'ganeshotsava_members_tshirt_sizes',
        year: stats.year || '2026',
        stats: {
          total: stats.total,
          breakdown: stats.breakdown,
        },
      });

      showToast(
        language === 'kn' ? 'ಪಿಡಿಎಫ್ ಯಶಸ್ವಿಯಾಗಿ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ!' : 'PDF downloaded successfully!',
        'success'
      );
    } catch (err) {
      console.error('PDF export error:', err);
      showToast(language === 'kn' ? 'ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ.' : 'Failed to export PDF.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // If section is disabled by admin and current user is NOT authenticated admin
  if (!sectionEnabled && !isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Shirt className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-primary font-kannada">
          {language === 'kn' ? 'ಟಿ-ಶರ್ಟ್ ಅಳತೆ ನೋಂದಣಿ ಮುಕ್ತಾಯಗೊಂಡಿದೆ' : 'T-Shirt Size Collection Closed'}
        </h1>
        <p className="text-sm text-charcoal-light max-w-md mx-auto leading-relaxed">
          {language === 'kn'
            ? 'ಸಮಿತಿ ವತಿಯಿಂದ ಈ ವರ್ಷದ ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ಅಳತೆ ನಮೂದನ್ನು ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ಸಂಘಟಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
            : 'Member T-shirt size collection has been concluded by the committee for this year. Please contact the organizers for more information.'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 space-y-10">
      {/* Festive Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-dark text-xs font-bold uppercase tracking-wider">
          <Shirt className="h-4 w-4" />
          <span>{language === 'kn' ? 'ಸದಸ್ಯರ ವಿಶೇಷ ಸೌಲಭ್ಯ' : 'Member Feature'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-primary tracking-wide font-kannada">
          {language === 'kn'
            ? 'ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ಅಳತೆ ನೋಂದಣಿ'
            : 'Member T-Shirt Size Distribution'}
        </h1>
        <p className="text-charcoal-light max-w-2xl mx-auto text-xs sm:text-base leading-relaxed">
          {language === 'kn'
            ? '35ನೇ ಗಣೇಶೋತ್ಸವದ ಪ್ರಯುಕ್ತ ಸಮಿತಿ ಸದಸ್ಯರು ಹಾಗೂ ಕಿರಿಯ ಸದಸ್ಯರಿಗೆ ಟಿ-ಶರ್ಟ್ ಅಳತೆ (Size) ಸುಲಭವಾಗಿ ಆಯ್ಕೆಮಾಡಿ ನಮೂದಿಸಿ.'
            : 'Select T-shirt sizes for members and junior members for the 35th Ganeshotsava.'}
        </p>
      </div>

      {/* T-Shirt Size Summary Counters Banner */}
      <div className="bg-white rounded-2xl border border-warm-dark p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm-dark pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-dark" />
            <h2 className="font-extrabold text-charcoal text-base sm:text-lg">
              {language === 'kn' ? 'ಟಿ-ಶರ್ಟ್ ಅಳತೆಯ ಒಟ್ಟು ವಿವರ (Size Breakdown)' : 'T-Shirt Size Summary'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-charcoal-light uppercase">
              {language === 'kn' ? 'ಒಟ್ಟು ದಾಖಲಾದ ಸಂಖ್ಯೆ:' : 'Total Ordered:'}
            </span>
            <span className="text-lg font-extrabold text-primary bg-accent/15 px-3 py-0.5 rounded-full border border-accent/30">
              {stats.total} {language === 'kn' ? 'ಟಿ-ಶರ್ಟ್' : 'T-Shirts'}
            </span>
          </div>
        </div>

        {/* Size chips grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {SIZES.map((sz) => {
            const count = stats.breakdown[sz.key] || 0;
            return (
              <div
                key={sz.key}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  count > 0
                    ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                    : 'bg-warm/40 border-warm-dark text-charcoal-light'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-base font-black text-charcoal">{sz.label}</span>
                  <span className="text-[10px] text-charcoal-light font-bold">({sz.chest})</span>
                </div>
                <span className={`text-xl font-extrabold mt-1 ${count > 0 ? 'text-primary' : 'text-charcoal-light'}`}>
                  {count}
                </span>
                <span className="text-[10px] uppercase font-bold text-charcoal-light">
                  {language === 'kn' ? 'ಸಂಖ್ಯೆ' : 'Units'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form: Choose Member & Size */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border-2 border-accent/40 p-4 sm:p-8 shadow-md space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-dark pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-accent-dark" />
              <span>{language === 'kn' ? 'ಹಂತ ೧: ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Step 1: Select Member'}</span>
            </h2>
            <p className="text-xs text-charcoal-light mt-0.5">
              {language === 'kn'
                ? 'ಪಟ್ಟಿಯಿಂದ ಸದಸ್ಯರ ಹೆಸರನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ. (ಆಯ್ಕೆಮಾಡಿದ ನಂತರ ಅವರ ಹೆಸರು ಪಟ್ಟಿಯಿಂದ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮರೆಯಾಗುತ್ತದೆ)'
                : 'Check member name below. (Once saved, they are automatically removed from this list)'}
            </p>
          </div>

          <span className="text-xs font-bold bg-warm-dark text-charcoal px-3 py-1 rounded-full self-start sm:self-auto">
            {availableMembers.length} {language === 'kn' ? 'ಬಾಕಿ ಸದಸ್ಯರು' : 'unassigned members'}
          </span>
        </div>

        {/* Member Search & Category Tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
            <input
              type="text"
              placeholder={language === 'kn' ? 'ಸದಸ್ಯರ ಹೆಸರು ಅಥವಾ ಮನೆತನ ಹುಡುಕಿ...' : 'Search by member or family name...'}
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full bg-warm border border-warm-dark rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm font-medium text-charcoal outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: language === 'kn' ? 'ಎಲ್ಲಾ' : 'All' },
              { id: 'Member', label: language === 'kn' ? 'ಸಾಮಾನ್ಯ ಸದಸ್ಯರು' : 'Members' },
              { id: 'Junior Member', label: language === 'kn' ? 'ಕಿರಿಯರು' : 'Junior' },
              { id: 'Senior Member', label: language === 'kn' ? 'ಹಿರಿಯರು' : 'Senior' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  typeFilter === tab.id
                    ? 'bg-primary text-warm shadow-xs'
                    : 'bg-warm hover:bg-warm-dark text-charcoal border border-warm-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Available Members Checkbox Grid */}
        <div className="max-h-72 overflow-y-auto pr-1 border border-warm-dark rounded-xl p-3 bg-warm/30">
          {loading ? (
            <div className="py-12 text-center text-charcoal-light font-medium flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>{language === 'kn' ? 'ಸದಸ್ಯರ ಪಟ್ಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading members...'}</span>
            </div>
          ) : filteredAvailableMembers.length === 0 && !isOtherSelected ? (
            <div className="py-8 text-center text-charcoal-light font-medium space-y-1">
              <p className="text-sm font-bold text-charcoal">
                {availableMembers.length === 0
                  ? language === 'kn'
                    ? 'ಎಲ್ಲಾ ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ಅಳತೆ ಯಶಸ್ವಿಯಾಗಿ ನಮೂದಾಗಿದೆ!'
                    : 'All registered members have already recorded their sizes!'
                  : language === 'kn'
                  ? 'ಹುಡುಕಾಟಕ್ಕೆ ತಕ್ಕ ಸದಸ್ಯರು ಕಂಡುಬಂದಿಲ್ಲ.'
                  : 'No unassigned members match your search.'}
              </p>
              <p className="text-xs text-charcoal-light">
                {language === 'kn'
                  ? 'ಹೊಸ ಭಕ್ತರು ಅಥವಾ ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲದವರಿಗೆ ಕೆಳಗಿನ "ಇತರೆ (Other)" ಆಯ್ಕೆಯನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ.'
                  : 'For new persons not on the roster, choose the "Other" card below.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredAvailableMembers.map((m) => {
                const isSelected = selectedMemberId === m._id;
                return (
                  <div
                    key={m._id}
                    onClick={() => handleSelectMember(m._id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-primary text-warm border-primary shadow-sm ring-2 ring-primary/30'
                        : 'bg-white hover:bg-warm-dark/50 border-warm-dark text-charcoal'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-accent fill-accent text-primary-dark" />
                      ) : (
                        <Square className="h-5 w-5 text-charcoal-light" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-sm truncate leading-tight">
                          {m.firstName} {m.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-white/20 text-warm'
                              : 'bg-warm-dark text-charcoal-light border border-warm-dark'
                          }`}
                        >
                          {m.memberType}
                        </span>
                        {m.homeName && (
                          <span
                            className={`text-[11px] truncate ${
                              isSelected ? 'text-warm/80' : 'text-charcoal-light'
                            }`}
                          >
                            {m.homeName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Last Checkbox: OTHER / ಇತರೆ */}
          <div className="mt-3 pt-3 border-t border-warm-dark">
            <div
              onClick={handleSelectOther}
              className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start gap-2.5 select-none ${
                isOtherSelected
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-500/30'
                  : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-300 text-amber-950'
              }`}
            >
              <div className="mt-0.5">
                {isOtherSelected ? (
                  <CheckSquare className="h-5 w-5 text-white" />
                ) : (
                  <Square className="h-5 w-5 text-amber-700" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  <span className="font-extrabold text-sm">
                    {language === 'kn'
                      ? 'ಇತರೆ (ಪಟ್ಟಿಯಲ್ಲಿಲ್ಲದ ಭಕ್ತರು / ಹೊಸ ಸದಸ್ಯರು)'
                      : 'Other (Non-member / New Devotee)'}
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-0.5 ${
                    isOtherSelected ? 'text-amber-100' : 'text-amber-800'
                  }`}
                >
                  {language === 'kn'
                    ? 'ಪಟ್ಟಿಯಲ್ಲಿ ಹೆಸರಿಲ್ಲದವರಿಗೆ ನೇರವಾಗಿ ಹೆಸರು ನಮೂದಿಸಿ ಟಿ-ಶರ್ಟ್ ಅಳತೆ ಆಯ್ಕೆಮಾಡಲು ಇದನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ.'
                    : 'Click here to enter name manually if person is not in the existing roster.'}
                </p>
              </div>
            </div>

            {/* If OTHER is chosen, show Name & House input field */}
            {isOtherSelected && (
              <div className="mt-3 p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-950 block">
                    {language === 'kn' ? 'ವ್ಯಕ್ತಿಯ ಪೂರ್ಣ ಹೆಸರು (Full Name)' : 'Devotee / Person Full Name'}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      language === 'kn'
                        ? 'ಉದಾ. ವೆಂಕಟೇಶ್ ನಾಯ್ಕ / Enter full name'
                        : 'e.g. Venkatesh Nayak'
                    }
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-amber-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-950 block">
                    {language === 'kn' ? 'ಮನೆತನ / ವಿಳಾಸ (Home / Address)' : 'Home / Address'}{' '}
                    <span className="text-xs font-normal text-amber-800">
                      ({language === 'kn' ? 'ಐಚ್ಛಿಕ' : 'Optional'})
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder={
                      language === 'kn'
                        ? 'ಉದಾ. ನಾಜಗಾರ ಕ್ರಾಸ್, ಕೆಳಗಿನೂರು / Enter house name'
                        : 'e.g. Najagara Cross'
                    }
                    value={customHomeName}
                    onChange={(e) => setCustomHomeName(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Choose Size */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Shirt className="h-5 w-5 text-accent-dark" />
            <h2 className="text-lg sm:text-xl font-extrabold text-primary">
              {language === 'kn' ? 'ಹಂತ ೨: ಟಿ-ಶರ್ಟ್ ಅಳತೆ (Size) ಆಯ್ಕೆಮಾಡಿ' : 'Step 2: Choose T-Shirt Size'}
            </h2>
            <span className="text-rose-600 font-bold">*</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {SIZES.map((sz) => {
              const isSelected = selectedSize === sz.key;
              return (
                <button
                  key={sz.key}
                  type="button"
                  onClick={() => setSelectedSize(sz.key)}
                  className={`p-3 rounded-xl border-2 text-center transition flex flex-col items-center justify-center select-none cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-primary-dark border-accent-dark shadow-md font-black ring-2 ring-accent/50 scale-105'
                      : 'bg-white hover:bg-warm border-warm-dark text-charcoal font-bold'
                  }`}
                >
                  <span className="text-lg sm:text-xl font-extrabold">{sz.label}</span>
                  <span className="text-xs opacity-80">{sz.chest}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting || (!selectedMemberId && (!isOtherSelected || !customName.trim())) || !selectedSize}
            className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-light text-warm font-extrabold text-sm sm:text-base rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle className="h-5 w-5 text-accent" />
            <span>
              {submitting
                ? language === 'kn'
                  ? 'ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ...'
                  : 'Saving...'
                : language === 'kn'
                ? 'ಟಿ-ಶರ್ಟ್ ಅಳತೆ ದಾಖಲಿಸಿ (Save Size)'
                : 'Save T-Shirt Size'}
            </span>
          </button>
        </div>
      </form>

      {/* Recorded T-Shirts Directory & Download Section */}
      <div className="space-y-4 pt-4 border-t border-warm-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-primary">
                {language === 'kn' ? 'ದಾಖಲಾದ ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ಪಟ್ಟಿ' : 'Recorded T-Shirt Distribution List'}
              </h2>
              <span className="text-xs font-extrabold bg-primary text-warm px-2.5 py-0.5 rounded-full">
                {orders.length}
              </span>
            </div>
            <p className="text-xs text-charcoal-light mt-0.5">
              {language === 'kn'
                ? 'ಅಳತೆ ನಮೂದಾದ ಎಲ್ಲ ಸದಸ್ಯರ ವಿವರ. ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಕೆಳಗಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ.'
                : 'All devotees with sizes recorded. Click download below to get the printable roster.'}
            </p>
          </div>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || orders.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-light text-primary-dark font-extrabold text-xs sm:text-sm rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>
              {downloadingPdf
                ? language === 'kn'
                  ? 'ಪಿಡಿಎಫ್ ತಯಾರಾಗುತ್ತಿದೆ...'
                  : 'Generating PDF...'
                : language === 'kn'
                ? 'ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ (Download PDF)'
                : 'Download PDF Report'}
            </span>
          </button>
        </div>

        {/* Search & Filter within recorded table */}
        <div className="bg-white rounded-xl border border-warm-dark p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
            <input
              type="text"
              placeholder={language === 'kn' ? 'ದಾಖಲಾದ ಹೆಸರು ಹುಡುಕಿ...' : 'Search recorded name...'}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-charcoal outline-none focus:border-accent"
            />
          </div>

          {/* Size Filter Pills */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {['ALL', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSizeFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  sizeFilter === s
                    ? 'bg-primary text-warm shadow-xs'
                    : 'bg-warm hover:bg-warm-dark text-charcoal border border-warm-dark'
                }`}
              >
                {s === 'ALL' ? (language === 'kn' ? 'ಎಲ್ಲಾ ಅಳತೆ' : 'All') : s}
              </button>
            ))}
          </div>
        </div>

        {/* Recorded List View: Mobile Cards & Desktop Table */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-dark p-12 text-center text-charcoal-light font-medium">
            {language === 'kn'
              ? 'ಇನ್ನೂ ಯಾವುದೇ ಸದಸ್ಯರ ಟಿ-ಶರ್ಟ್ ಅಳತೆ ದಾಖಲಾಗಿಲ್ಲ. ಮೇಲಿನ ಪಟ್ಟಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ ದಾಖಲಿಸಿ.'
              : 'No T-shirt sizes recorded yet. Select from the member checkboxes above to start.'}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-warm-dark p-8 text-center text-charcoal-light font-medium">
            {language === 'kn' ? 'ಆಯ್ಕೆಮಾಡಿದ ಫಿಲ್ಟರ್‌ಗೆ ತಕ್ಕ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No records match the filter.'}
          </div>
        ) : (
          <div className="space-y-3">
            {/* MOBILE CARDS VIEW */}
            <div className="sm:hidden space-y-2.5">
              {filteredOrders.map((ord, index) => (
                <div
                  key={ord._id}
                  className="bg-white border border-warm-dark rounded-xl p-3.5 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-warm-dark text-charcoal px-1.5 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      <h4 className="font-extrabold text-charcoal text-sm leading-tight">{ord.name}</h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-charcoal-light">
                      <span className="bg-warm px-2 py-0.5 rounded border border-warm-dark text-[10px] font-bold">
                        {ord.memberType}
                      </span>
                      {ord.homeName && <span>{ord.homeName}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
                      {ord.size}
                    </span>

                    {isAuthenticated && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ord)}
                          className="p-1.5 text-primary hover:bg-warm-dark rounded transition"
                          title="Edit Size"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ord._id, ord.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden sm:block bg-white rounded-2xl border border-warm-dark overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-extrabold text-charcoal-light uppercase tracking-wider">
                    <th className="p-4">{language === 'kn' ? 'ಕ್ರ.ಸಂ' : 'Sl No'}</th>
                    <th className="p-4">{language === 'kn' ? 'ಸದಸ್ಯರ / ಭಕ್ತರ ಹೆಸರು' : 'Member Name'}</th>
                    <th className="p-4">{language === 'kn' ? 'ವರ್ಗ' : 'Category'}</th>
                    <th className="p-4">{language === 'kn' ? 'ಮನೆತನ' : 'Home / Family'}</th>
                    <th className="p-4 text-center">{language === 'kn' ? 'ಟಿ-ಶರ್ಟ್ ಅಳತೆ' : 'T-Shirt Size'}</th>
                    {isAuthenticated && <th className="p-4 text-right">{language === 'kn' ? 'ಕ್ರಮಗಳು' : 'Actions'}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-dark text-sm">
                  {filteredOrders.map((ord, index) => (
                    <tr key={ord._id} className="hover:bg-warm/60 transition">
                      <td className="p-4 font-bold text-charcoal-light">{index + 1}</td>
                      <td className="p-4 font-extrabold text-charcoal">{ord.name}</td>
                      <td className="p-4">
                        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-warm border border-warm-dark text-charcoal">
                          {ord.memberType}
                        </span>
                      </td>
                      <td className="p-4 text-charcoal-light font-medium">{ord.homeName || '-'}</td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-black bg-blue-100 text-blue-900 border border-blue-200">
                          {ord.size}
                        </span>
                      </td>
                      {isAuthenticated && (
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(ord)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-primary hover:bg-warm-dark rounded-lg transition border border-primary/20"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>{language === 'kn' ? 'ತಿದ್ದುಪಡಿ' : 'Edit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ord._id, ord.name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200"
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
        )}
      </div>

      {/* Edit Size Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-warm-dark p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-warm-dark pb-3">
              <h3 className="font-extrabold text-charcoal text-base">
                {language === 'kn' ? 'ಟಿ-ಶರ್ಟ್ ಅಳತೆ ತಿದ್ದುಪಡಿ' : 'Edit T-Shirt Size'}
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 text-charcoal-light hover:text-charcoal rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-charcoal-light block">
                {language === 'kn' ? 'ಸದಸ್ಯರ ಹೆಸರು:' : 'Member Name:'}
              </span>
              <p className="font-bold text-charcoal text-base">{editingOrder.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-charcoal block">
                {language === 'kn' ? 'ಹೊಸ ಅಳತೆ (New Size):' : 'Select New Size:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((sz) => (
                  <button
                    key={sz.key}
                    type="button"
                    onClick={() => setEditSize(sz.key)}
                    className={`p-2.5 rounded-xl border text-center font-bold text-sm transition ${
                      editSize === sz.key
                        ? 'bg-accent text-primary-dark border-accent-dark font-black shadow-sm'
                        : 'bg-warm hover:bg-warm-dark border-warm-dark text-charcoal'
                    }`}
                  >
                    {sz.label} ({sz.chest})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-dark">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 text-xs font-bold text-charcoal-light hover:text-charcoal transition"
              >
                {language === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2 bg-primary hover:bg-primary-light text-warm text-xs font-extrabold rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {savingEdit
                  ? language === 'kn'
                    ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...'
                    : 'Saving...'
                  : language === 'kn'
                  ? 'ಉಳಿಸಿ'
                  : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
