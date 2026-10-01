import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Building2,
  User,
  Lock,
  Sliders,
  Save,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Percent,
  FileText,
  Volume2,
  Printer
} from 'lucide-react';

export default function SettingsView() {
  const { restaurant, setRestaurant, user, setUser, addToast } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'restaurant' | 'security' | 'preferences'

  // Admin Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Restaurant Information Form
  const [restForm, setRestForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: '₹',
    taxRate: 5,
    serviceChargeRate: 0,
    gstNumber: '',
  });
  const [savingRest, setSavingRest] = useState(false);

  // Security / Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // System Preferences Form (stored in localStorage)
  const [preferences, setPreferences] = useState({
    autoPrintReceipt: true,
    soundNotifications: true,
    showTaxBreakdown: true,
    orderHoldTimeout: 30,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    if (restaurant) {
      setRestForm({
        name: restaurant.name || '',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        currency: restaurant.currency || '₹',
        taxRate: restaurant.taxRate ?? 5,
        serviceChargeRate: restaurant.serviceChargeRate ?? 0,
        gstNumber: restaurant.gstNumber || '',
      });
    }
    const savedPrefs = localStorage.getItem('apexpos_preferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {}
    }
  }, [user, restaurant]);

  // Handle Admin Profile Submit
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      addToast('Admin name is required', 'warning');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await posService.auth.updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
      });

      if (res.success && res.data) {
        if (setUser) setUser((prev) => ({ ...prev, ...res.data }));
        addToast('Admin profile details updated successfully!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update admin profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Restaurant Info Submit
  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    if (!restForm.name.trim()) {
      addToast('Restaurant brand name is required', 'warning');
      return;
    }

    setSavingRest(true);
    try {
      const payload = {
        name: restForm.name.trim(),
        address: restForm.address.trim() || undefined,
        phone: restForm.phone.trim() || undefined,
        email: restForm.email.trim() || undefined,
        currency: restForm.currency.trim() || '₹',
        taxRate: Number(restForm.taxRate),
        serviceChargeRate: Number(restForm.serviceChargeRate),
        gstNumber: restForm.gstNumber.trim() || undefined,
      };

      const res = await posService.restaurant.update(payload);
      if (res.success && res.data) {
        if (setRestaurant) setRestaurant(res.data);
        addToast('Restaurant configuration saved successfully!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update restaurant settings', 'error');
    } finally {
      setSavingRest(false);
    }
  };

  // Handle Password Change Submit
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      addToast('Please enter your current password', 'warning');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'warning');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await posService.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.success) {
        addToast('Security password updated successfully!', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast(err.message || 'Failed to change password. Verify your current password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle System Preferences Save
  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('apexpos_preferences', JSON.stringify(preferences));
    addToast('System operational preferences saved!', 'success');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>Restaurant Settings & Administration</span>
        </h1>
        <p className="text-sm text-slate-400">
          Manage Admin profile, restaurant establishment metadata, password security, and POS terminal preferences
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {(role === 'WAITER'
          ? [
              { id: 'profile', label: 'Staff Profile', icon: User },
              { id: 'security', label: 'Security & Password', icon: Lock },
              { id: 'preferences', label: 'Notification Preferences', icon: Sliders },
            ]
          : role === 'KITCHEN_ADMIN'
          ? [
              { id: 'profile', label: 'Chef Profile', icon: User },
              { id: 'security', label: 'Security & Password', icon: Lock },
              { id: 'preferences', label: 'Kitchen Preferences', icon: Sliders },
            ]
          : [
              { id: 'profile', label: 'Admin Profile', icon: User },
              { id: 'restaurant', label: 'Restaurant Information', icon: Building2 },
              { id: 'security', label: 'Security & Password', icon: Lock },
              { id: 'preferences', label: 'System Preferences', icon: Sliders },
            ]
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ADMIN PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              <span>Restaurant Administrator Profile</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Personal contact details and primary administrator identity for this establishment
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Administrator Full Name *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Used for logging in to this restaurant portal</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone Number</label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Updating Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: RESTAURANT INFORMATION */}
      {activeTab === 'restaurant' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>Restaurant Establishment Information</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Legal brand name, dining location, tax policies, currency symbol, and invoice billing details
            </p>
          </div>

          <form onSubmit={handleSaveRestaurant} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Restaurant Brand Name *</label>
              <input
                type="text"
                required
                value={restForm.name}
                onChange={(e) => setRestForm({ ...restForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Restaurant Phone</label>
                <input
                  type="text"
                  value={restForm.phone}
                  onChange={(e) => setRestForm({ ...restForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Invoicing Email</label>
                <input
                  type="email"
                  value={restForm.email}
                  onChange={(e) => setRestForm({ ...restForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location / Address</label>
              <input
                type="text"
                value={restForm.address}
                onChange={(e) => setRestForm({ ...restForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Currency Symbol</label>
                <input
                  type="text"
                  value={restForm.currency}
                  onChange={(e) => setRestForm({ ...restForm, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default GST / Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={restForm.taxRate}
                  onChange={(e) => setRestForm({ ...restForm, taxRate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Service Charge (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={restForm.serviceChargeRate}
                  onChange={(e) => setRestForm({ ...restForm, serviceChargeRate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tax Registration / GSTIN</label>
              <input
                type="text"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={restForm.gstNumber}
                onChange={(e) => setRestForm({ ...restForm, gstNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingRest}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingRest ? 'Saving...' : 'Save Restaurant Info'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SECURITY & PASSWORD SETTINGS */}
      {activeTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>Security & Password Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Update password credentials for your Restaurant Administrator account
            </p>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Password *</label>
              <input
                type="password"
                required
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password *</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{savingPassword ? 'Updating Password...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SYSTEM & OPERATIONAL PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>System & Operational Preferences</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure terminal automation, audio alerts, and customer receipt printing behaviors
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4 max-w-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Auto-Print Receipt Upon Payment</div>
                    <div className="text-[10px] text-slate-400">Trigger browser print dialog immediately when cashier settles bill</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoPrintReceipt}
                  onChange={(e) => setPreferences({ ...preferences, autoPrintReceipt: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0 w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Sound Notifications for Kitchen Tickets</div>
                    <div className="text-[10px] text-slate-400">Play chime audio when a new order is received at the KDS</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.soundNotifications}
                  onChange={(e) => setPreferences({ ...preferences, soundNotifications: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0 w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Show Tax Breakdown on Receipts</div>
                    <div className="text-[10px] text-slate-400">Display CGST/SGST itemized breakdown on customer bill printouts</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.showTaxBreakdown}
                  onChange={(e) => setPreferences({ ...preferences, showTaxBreakdown: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0 w-4 h-4"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Operational Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
