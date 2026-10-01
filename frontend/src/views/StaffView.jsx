import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  ChefHat,
  Coffee,
  Receipt,
  Edit2,
  Power,
  RefreshCw,
  Sparkles,
  Lock,
  Phone,
  Mail,
  User
} from 'lucide-react';

export default function StaffView() {
  const { addToast } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Add Form
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'WAITER',
  });

  // Edit Form
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    role: 'WAITER',
    password: '',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await posService.users.getAll();
      if (res.success && res.data) {
        setStaff(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load staff roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Compute counts by role
  const waiterCount = staff.filter((u) => u.role === 'WAITER').length;
  const chefCount = staff.filter((u) => u.role === 'KITCHEN_ADMIN').length;
  const receptionistCount = staff.filter((u) => u.role === 'RECEPTIONIST').length;

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      addToast('Name, Email and Password are required', 'warning');
      return;
    }
    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    try {
      await posService.users.create(form);
      addToast(`Staff member "${form.name}" added successfully!`, 'success');
      setShowAddModal(false);
      setForm({ name: '', email: '', password: '', phone: '', role: 'WAITER' });
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Failed to create staff member', 'error');
    }
  };

  const handleOpenEdit = (usr) => {
    setEditingStaff(usr);
    setEditForm({
      name: usr.name || '',
      phone: usr.phone || '',
      role: usr.role || 'WAITER',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editForm.name.trim()) {
      addToast('Name is required', 'warning');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    try {
      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        role: editForm.role,
        ...(editForm.password ? { password: editForm.password } : {}),
      };

      await posService.users.update(editingStaff.id, payload);
      addToast(`Staff details for "${editForm.name}" updated!`, 'success');
      setShowEditModal(false);
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Failed to update staff member', 'error');
    }
  };

  const handleToggleStatus = async (usr) => {
    const nextState = !usr.isActive;
    const actionText = nextState ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} staff account for "${usr.name}"?`)) {
      return;
    }

    try {
      await posService.users.toggleStatus(usr.id, nextState);
      addToast(`Account for "${usr.name}" is now ${nextState ? 'ACTIVE' : 'DEACTIVATED'}`, 'success');
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Failed to update account status', 'error');
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Permanently remove ${name} from restaurant staff roster?`)) return;
    try {
      await posService.users.delete(id);
      addToast(`${name} removed from roster`, 'success');
      fetchStaff();
    } catch (err) {
      addToast(err.message || 'Failed to remove user', 'error');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'RESTAURANT_OWNER':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'KITCHEN_ADMIN':
        return <ChefHat className="w-4 h-4 text-amber-400" />;
      case 'WAITER':
        return <Coffee className="w-4 h-4 text-blue-400" />;
      case 'RECEPTIONIST':
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      default:
        return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Manage Staff & Access Control</span>
          </h1>
          <p className="text-sm text-slate-400">
            Create, edit, activate/deactivate, and configure role credentials for restaurant personnel
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Role Quota Tracker Banner (Enforced Capacity: 10 Waiters, 2 Kitchen Admins, 2 Receptionists) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Subscription Role Capacities (Standard Annual Plan)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Waiters Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Waiters</div>
                <div className="text-[10px] text-slate-400">POS & Tables</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-blue-400">
                {waiterCount} / 10
              </span>
              <span className="text-[10px] text-slate-500 block">
                {10 - waiterCount} available
              </span>
            </div>
          </div>

          {/* Kitchen Admins Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Kitchen Admins</div>
                <div className="text-[10px] text-slate-400">KDS & Recipes</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-amber-400">
                {chefCount} / 2
              </span>
              <span className="text-[10px] text-slate-500 block">
                {2 - chefCount} available
              </span>
            </div>
          </div>

          {/* Receptionists Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Receptionists</div>
                <div className="text-[10px] text-slate-400">Billing & Cashier</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-emerald-400">
                {receptionistCount} / 2
              </span>
              <span className="text-[10px] text-slate-500 block">
                {2 - receptionistCount} available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-sm text-slate-400">Loading staff roster...</span>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Staff Members Found</h3>
            <p className="text-xs text-slate-500 mt-1">Add your waiters, kitchen chefs, and receptionists.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Login Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staff.map((usr) => {
                  const isOwner = usr.role === 'RESTAURANT_OWNER';
                  return (
                    <tr key={usr.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{usr.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {isOwner ? 'Restaurant Administrator' : `ID: ${usr.id.slice(0, 8)}`}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-200">
                          {getRoleIcon(usr.role)}
                          <span>
                            {usr.role === 'KITCHEN_ADMIN'
                              ? 'Kitchen Admin'
                              : usr.role === 'RESTAURANT_OWNER'
                              ? 'Restaurant Admin'
                              : usr.role.replace('_', ' ')}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-mono">
                        {usr.email}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {usr.phone || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            usr.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              usr.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{usr.isActive ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!isOwner ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(usr)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Staff Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(usr)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                usr.isActive
                                  ? 'text-rose-400 hover:bg-rose-950/40'
                                  : 'text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                              title={usr.isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStaff(usr.id, usr.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Remove from roster"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Primary Admin</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <span>Add Staff Member</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Assign role and provision credentials within plan capacity limits
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="waiter1@restaurant.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="WAITER">Waiter ({10 - waiterCount} slots left)</option>
                    <option value="KITCHEN_ADMIN">Kitchen Admin ({2 - chefCount} slots left)</option>
                    <option value="RECEPTIONIST">Receptionist ({2 - receptionistCount} slots left)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-emerald-400" />
              <span>Edit Staff Member</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Update name, contact, role or reset password for <span className="text-white font-semibold">{editingStaff.email}</span>
            </p>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN_ADMIN">Kitchen Admin</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (optional)"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
