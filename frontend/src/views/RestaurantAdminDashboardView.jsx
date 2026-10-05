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
        return <Banknote className="w-4 h-4 text-[#16A34A]" />;
      case 'UPI':
        return <Smartphone className="w-4 h-4 text-[#92400E]" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-[#2563EB]" />;
      default:
        return <Receipt className="w-4 h-4 text-[#5B6470]" />;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] text-[#1F2937]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E5D8C6] p-5 rounded-2xl shadow-sandstone">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-[#92400E]" />
              <span>{restaurant?.name || 'Restaurant'} Dashboard</span>
            </h1>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#92400E]/10 text-[#92400E] border border-[#92400E]/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Executive Overview</span>
            </span>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Standard Annual Plan (₹5,000/yr)</span>
            </span>
          </div>
          <p className="text-xs text-[#5B6470] mt-1 font-medium">
            Real-time analytical command center for restaurant operations, sales velocity, inventory, staff quotas, and payments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] text-xs font-semibold px-3.5 py-2 rounded-xl border border-[#E5D8C6] transition-colors cursor-pointer shadow-sm"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#92400E]' : 'text-[#5B6470]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin" />
          <span className="text-sm text-[#5B6470] font-medium">Loading analytical intelligence...</span>
        </div>
      ) : (
        <>
          {/* Top Analytical KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Revenue & Today's Sales */}
            <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone hover:shadow-sandstone-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-[#5B6470] mb-2">
                <span className="text-xs font-semibold">Total Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/20 flex items-center justify-center text-[#16A34A]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#1F2937] font-mono">
                {currency}{Number(data?.sales?.totalRevenue || 0).toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5D8C6] flex items-center justify-between text-[11px]">
                <span className="text-[#5B6470]">Today's Sales:</span>
                <span className="font-bold text-[#16A34A] font-mono">
                  {currency}{Number(data?.sales?.todayRevenue || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* KPI 2: Order Volume & Active Tickets */}
            <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone hover:shadow-sandstone-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-[#5B6470] mb-2">
                <span className="text-xs font-semibold">Total Orders</span>
                <div className="w-8 h-8 rounded-xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center text-[#D97706]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#1F2937] font-mono">
                {data?.orders?.totalOrders || 0}
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5D8C6] flex items-center justify-between text-[11px]">
                <span className="text-[#5B6470]">Active Kitchen Orders:</span>
                <span className="font-bold text-[#D97706] font-mono">
                  {data?.orders?.activeOrders || 0} in progress
                </span>
              </div>
            </div>

            {/* KPI 3: Operating Expenses & Net Margin */}
            <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone hover:shadow-sandstone-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-[#5B6470] mb-2">
                <span className="text-xs font-semibold">Expenses & Net Margin</span>
                <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB]">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#1F2937] font-mono">
                {currency}{Number(data?.expenses?.totalExpenses || 0).toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5D8C6] flex items-center justify-between text-[11px]">
                <span className="text-[#5B6470]">Net Estimated Profit:</span>
                <span
                  className={`font-bold font-mono ${
                    (data?.expenses?.netProfit || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#EF4444]'
                  }`}
                >
                  {currency}{Number(data?.expenses?.netProfit || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* KPI 4: Inventory Alerts & Low-Stock */}
            <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone hover:shadow-sandstone-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-[#5B6470] mb-2">
                <span className="text-xs font-semibold">Inventory Alerts</span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                    (data?.inventoryAlerts?.lowStockCount || 0) > 0
                      ? 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]'
                      : 'bg-[#16A34A]/10 border-[#16A34A]/20 text-[#16A34A]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#1F2937] font-mono flex items-center gap-2">
                <span>{data?.inventoryAlerts?.lowStockCount || 0}</span>
                <span className="text-xs font-normal text-[#5B6470]">items low</span>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E5D8C6] flex items-center justify-between text-[11px]">
                <span className="text-[#5B6470]">Total Tracked Raw Stock:</span>
                <span className="font-bold text-[#1F2937] font-mono">
                  {data?.inventoryAlerts?.totalItems || 0} items
                </span>
              </div>
            </div>
          </div>

          {/* Staff Quota & Capacity Status Box */}
          <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E5D8C6]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#92400E]" />
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Staff Roster & Subscription Role Limits</h3>
                  <p className="text-xs text-[#5B6470]">
                    Enforced capacities under Standard Annual Plan (₹5,000/year)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab && setActiveTab('staff')}
                className="text-xs font-semibold text-[#92400E] hover:text-[#78350F] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Manage Staff Roster</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {/* Waiters */}
              <div className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#1F2937]">Waiters</span>
                  <span className="font-mono text-[#16A34A] font-bold text-xs">
                    {data?.staff?.waiters || 0} / {data?.staff?.planLimits?.maxWaiters || 10}
                  </span>
                </div>
                <div className="w-full bg-[#E7DCCB] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#16A34A] h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((data?.staff?.waiters || 0) / (data?.staff?.planLimits?.maxWaiters || 10)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-[#5B6470] mt-1.5 flex justify-between font-medium">
                  <span>Dining & table orders</span>
                  <span>{10 - (data?.staff?.waiters || 0)} available</span>
                </div>
              </div>

              {/* Kitchen Admins */}
              <div className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#1F2937]">Kitchen Admins</span>
                  <span className="font-mono text-[#D97706] font-bold text-xs">
                    {data?.staff?.kitchenAdmins || 0} / {data?.staff?.planLimits?.maxKitchenAdmins || 2}
                  </span>
                </div>
                <div className="w-full bg-[#E7DCCB] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#D97706] h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((data?.staff?.kitchenAdmins || 0) / (data?.staff?.planLimits?.maxKitchenAdmins || 2)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-[#5B6470] mt-1.5 flex justify-between font-medium">
                  <span>KDS & recipes</span>
                  <span>{2 - (data?.staff?.kitchenAdmins || 0)} available</span>
                </div>
              </div>

              {/* Receptionists */}
              <div className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#1F2937]">Receptionists</span>
                  <span className="font-mono text-[#2563EB] font-bold text-xs">
                    {data?.staff?.receptionists || 0} / {data?.staff?.planLimits?.maxReceptionists || 2}
                  </span>
                </div>
                <div className="w-full bg-[#E7DCCB] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((data?.staff?.receptionists || 0) / (data?.staff?.planLimits?.maxReceptionists || 2)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-[#5B6470] mt-1.5 flex justify-between font-medium">
                  <span>Billing & cashier</span>
                  <span>{2 - (data?.staff?.receptionists || 0)} available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Payment Insights + Popular Dishes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Payment Insights (Cash, UPI, Card) */}
            <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#2563EB]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">Payment Insights</h3>
                      <p className="text-xs text-[#5B6470]">Distribution across Cash, UPI, and Card transactions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab && setActiveTab('billing')}
                    className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View Bills</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {data?.paymentInsights?.length === 0 ? (
                  <div className="py-12 text-center text-[#5B6470] text-xs">
                    No payment transactions recorded yet. Settle bills at the Cashier to view payment mode distributions.
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {data?.paymentInsights?.map((p) => (
                      <div key={p.method} className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(p.method)}
                            <span className="text-xs font-bold text-[#1F2937]">{p.method}</span>
                            <span className="text-[10px] text-[#5B6470]">({p.count} transactions)</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-[#16A34A]">
                              {currency}{Number(p.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-[#5B6470] ml-1.5 font-mono">({p.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-[#E7DCCB] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              p.method === 'CASH'
                                ? 'bg-[#16A34A]'
                                : p.method === 'UPI'
                                ? 'bg-[#92400E]'
                                : 'bg-[#2563EB]'
                            }`}
                            style={{ width: `${Math.min(100, p.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5D8C6] flex items-center justify-between text-xs text-[#5B6470]">
                <span>Total Paid Invoices: {data?.sales?.totalPaidBills || 0}</span>
                <span className="font-mono text-[#1F2937] font-semibold">
                  Total Collected: {currency}{Number(data?.sales?.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Popular Dishes Leaderboard */}
            <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-[#D97706]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">Popular Dishes</h3>
                      <p className="text-xs text-[#5B6470]">Top ordered menu selections by sales volume</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab && setActiveTab('menu')}
                    className="text-xs font-semibold text-[#D97706] hover:text-[#B45309] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Menu Catalog</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {data?.popularDishes?.length === 0 ? (
                  <div className="py-12 text-center text-[#5B6470] text-xs">
                    No dish orders recorded yet. As orders are placed in the POS Terminal, top sellers will rank here.
                  </div>
                ) : (
                  <div className="space-y-2.5 mt-4">
                    {data?.popularDishes?.map((dish, idx) => (
                      <div
                        key={dish.id}
                        className="flex items-center justify-between bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3.5 py-2.5 hover:bg-[#F1E8DB] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#E7DCCB] text-[#1F2937] text-[10px] font-bold flex items-center justify-center font-mono">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#1F2937]">{dish.name}</div>
                            <span className="text-[10px] text-[#5B6470]">{dish.category}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-[#16A34A]">
                            {dish.quantitySold} ordered
                          </div>
                          <div className="text-[10px] text-[#5B6470] font-mono">
                            {currency}{Number(dish.revenueGenerated).toLocaleString()} rev
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5D8C6] text-[11px] text-[#5B6470] flex items-center justify-between">
                <span>Ranked by cumulative customer tickets</span>
                <span className="text-[#16A34A] font-semibold">Real-time KDS feed</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Inventory Alerts & Quick Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Low-Stock Inventory Alerts */}
            <div className="lg:col-span-2 bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#EF4444]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">Inventory Stock Warnings</h3>
                    <p className="text-xs text-[#5B6470]">
                      Raw ingredients at or below their defined minimum safety threshold
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab && setActiveTab('inventory')}
                  className="text-xs font-semibold text-[#EF4444] hover:text-[#DC2626] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Inventory Room</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data?.inventoryAlerts?.items?.length === 0 ? (
                <div className="py-8 text-center text-[#5B6470]">
                  <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2" />
                  <div className="text-xs font-bold text-[#1F2937]">Stock Health Optimal</div>
                  <div className="text-[11px] text-[#5B6470] mt-0.5">
                    All ingredients are currently above minimum safety thresholds.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {data?.inventoryAlerts?.items?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#FAF7F2] border border-[#EF4444]/30 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1F2937]">{item.name}</div>
                        <div className="text-[10px] text-[#5B6470] font-mono">
                          Min Level: {item.minStockThreshold} {item.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#EF4444] block">
                          {Number(item.currentStock).toFixed(1)} {item.unit}
                        </span>
                        <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.5 rounded border border-[#EF4444]/20">
                          Low Stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Operational Shortcuts */}
            <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-2 mb-1">
                  <Sliders className="w-4 h-4 text-[#92400E]" />
                  <span>Administrative Control</span>
                </h3>
                <p className="text-xs text-[#5B6470] mb-4">Quick navigation to restaurant management modules</p>

                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab && setActiveTab('staff')}
                    className="w-full flex items-center justify-between p-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] border border-[#E5D8C6] rounded-xl text-xs font-semibold text-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#16A34A]" />
                      <span>Manage Staff Roster</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5B6470]">{data?.staff?.total || 0} users</span>
                  </button>

                  <button
                    onClick={() => setActiveTab && setActiveTab('menu')}
                    className="w-full flex items-center justify-between p-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] border border-[#E5D8C6] rounded-xl text-xs font-semibold text-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-[#D97706]" />
                      <span>Menu Selection</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5B6470]">Manage Dishes</span>
                  </button>

                  <button
                    onClick={() => setActiveTab && setActiveTab('inventory')}
                    className="w-full flex items-center justify-between p-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] border border-[#E5D8C6] rounded-xl text-xs font-semibold text-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-[#92400E]" />
                      <span>Inventory & Spoilage</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5B6470]">Raw Ingredients</span>
                  </button>

                  <button
                    onClick={() => setActiveTab && setActiveTab('billing')}
                    className="w-full flex items-center justify-between p-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] border border-[#E5D8C6] rounded-xl text-xs font-semibold text-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#2563EB]" />
                      <span>Billing & Payments</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5B6470]">Cash/UPI/Card</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5D8C6] text-[11px] text-[#5B6470] flex items-center justify-between">
                <span>Restaurant Admin: {user?.name || 'Administrator'}</span>
                <span className="text-[#16A34A] font-mono font-medium">Online</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
