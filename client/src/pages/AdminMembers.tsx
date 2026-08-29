import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api, { getImageUrl } from '../services/api';
import { Plus, Edit2, Trash2, Search, X, Shield } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  homeName?: string;
  address?: string;
  photo?: string;
  memberType: string;
  role?: string;
  active: boolean;
  phone?: string;
  email?: string;
  yearJoined?: number;
}

export const AdminMembers: React.FC = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [homeName, setHomeName] = useState('');
  const [address, setAddress] = useState('');
  const [memberType, setMemberType] = useState('Member');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [yearJoined, setYearJoined] = useState(2026);
  const [active, setActive] = useState(true);
  const [currentYearVal, setCurrentYearVal] = useState('2026');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file is too large. Max limit is 5MB.', 'warning');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.post('/upload', { image: base64Data });
        if (res.data.status === 'success') {
          setPhoto(res.data.url);
          showToast('Image uploaded successfully!', 'success');
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to upload image.', 'error');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      showToast('Error reading file.', 'error');
      setUploading(false);
    };
  };

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data.status === 'success' && res.data.settings.currentYear) {
        setCurrentYearVal(res.data.settings.currentYear);
        setYearJoined(parseInt(res.data.settings.currentYear));
      }
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const fetchMembers = () => {
    setLoading(true);
    api.get(`/members?search=${search}`).then(res => {
      if (res.data.status === 'success') {
        setMembers(res.data.members);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setHomeName('');
    setAddress('');
    setMemberType('Member');
    setRole('');
    setPhone('');
    setEmail('');
    setPhoto('');
    setYearJoined(2026);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: Member) => {
    setEditingId(m._id);
    setFirstName(m.firstName);
    setLastName(m.lastName);
    setHomeName(m.homeName || '');
    setAddress(m.address || '');
    setMemberType(m.memberType);
    setRole(m.role || '');
    setPhone(m.phone || '');
    setEmail(m.email || '');
    setPhoto(m.photo || '');
    setYearJoined(m.yearJoined || 2026);
    setActive(m.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      firstName,
      lastName,
      homeName,
      address: address || undefined,
      photo: photo || undefined,
      memberType,
      role: role || undefined,
      phone: phone || undefined,
      email: email || undefined,
      yearJoined,
      active,
      year: currentYearVal
    };

    try {
      if (editingId) {
        await api.put(`/members/${editingId}`, payload);
        showToast('Member details updated!');
      } else {
        await api.post('/members', payload);
        showToast('Member created successfully!');
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (error) {
      console.error(error);
      showToast('Failed to save member details.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this member? This action is permanent.')) return;
    try {
      await api.delete(`/members/${id}`);
      showToast('Member deleted successfully.');
      fetchMembers();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete member.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary">Manage Members Directory</h1>
          <p className="text-xs text-charcoal-light">Manage organizers, seniors, volunteers, and junior members.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 bg-primary text-warm font-bold px-4 py-2 rounded-lg hover:bg-primary-light transition shadow self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Search Header */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
        <input
          type="text"
          placeholder="Search members by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-warm-dark pl-9 pr-4 py-2 rounded-lg text-sm text-charcoal outline-none focus:border-accent"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal-light">Loading members...</div>
      ) : members.length > 0 ? (
        <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-dark/40 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                  <th className="p-4">Name</th>
                  <th className="p-4">Home / Family Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark text-sm">
                {members.map(m => (
                  <tr key={m._id} className="hover:bg-warm-dark/5">
                    <td className="p-4 font-bold text-charcoal">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="p-4 text-charcoal-light font-medium">
                      {m.homeName || 'Najagara House'}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold bg-slate-100 border border-slate-200 text-charcoal px-2.5 py-0.5 rounded-full">
                        {m.memberType}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-primary">
                      {m.role || 'Member'}
                    </td>
                    <td className="p-4">
                      {m.active ? (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
                      ) : (
                        <span className="text-xs text-charcoal-light">Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEditModal(m)} className="p-1.5 border border-warm-dark hover:bg-warm rounded inline-flex" title="Edit"><Edit2 className="h-4 w-4 text-charcoal" /></button>
                      <button onClick={() => handleDelete(m._id)} className="p-1.5 border border-warm-dark hover:bg-warm rounded inline-flex" title="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-warm-dark p-8 rounded-xl text-center text-charcoal-light font-semibold">
          No members found.
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-warm-dark p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-warm-dark pb-2">
              <h2 className="text-lg font-bold text-primary">{editingId ? 'Edit Member Details' : 'Add New Member'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-charcoal-light" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm text-charcoal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">First Name</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Last Name</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Home / Family Name</label>
                  <input type="text" value={homeName} onChange={(e) => setHomeName(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Member Classification</label>
                  <select value={memberType} onChange={(e) => setMemberType(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none">
                    {['Senior Member', 'Member', 'Junior Member', 'Committee Member', 'Volunteer'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs">Resident Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Near Temple, Najagara" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Official Role / Pandal Position</label>
                  <input type="text" placeholder="e.g. Treasurer, Pandal Decorator..." value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Year Joined</label>
                  <input type="number" value={yearJoined} onChange={(e) => setYearJoined(parseInt(e.target.value))} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-xs">Phone Number (Secure)</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-xs">Email Address (Secure)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-warm border border-warm-dark rounded-lg p-2 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-xs block">Member Profile Photo</label>
                <div className="flex items-center gap-4">
                  {photo ? (
                    <img src={getImageUrl(photo)} alt="Preview" className="h-12 w-12 object-cover rounded-full border border-warm-dark" />
                  ) : (
                    <div className="h-12 w-12 bg-warm border border-warm-dark rounded-full flex items-center justify-center text-charcoal-light font-bold text-[10px] uppercase">No Photo</div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      disabled={uploading}
                      className="w-full text-xs text-charcoal-light file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-warm hover:file:bg-primary-light file:cursor-pointer cursor-pointer" 
                    />
                    <p className="text-[10px] text-charcoal-light font-medium">Or enter relative/external URL below:</p>
                    <input 
                      type="text" 
                      placeholder="e.g. /uploads/image.png" 
                      value={photo} 
                      onChange={(e) => setPhoto(e.target.value)} 
                      className="w-full bg-warm border border-warm-dark rounded-lg p-2 text-xs outline-none" 
                    />
                  </div>
                </div>
                {uploading && <div className="text-xs text-primary animate-pulse mt-1">Uploading image...</div>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 text-primary" />
                <label htmlFor="active" className="font-bold text-xs cursor-pointer">Active member status</label>
              </div>

              <div className="flex justify-end gap-2 border-t border-warm-dark pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-warm-dark rounded-lg text-charcoal hover:bg-warm transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-warm font-bold rounded-lg hover:bg-primary-light transition">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
