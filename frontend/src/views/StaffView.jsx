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
  User,
  X
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
        return <Shield className="w-4 h-4 text-[#92400E]" />;
      case 'KITCHEN_ADMIN':
        return <ChefHat className="w-4 h-4 text-[#D97706]" />;
      case 'WAITER':
        return <Coffee className="w-4 h-4 text-[#2563EB]" />;
      case 'RECEPTIONIST':
        return <Receipt className="w-4 h-4 text-[#16A34A]" />;
      default:
        return <Users className="w-4 h-4 text-[#5B6470]" />;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] min-h-screen text-[#1F2937]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#92400E]" />
            <span>Manage Staff & Access Control</span>
          </h1>
          <p className="text-sm text-[#5B6470]">
            Create, edit, activate/deactivate, and configure role credentials for restaurant personnel
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#92400E]/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Role Quota Tracker Banner */}
      <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#D97706]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6470]">
            Subscription Role Capacities (Standard Annual Plan)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Waiters Box */}
          <div className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-200">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1F2937]">Waiters</div>
                <div className="text-[10px] text-[#5B6470]">POS & Tables</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-[#2563EB]">
                {waiterCount} / 10
              </span>
              <span className="text-[10px] text-[#5B6470] block">
                {10 - waiterCount} available
              </span>
            </div>
          </div>

          {/* Kitchen Admins Box */}
          <div className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-200">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1F2937]">Kitchen Admins</div>
                <div className="text-[10px] text-[#5B6470]">KDS & Recipes</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-[#D97706]">
                {chefCount} / 2
              </span>
              <span className="text-[10px] text-[#5B6470] block">
                {2 - chefCount} available
              </span>
            </div>
          </div>

          {/* Receptionists Box */}
          <div className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center border border-emerald-200">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1F2937]">Receptionists</div>
                <div className="text-[10px] text-[#5B6470]">Billing & Cashier</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-[#16A34A]">
                {receptionistCount} / 2
              </span>
              <span className="text-[10px] text-[#5B6470] block">
                {2 - receptionistCount} available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin" />
            <span className="text-sm text-[#5B6470]">Loading staff roster...</span>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-[#5B6470]">
            <Users className="w-12 h-12 text-[#E7DCCB] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1F2937]">No Staff Members Found</h3>
            <p className="text-xs text-[#5B6470] mt-1">Add your waiters, kitchen chefs, and receptionists.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Login Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D8C6]/60">
                {staff.map((usr) => {
                  const isOwner = usr.role === 'RESTAURANT_OWNER';
                  return (
                    <tr key={usr.id} className="hover:bg-[#F1E8DB]/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1F2937] text-sm">{usr.name}</div>
                        <div className="text-[10px] text-[#5B6470] font-mono">
                          {isOwner ? 'Restaurant Administrator' : `ID: ${usr.id.slice(0, 8)}`}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF7F2] border border-[#E5D8C6] text-[#1F2937]">
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
                      <td className="px-5 py-4 text-[#1F2937] font-mono">
                        {usr.email}
                      </td>
                      <td className="px-5 py-4 text-[#5B6470] font-mono">
                        {usr.phone || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            usr.isActive
                              ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                              : 'bg-rose-50 text-[#EF4444] border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              usr.isActive ? 'bg-[#16A34A]' : 'bg-[#EF4444]'
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
                              className="p-1.5 rounded-lg text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] transition-colors cursor-pointer"
                              title="Edit Staff Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(usr)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                usr.isActive
                                  ? 'text-[#EF4444] hover:bg-rose-50'
                                  : 'text-[#16A34A] hover:bg-emerald-50'
                              }`}
                              title={usr.isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStaff(usr.id, usr.name)}
                              className="p-1.5 rounded-lg text-[#5B6470] hover:text-[#EF4444] hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove from roster"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#5B6470] italic">Primary Admin</span>
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#92400E]" />
                  <span>Add Staff Member</span>
                </h3>
                <p className="text-xs text-[#5B6470]">
                  Assign role and provision credentials within plan capacity limits
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="waiter1@restaurant.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E] font-semibold"
                  >
                    <option value="WAITER">Waiter ({10 - waiterCount} slots left)</option>
                    <option value="KITCHEN_ADMIN">Kitchen Admin ({2 - chefCount} slots left)</option>
                    <option value="RECEPTIONIST">Receptionist ({2 - receptionistCount} slots left)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#92400E]/20 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#92400E]" />
                  <span>Edit Staff Member</span>
                </h3>
                <p className="text-xs text-[#5B6470]">
                  Update details for <span className="text-[#1F2937] font-semibold">{editingStaff.email}</span>
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E] font-semibold"
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN_ADMIN">Kitchen Admin</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (optional)"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#92400E]/20 cursor-pointer"
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
