import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Boxes,
  Users,
  UtensilsCrossed,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function RestaurantAdminDashboardView({ setActiveTab }) {
  const { restaurant, user, addToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currency = restaurant?.currency || '₹';

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await posService.reports.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load restaurant analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getMethodIcon = (method) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'UPI':
        return <Smartphone className="w-4 h-4 text-purple-400" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-emerald-400" />
              <span>{restaurant?.name || 'Restaurant'} Dashboard</span>
            </h1>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Executive Overview</span>
            </span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Standard Annual Plan (₹5,000/yr)</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytical command center for restaurant operations, sales velocity, inventory, staff quotas, and payments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading analytical intelligence...</span>
        </div>
      ) : (
        <>
          {/* Top Analytical KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Revenue & Today's Sales */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {currency}{Number(data?.sales?.totalRevenue || 0).toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Today's Sales:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {currency}{Number(data?.sales?.todayRevenue || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* KPI 2: Order Volume & Active Tickets */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Orders</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {data?.orders?.totalOrders || 0}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Active Kitchen Orders:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {data?.orders?.activeOrders || 0} in progress
                </span>
              </div>
            </div>

            {/* KPI 3: Operating Expenses & Net Margin */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Expenses & Net Margin</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {currency}{Number(data?.expenses?.totalExpenses || 0).toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Net Estimated Profit:</span>
                <span
                  className={`font-bold font-mono ${
                    (data?.expenses?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currency}{Number(data?.expenses?.netProfit || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* KPI 4: Inventory Alerts & Low-Stock */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Inventory Alerts</span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                    (data?.inventoryAlerts?.lowStockCount || 0) > 0
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono flex items-center gap-2">
                <span>{data?.inventoryAlerts?.lowStockCount || 0}</span>
                <span className="text-xs font-normal text-slate-400">items low</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total Tracked Raw Stock:</span>
                <span className="font-bold text-slate-300 font-mono">
                  {data?.inventoryAlerts?.totalItems || 0} items
                </span>
              </div>
            </div>
          </div>

          {/* Staff Quota & Capacity Status Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Staff Roster & Subscription Role Limits</h3>
                  <p className="text-xs text-slate-400">
                    Enforced capacities under Standard Annual Plan (₹5,000/year)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab && setActiveTab('staff')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Staff Roster</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {/* Waiters */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Waiters</span>
                  <span className="font-mono text-emerald-400 font-bold text-xs">
                    {data?.staff?.waiters || 0} / {data?.staff?.planLimits?.maxWaiters || 10}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((data?.staff?.waiters || 0) / (data?.staff?.planLimits?.maxWaiters || 10)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
                  <span>Dining & table orders</span>
                  <span>{10 - (data?.staff?.waiters || 0)} available</span>
                </div>
              </div>

              {/* Kitchen Admins */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Kitchen Admins</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">
                    {data?.staff?.kitchenAdmins || 0} / {data?.staff?.planLimits?.maxKitchenAdmins || 2}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((data?.staff?.kitchenAdmins || 0) / (data?.staff?.planLimits?.maxKitchenAdmins || 2)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
                  <span>KDS & recipes</span>
                  <span>{2 - (data?.staff?.kitchenAdmins || 0)} available</span>
                </div>
              </div>

              {/* Receptionists */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Receptionists</span>
                  <span className="font-mono text-purple-400 font-bold text-xs">
                    {data?.staff?.receptionists || 0} / {data?.staff?.planLimits?.maxReceptionists || 2}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((data?.staff?.receptionists || 0) / (data?.staff?.planLimits?.maxReceptionists || 2)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex justify-between">
                  <span>Billing & cashier</span>
                  <span>{2 - (data?.staff?.receptionists || 0)} available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Payment Insights + Popular Dishes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Payment Insights (Cash, UPI, Card) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Payment Insights</h3>
                      <p className="text-xs text-slate-400">Distribution across Cash, UPI, and Card transactions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab && setActiveTab('billing')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Bills</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {data?.paymentInsights?.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No payment transactions recorded yet. Settle bills at the Cashier to view payment mode distributions.
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {data?.paymentInsights?.map((p) => (
                      <div key={p.method} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(p.method)}
                            <span className="text-xs font-bold text-white">{p.method}</span>
                            <span className="text-[10px] text-slate-400">({p.count} transactions)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {currency}{Number(p.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({p.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              p.method === 'CASH'
                                ? 'bg-emerald-500'
                                : p.method === 'UPI'
                                ? 'bg-purple-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, p.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Total Paid Invoices: {data?.sales?.totalPaidBills || 0}</span>
                <span className="font-mono text-slate-200">
                  Total Collected: {currency}{Number(data?.sales?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Popular Dishes Leaderboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Popular Dishes</h3>
                      <p className="text-xs text-slate-400">Top ordered menu selections by sales volume</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab && setActiveTab('menu')}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Menu Catalog</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {data?.popularDishes?.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No dish orders recorded yet. As orders are placed in the POS Terminal, top sellers will rank here.
                  </div>
                ) : (
                  <div className="space-y-2.5 mt-4">
                    {data?.popularDishes?.map((dish, idx) => (
                      <div
                        key={dish.id}
                        className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center font-mono">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">{dish.name}</div>
                            <span className="text-[10px] text-slate-400">{dish.category}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-emerald-400">
                            {dish.quantitySold} ordered
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {currency}{Number(dish.revenueGenerated).toLocaleString()} rev
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Ranked by cumulative customer tickets</span>
                <span className="text-emerald-400 font-semibold">Real-time KDS feed</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Inventory Alerts & Quick Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Low-Stock Inventory Alerts */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-rose-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Inventory Stock Warnings</h3>
                    <p className="text-xs text-slate-400">
                      Raw ingredients at or below their defined minimum safety threshold
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab && setActiveTab('inventory')}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Inventory Room</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data?.inventoryAlerts?.items?.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-white">Stock Health Optimal</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    All ingredients are currently above minimum safety thresholds.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {data?.inventoryAlerts?.items?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 border border-rose-950/80 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Min Level: {item.minStockThreshold} {item.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-rose-400 block">
                          {Number(item.currentStock).toFixed(1)} {item.unit}
                        </span>
                        <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          Low Stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Operational Shortcuts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Administrative Control</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">Quick navigation to restaurant management modules</p>

                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab && setActiveTab('staff')}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Manage Staff Roster</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{data?.staff?.total || 0} users</span>
                  </button>

                  <button
                    onClick={() => setActiveTab && setActiveTab('menu')}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                      <span>Menu Selection</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Manage Dishes</span>
                  </button>

                  <button
                    onClick={() => setActiveTab && setActiveTab('inventory')}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-purple-400" />
                      <span>Inventory & Spoilage</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Raw Ingredients</span>
                  </button>

                  <button
                    onClick={() => setActiveTab && setActiveTab('billing')}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-400" />
                      <span>Billing & Payments</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Cash/UPI/Card</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Restaurant Admin: {user?.name || 'Administrator'}</span>
                <span className="text-emerald-400 font-mono">Online</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
