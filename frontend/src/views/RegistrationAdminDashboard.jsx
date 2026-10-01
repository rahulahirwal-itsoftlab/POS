import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  Power,
  Mail,
  User,
  Phone,
  MapPin,
  Sparkles,
  Users,
  LayoutGrid,
  Layers,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Edit3,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function RegistrationAdminDashboard() {
  const { addToast } = useAuth();
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'plans'
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Onboarding Modal State
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [submittingOnboard, setSubmittingOnboard] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    restaurantName: '',
    address: '',
    currency: '₹',
    taxRate: 5,
    planId: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    phone: '',
  });

  // Manage Subscription Modal State
  const [selectedRestForSub, setSelectedRestForSub] = useState(null);
  const [submittingSub, setSubmittingSub] = useState(false);
  const [subForm, setSubForm] = useState({
    planId: '',
    status: 'ACTIVE',
    durationDays: 30,
  });

  // Reset Credentials Modal State
  const [selectedRestForReset, setSelectedRestForReset] = useState(null);
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetForm, setResetForm] = useState({
    newEmail: '',
    newPassword: '',
  });

  // Create / Edit Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: 5000,
    durationDays: 365,
    maxStaff: 14,
    maxWaiters: 10,
    maxKitchenAdmins: 2,
    maxReceptionists: 2,
    maxTables: 10,
    maxMenuItems: 50,
    features: '',
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, restRes, plansRes] = await Promise.all([
        posService.superAdmin.getOverview(),
        posService.superAdmin.getRestaurants(),
        posService.superAdmin.getPlans(),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (restRes.success && restRes.data) {
        setRestaurants(restRes.data);
      }
      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
        if (!onboardForm.planId && plansRes.data.length > 0) {
          setOnboardForm((prev) => ({ ...prev, planId: plansRes.data[0].id }));
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to load platform data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (restaurant) => {
    const nextStatus = !restaurant.isActive;
    const actionText = nextStatus ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionText} "${restaurant.name}"? Suspended restaurants cannot process orders or sign in.`)) {
      return;
    }

    try {
      const res = await posService.superAdmin.updateStatus(restaurant.id, nextStatus);
      if (res.success) {
        addToast(`Restaurant "${restaurant.name}" is now ${nextStatus ? 'ACTIVE' : 'SUSPENDED'}`, 'success');
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update restaurant status', 'error');
    }
  };

  const handleOpenSubModal = (rest) => {
    setSelectedRestForSub(rest);
    setSubForm({
      planId: rest.subscription?.planId || (plans[0]?.id || ''),
      status: rest.subscription?.status || 'ACTIVE',
      durationDays: 30,
    });
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    if (!selectedRestForSub) return;

    setSubmittingSub(true);
    try {
      const res = await posService.superAdmin.updateSubscription(selectedRestForSub.id, {
        planId: subForm.planId,
        status: subForm.status,
        durationDays: Number(subForm.durationDays) || undefined,
      });
      if (res.success) {
        addToast(`Subscription updated for "${selectedRestForSub.name}"`, 'success');
        setSelectedRestForSub(null);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update subscription', 'error');
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleOpenResetModal = (rest) => {
    setSelectedRestForReset(rest);
    setResetForm({
      newEmail: rest.owner?.email || '',
      newPassword: '',
    });
  };

  const handleResetCredentials = async (e) => {
    e.preventDefault();
    if (!selectedRestForReset) return;
    if (!resetForm.newEmail && !resetForm.newPassword) {
      addToast('Please provide a new email or password', 'warning');
      return;
    }
    if (resetForm.newPassword && resetForm.newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setSubmittingReset(true);
    try {
      const payload = {
        newEmail: resetForm.newEmail.trim() || undefined,
        newPassword: resetForm.newPassword || undefined,
      };
      const res = await posService.superAdmin.resetOwnerCredentials(selectedRestForReset.id, payload);
      if (res.success) {
        addToast(`Owner credentials updated for "${selectedRestForReset.name}"`, 'success');
        setSelectedRestForReset(null);
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update credentials', 'error');
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardForm.restaurantName.trim() || !onboardForm.ownerName.trim() || !onboardForm.ownerEmail.trim() || !onboardForm.password) {
      addToast('Please fill all required fields (*)', 'warning');
      return;
    }
    if (onboardForm.password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setSubmittingOnboard(true);
    try {
      const payload = {
        name: onboardForm.restaurantName.trim(),
        address: onboardForm.address.trim() || undefined,
        currency: onboardForm.currency.trim() || '₹',
        taxRate: Number(onboardForm.taxRate) || 5.0,
        planId: onboardForm.planId || undefined,
        owner: {
          name: onboardForm.ownerName.trim(),
          email: onboardForm.ownerEmail.trim(),
          password: onboardForm.password,
          phone: onboardForm.phone.trim() || undefined,
        },
      };

      const res = await posService.superAdmin.onboardRestaurant(payload);
      if (res.success) {
        addToast(`Tenant "${onboardForm.restaurantName}" successfully provisioned!`, 'success');
        setShowOnboardModal(false);
        setOnboardForm({
          restaurantName: '',
          address: '',
          currency: '₹',
          taxRate: 5,
          planId: plans[0]?.id || '',
          ownerName: '',
          ownerEmail: '',
          password: '',
          phone: '',
        });
        fetchData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to onboard restaurant', 'error');
    } finally {
      setSubmittingOnboard(false);
    }
  };

  const handleAutofillOnboard = () => {
    const rnd = Math.floor(100 + Math.random() * 900);
    setOnboardForm({
      restaurantName: `Heritage Kitchen #${rnd}`,
      address: `${rnd} Mahatma Gandhi Marg, South City`,
      currency: '₹',
      taxRate: 5,
      planId: plans[0]?.id || '',
      ownerName: 'Sunil Kapoor',
      ownerEmail: `sunil.kitchen${rnd}@pos.com`,
      password: 'Password123',
      phone: '+91 9811223344',
    });
    addToast('Sample onboarding data populated!', 'info');
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      description: '',
      price: 5000,
      durationDays: 365,
      maxStaff: 14,
      maxWaiters: 10,
      maxKitchenAdmins: 2,
      maxReceptionists: 2,
      maxTables: 15,
      maxMenuItems: 75,
      features: 'Full POS, Real-time KDS, Recipe BOM, Inventory Tracking, Multi-role Support',
      isActive: true,
    });
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: Number(plan.price) || 0,
      durationDays: plan.durationDays || 365,
      maxStaff: plan.maxStaff || 14,
      maxWaiters: plan.maxWaiters || 10,
      maxKitchenAdmins: plan.maxKitchenAdmins || 2,
      maxReceptionists: plan.maxReceptionists || 2,
      maxTables: plan.maxTables || 10,
      maxMenuItems: plan.maxMenuItems || 50,
      features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
      isActive: plan.isActive,
    });
    setShowPlanModal(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      addToast('Plan name is required', 'warning');
      return;
    }

    setSubmittingPlan(true);
    try {
      const payload = {
        name: planForm.name.trim(),
        description: planForm.description.trim() || undefined,
        price: Number(planForm.price),
        durationDays: Number(planForm.durationDays),
        maxStaff: Number(planForm.maxStaff),
        maxWaiters: Number(planForm.maxWaiters),
        maxKitchenAdmins: Number(planForm.maxKitchenAdmins),
        maxReceptionists: Number(planForm.maxReceptionists),
        maxTables: Number(planForm.maxTables),
        maxMenuItems: Number(planForm.maxMenuItems),
        features: planForm.features.split(',').map((f) => f.trim()).filter(Boolean),
        isActive: planForm.isActive,
      };

      if (editingPlan) {
        await posService.superAdmin.updatePlan(editingPlan.id, payload);
        addToast(`Plan "${planForm.name}" updated successfully!`, 'success');
      } else {
        await posService.superAdmin.createPlan(payload);
        addToast(`Plan "${planForm.name}" created successfully!`, 'success');
      }
      setShowPlanModal(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to save plan', 'error');
    } finally {
      setSubmittingPlan(false);
    }
  };

  // Filter restaurants
  const filteredRestaurants = restaurants.filter((r) => {
    const matchQuery =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.owner?.name && r.owner.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.owner?.email && r.owner.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.address && r.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.subscription?.plan?.name && r.subscription.plan.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && r.isActive) ||
      (statusFilter === 'SUSPENDED' && !r.isActive);

    return matchQuery && matchStatus;
  });

  const totalTenants = overview?.totalRestaurants ?? restaurants.length;
  const activeTenants = overview?.activeRestaurants ?? restaurants.filter((r) => r.isActive).length;
  const suspendedTenants = overview?.inactiveRestaurants ?? (totalTenants - activeTenants);
  const totalUsers = overview?.totalPlatformUsers ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/40">
              Platform Super Admin
            </span>
            <span className="text-xs text-slate-500">• Multi-Tenant SaaS Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <Building2 className="w-6 h-6 text-purple-400" />
            <span>Platform Governance & Tenant Subscriptions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage restaurant customer tenants, provision owner credentials, govern subscription plans, and monitor platform-wide metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Platform Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          {activeTab === 'plans' ? (
            <button
              onClick={handleOpenCreatePlan}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-950/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Subscription Plan</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOnboardModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-950/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Restaurant Tenant</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Registered Tenants</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{totalTenants}</div>
          <div className="text-[11px] text-slate-500 mt-1">Platform customer accounts</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Subscriptions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">{activeTenants}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Operational with valid plan</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Suspended Tenants</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">{suspendedTenants}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Blocked from terminal access</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Platform Users</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{totalUsers}</div>
          <div className="text-[11px] text-slate-500 mt-1">Owners, chefs, waiters, cashiers</div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tenants'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenants & Subscriptions ({totalTenants})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscription Plans ({plans.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: TENANTS & SUBSCRIPTIONS */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by restaurant name, owner email, plan, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'ACTIVE', 'SUSPENDED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    statusFilter === f
                      ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {f === 'ALL' ? `All (${totalTenants})` : f === 'ACTIVE' ? `Active (${activeTenants})` : `Suspended (${suspendedTenants})`}
                </button>
              ))}
            </div>
          </div>

          {/* Tenants Grid */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-400">Loading customer tenants...</span>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Tenants Found</h3>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search query or onboard a new establishment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {filteredRestaurants.map((rest) => {
                const sub = rest.subscription;
                const plan = sub?.plan;
                const isSuspended = !rest.isActive || sub?.status === 'SUSPENDED';

                return (
                  <div
                    key={rest.id}
                    className={`bg-slate-900/90 border rounded-2xl p-5 transition-all shadow-lg flex flex-col justify-between ${
                      !isSuspended ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/60 bg-rose-950/10'
                    }`}
                  >
                    <div>
                      {/* Tenant Title & Badges */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-white">{rest.name}</h3>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                !isSuspended
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              }`}
                            >
                              {!isSuspended ? 'Active' : 'Suspended'}
                            </span>

                            {plan && (
                              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{plan.name}</span>
                              </span>
                            )}
                          </div>
                          {rest.address && (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{rest.address}</span>
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                            {rest.currency} | Tax: {rest.taxRate}%
                          </span>
                        </div>
                      </div>

                      {/* Owner Information Box */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 my-3 space-y-2">
                        <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>Restaurant Administrator / Owner</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal">Tenant Admin</span>
                        </div>
                        {rest.owner ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Name</span>
                              <span className="text-slate-200 font-semibold">{rest.owner.name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Login Email</span>
                              <span className="text-slate-200 font-mono text-[11px] truncate block">{rest.owner.email}</span>
                            </div>
                            {rest.owner.phone && (
                              <div>
                                <span className="text-slate-500 block text-[10px]">Phone</span>
                                <span className="text-slate-300 font-mono">{rest.owner.phone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-400 italic">No admin user assigned</div>
                        )}
                      </div>

                      {/* Plan Limits & Current Usage Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center py-2.5 border-y border-slate-800/60 my-3 bg-slate-950/40 rounded-xl">
                        <div>
                          <div className="text-xs font-bold text-white">
                            {rest.roleCounts?.waiters ?? 0}
                            <span className="text-slate-500 text-[10px]"> / {plan?.maxWaiters ?? 10}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Waiters</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {rest.roleCounts?.kitchenAdmins ?? 0}
                            <span className="text-slate-500 text-[10px]"> / {plan?.maxKitchenAdmins ?? 2}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Kitchen Admins</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {rest.roleCounts?.receptionists ?? 0}
                            <span className="text-slate-500 text-[10px]"> / {plan?.maxReceptionists ?? 2}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Receptionists</div>
                        </div>
                      </div>
                    </div>

                    {/* Super Admin Action Controls */}
                    <div className="flex items-center justify-between gap-2 pt-2 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => handleOpenSubModal(rest)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 text-xs font-semibold py-2 px-3 rounded-xl border border-purple-800/40 transition-colors cursor-pointer"
                        title="Manage Plan & Limits"
                      >
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <span>Manage Subscription</span>
                      </button>

                      <button
                        onClick={() => handleOpenResetModal(rest)}
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                        title="Reset Owner Credentials"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Reset Login</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(rest)}
                        className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border transition-colors cursor-pointer ${
                          rest.isActive
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title={rest.isActive ? 'Suspend Restaurant' : 'Activate Restaurant'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{rest.isActive ? 'Suspend' : 'Activate'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SUBSCRIPTION PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  p.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{p.description || 'SaaS subscription tier'}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        p.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  <div className="my-4 pb-4 border-b border-slate-800">
                    <div className="text-3xl font-extrabold text-white">
                      ₹{Number(p.price).toLocaleString()}
                      <span className="text-xs text-slate-400 font-normal"> / {p.durationDays} days</span>
                    </div>
                    <div className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{p.activeSubscribers || 0} active restaurant subscribers</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                      Included Capacity Limits
                    </span>
                    <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/60">
                      <span>Waiters:</span>
                      <span className="font-bold text-white">{p.maxWaiters ?? 10} Staff</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/60">
                      <span>Kitchen Admins:</span>
                      <span className="font-bold text-white">{p.maxKitchenAdmins ?? 2} Staff</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/60">
                      <span>Receptionists:</span>
                      <span className="font-bold text-white">{p.maxReceptionists ?? 2} Staff</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/60">
                      <span>Max Dining Tables:</span>
                      <span className="font-bold text-white">{p.maxTables} Tables</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 py-1 border-b border-slate-800/60">
                      <span>Max Menu Items:</span>
                      <span className="font-bold text-white">{p.maxMenuItems} Dishes</span>
                    </div>
                  </div>

                  {Array.isArray(p.features) && p.features.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                        Feature Modules
                      </span>
                      {p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenEditPlan(p)}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Edit Plan & Limits</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONBOARD RESTAURANT MODAL */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span>Onboard New Restaurant Tenant</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Provisions tenant database space, creates Owner account, and links Subscription Plan
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutofillOnboard}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 bg-purple-950/40 border border-purple-800/40 px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-fill Demo</span>
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bukhara Spice Kitchen"
                  value={onboardForm.restaurantName}
                  onChange={(e) => setOnboardForm({ ...onboardForm, restaurantName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Subscription Plan *</label>
                <select
                  value={onboardForm.planId}
                  onChange={(e) => setOnboardForm({ ...onboardForm, planId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{Number(p.price).toLocaleString()} / year ({p.maxWaiters ?? 10} Waiters, {p.maxKitchenAdmins ?? 2} Kitchen Admins, {p.maxReceptionists ?? 2} Receptionists)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={onboardForm.currency}
                    onChange={(e) => setOnboardForm({ ...onboardForm, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="₹ or $"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={onboardForm.taxRate}
                    onChange={(e) => setOnboardForm({ ...onboardForm, taxRate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location / Address</label>
                <input
                  type="text"
                  placeholder="e.g. 104 MG Road, Bangalore"
                  value={onboardForm.address}
                  onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase text-purple-400 block mb-2">
                  Restaurant Administrator Credentials
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alok Verma"
                      value={onboardForm.ownerName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={onboardForm.phone}
                      onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="owner@example.com"
                      value={onboardForm.ownerEmail}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={onboardForm.password}
                      onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOnboard}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  {submittingOnboard ? 'Onboarding Establishment...' : 'Onboard Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE SUBSCRIPTION MODAL */}
      {selectedRestForSub && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              <span>Manage Plan & Subscription</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure subscription tier for <span className="text-white font-semibold">{selectedRestForSub.name}</span>
            </p>

            <form onSubmit={handleUpdateSubscription} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Plan</label>
                <select
                  value={subForm.planId}
                  onChange={(e) => setSubForm({ ...subForm, planId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{Number(p.price).toLocaleString()} / year ({p.maxWaiters ?? 10} Waiters, {p.maxKitchenAdmins ?? 2} Kitchen Admins, {p.maxReceptionists ?? 2} Receptionists)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Status</label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ACTIVE">ACTIVE (Normal Operations)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily Blocked)</option>
                  <option value="EXPIRED">EXPIRED (Renewal Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Extend Duration (Days from now)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={subForm.durationDays}
                  onChange={(e) => setSubForm({ ...subForm, durationDays: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRestForSub(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSub}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  {submittingSub ? 'Updating...' : 'Save Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET OWNER CREDENTIALS MODAL */}
      {selectedRestForReset && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Reset Owner Credentials</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Update login credentials for <span className="text-white font-semibold">{selectedRestForReset.name}</span>
            </p>

            <form onSubmit={handleResetCredentials} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Owner Email</label>
                <input
                  type="email"
                  placeholder="Leave as is or enter new email"
                  value={resetForm.newEmail}
                  onChange={(e) => setResetForm({ ...resetForm, newEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRestForReset(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  {submittingReset ? 'Updating...' : 'Save New Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span>{editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Define pricing and resource capacity limits for restaurant tenants
            </p>

            <form onSubmit={handlePlanSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Growth Plan"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. For expanding restaurants and bistros"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase text-purple-400 block mb-2">
                  Enforced Resource Limits
                </span>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Max Waiters</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.maxWaiters}
                      onChange={(e) => setPlanForm({ ...planForm, maxWaiters: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Kitchen Admins</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.maxKitchenAdmins}
                      onChange={(e) => setPlanForm({ ...planForm, maxKitchenAdmins: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Receptionists</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.maxReceptionists}
                      onChange={(e) => setPlanForm({ ...planForm, maxReceptionists: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Max Tables</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.maxTables}
                      onChange={(e) => setPlanForm({ ...planForm, maxTables: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Max Dishes</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.maxMenuItems}
                      onChange={(e) => setPlanForm({ ...planForm, maxMenuItems: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Features (comma separated)</label>
                <input
                  type="text"
                  placeholder="POS Terminal, Kitchen Display, Inventory BOM, Reports"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="planActiveCheck"
                  checked={planForm.isActive}
                  onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-0"
                />
                <label htmlFor="planActiveCheck" className="text-xs text-slate-300">
                  Plan is active for onboarding
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  {submittingPlan ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
