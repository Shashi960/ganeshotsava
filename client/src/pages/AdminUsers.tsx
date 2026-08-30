import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, X, Save, CheckCircle, Ban, Key } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

interface AdminUser {
  _id: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  active: boolean;
}

export const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/admins');
      if (res.data.status === 'success') {
        setUsers(res.data.admins);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch administrator accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setRole('ADMIN');
    setActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setActive(user.active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!editingUser && !password)) {
      showToast('Please enter required fields.', 'warning');
      return;
    }

    try {
      if (editingUser) {
        // Edit existing admin
        const payload: any = { role, active };
        if (password) payload.password = password;

        const res = await api.put(`/auth/admins/${editingUser._id}`, payload);
        if (res.data.status === 'success') {
          showToast('Administrator updated successfully!', 'success');
          // Since the endpoint returns a nested admin object, let's map it correctly.
          const updated = res.data.admin;
          setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, role: updated.role, active: updated.active } : u));
        }
      } else {
        // Create new admin
        const res = await api.post('/auth/admins/new', { email, password, role });
        if (res.data.status === 'success') {
          showToast('Administrator created successfully!', 'success');
          // Add the newly created user (res.data.admin has fields: id, email, role, active). Map id to _id.
          const created = res.data.admin;
          setUsers(prev => [...prev, { _id: created.id, email: created.email, role: created.role, active: created.active }]);
        }
      }
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to save administrator account.';
      showToast(errMsg, 'error');
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      const updatedActive = !user.active;
      const res = await api.put(`/auth/admins/${user._id}`, { active: updatedActive });
      if (res.data.status === 'success') {
        showToast(`Account ${updatedActive ? 'activated' : 'deactivated'} successfully!`, 'success');
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, active: updatedActive } : u));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warm-dark pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary flex items-center gap-2">
            <Shield className="h-7 w-7 text-accent-dark" />
            <span>Manage Administrator Logins</span>
          </h1>
          <p className="text-xs text-charcoal-light mt-1">
            Create and configure administrative logins (with unique username and password) who can add Kathe members, events, and manage calculations.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase bg-primary text-warm hover:bg-primary-light px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-charcoal-light font-semibold">Loading logins...</div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-xl border border-warm-dark overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-dark/50 border-b border-warm-dark text-xs font-bold text-charcoal-light uppercase">
                  <th className="p-4">Username / Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-dark text-sm">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-warm-dark/10 transition">
                    <td className="p-4 font-bold text-charcoal">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}>
                        {u.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(u)}
                          title={u.active ? 'Deactivate User' : 'Activate User'}
                          className={`p-1.5 rounded-lg border transition ${
                            u.active
                              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Change Password / Role"
                          className="p-1.5 bg-warm border border-warm-dark text-charcoal hover:bg-warm-dark rounded-lg transition"
                        >
                          <Edit2 className="h-4 w-4" />
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
          No administrator accounts found.
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-warm-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-warm-dark flex items-center justify-between bg-warm">
              <h2 className="font-bold text-primary flex items-center gap-2">
                <Shield className="h-5 w-5 animate-pulse" />
                <span>{editingUser ? 'Edit User Credentials' : 'Add Administrative User'}</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-charcoal hover:text-rose-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">Username / Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  placeholder="e.g. volunteer@ganeshotsava.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal block">
                  {editingUser ? 'New Password (Leave blank to keep current)' : 'Password'} <span className="text-rose-500">{!editingUser && '*'}</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-light" />
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="Enter unique password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-warm border border-warm-dark rounded-lg pl-9 pr-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">User Role <span className="text-rose-500">*</span></label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  >
                    <option value="ADMIN">ADMIN (Events & Members)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN (Full Access)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal block">Account Status <span className="text-rose-500">*</span></label>
                  <select
                    value={active ? 'true' : 'false'}
                    onChange={(e) => setActive(e.target.value === 'true')}
                    className="w-full bg-warm border border-warm-dark rounded-lg px-3 py-2 text-sm text-charcoal outline-none focus:border-accent"
                  >
                    <option value="true">Active / Enabled</option>
                    <option value="false">Inactive / Disabled</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-warm font-bold py-2.5 rounded-lg hover:bg-primary-light transition flex items-center justify-center gap-2 mt-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingUser ? 'Save Credentials' : 'Create User Account'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
