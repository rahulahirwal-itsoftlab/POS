import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  LayoutGrid,
  ClipboardList,
  Receipt,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Utensils,
  PlusCircle,
  Eye,
  Send,
  Check,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function WaiterDashboardView({ setActiveTab, onSelectTableForOrder }) {
  const { restaurant, user, addToast } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await posService.waiter.getDashboard();
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      if (isManual) addToast(err.message || 'Failed to refresh dashboard', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(false), 8000);
    return () => clearInterval(interval);
  }, []);

  const handleServeOrder = async (orderId, tableNumber) => {
    setActionLoading(`serve-${orderId}`);
    try {
      await posService.waiter.serveOrder(orderId);
      addToast(`Order for Table #${tableNumber} marked SERVED to customer!`, 'success');
      fetchDashboard(false);
    } catch (err) {
      addToast(err.message || 'Failed to serve order', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliverBill = async (billId, tableNumber) => {
    setActionLoading(`deliver-${billId}`);
    try {
      await posService.waiter.deliverBill(billId);
      addToast(`Bill delivered to Table #${tableNumber}!`, 'success');
      fetchDashboard(false);
    } catch (err) {
      addToast(err.message || 'Failed to mark bill delivered', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestBill = async (orderId, tableNumber) => {
    setActionLoading(`bill-req-${orderId}`);
    try {
      await posService.orders.requestBill(orderId);
      addToast(`Bill requested from Reception for Table #${tableNumber}!`, 'success');
      fetchDashboard(false);
    } catch (err) {
      addToast(err.message || 'Failed to request bill', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const currency = restaurant?.currency || '₹';

  if (loading && !dashboardData) {
    return (
      <div className="h-full flex items-center justify-center bg-[#FAF7F2] p-8">
        <div className="flex flex-col items-center gap-3 text-[#5B6470]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#92400E]" />
          <span className="font-medium text-sm">Loading live Waiter operations...</span>
        </div>
      </div>
    );
  }

  const {
    tableOverview = {},
    orderOverview = {},
    billOverview = {},
    tableOrders = [],
    readyNotifications = [],
    billNotifications = [],
  } = dashboardData || {};

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] text-[#1F2937]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#E5D8C6] shadow-sandstone">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#92400E]/10 border border-[#92400E]/20 flex items-center justify-center text-[#92400E] shrink-0 shadow-sm">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
                Floor Operations & Service Dispatch
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-[#92400E] font-bold border border-amber-200">
                Waiter Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6470] mt-0.5 font-medium">
              Logged in as <span className="text-[#1F2937] font-semibold">{user?.name}</span> • Scoped to{' '}
              <span className="text-[#1F2937] font-semibold">{restaurant?.name || 'Your Restaurant'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] rounded-xl text-xs font-semibold border border-[#E5D8C6] shadow-sandstone hover:shadow-sandstone-md active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#92400E]' : 'text-[#5B6470]'}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('tables');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#92400E] hover:bg-[#78350F] text-white rounded-xl text-xs font-bold shadow-sandstone hover:shadow-sandstone-md active:scale-95 transition-all cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Manage Tables</span>
          </button>
        </div>
      </div>

      {/* Real-time Alert Banners for Ready Orders & Ready Bills */}
      {(readyNotifications.length > 0 || billNotifications.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ready Food Notifications */}
          {readyNotifications.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50/90 to-amber-100/50 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sandstone card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <span>Ready to Serve from Kitchen ({readyNotifications.length})</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300">
                  Action Required
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {readyNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200 shadow-sm text-xs hover:border-amber-300 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-[#1F2937]">
                        Table #{notif.tableNumber} • Order #{notif.orderNumber}
                      </div>
                      <div className="text-[#5B6470] text-[11px]">{notif.itemsCount} dishes freshly prepared</div>
                    </div>
                    <button
                      onClick={() => handleServeOrder(notif.orderId, notif.tableNumber)}
                      disabled={actionLoading === `serve-${notif.orderId}`}
                      className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-bold rounded-xl shadow-sandstone transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Serve</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ready Bill Notifications */}
          {billNotifications.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50/90 to-blue-100/50 border border-blue-300 rounded-2xl p-4 sm:p-5 shadow-sandstone card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span>Bills Ready to Deliver ({billNotifications.length})</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-200/60 px-2 py-0.5 rounded-full border border-blue-300">
                  Reception Generated
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {billNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200 shadow-sm text-xs hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-[#1F2937]">
                        Table #{notif.tableNumber} • {currency}
                        {Number(notif.totalAmount || 0).toFixed(2)}
                      </div>
                      <div className="text-[#5B6470] text-[11px]">Bill #{notif.billNumber}</div>
                    </div>
                    <button
                      onClick={() => handleDeliverBill(notif.billId, notif.tableNumber)}
                      disabled={actionLoading === `deliver-${notif.billId}`}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold rounded-xl shadow-sandstone transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Deliver</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Section - 3 Groups: Tables, Orders, Bills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* A. TABLE OVERVIEW */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5D8C6]">
            <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#92400E]/10 flex items-center justify-center text-[#92400E]">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <span>Table Overview</span>
            </h2>
            <span className="text-xs text-[#5B6470] font-semibold bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E5D8C6]">
              {tableOverview.totalTables || 0} Total
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl hover:bg-emerald-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Available</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-800 mt-1 block">
                {tableOverview.availableTables || 0}
              </span>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl hover:bg-amber-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Occupied</span>
              <span className="text-2xl font-extrabold font-mono text-amber-900 mt-1 block">
                {tableOverview.occupiedTables || 0}
              </span>
            </div>
            <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl hover:bg-rose-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Needs Service</span>
              <span className="text-2xl font-extrabold font-mono text-rose-800 mt-1 block">
                {tableOverview.tablesWaitingForService || 0}
              </span>
            </div>
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl hover:bg-blue-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Waiting Bill</span>
              <span className="text-2xl font-extrabold font-mono text-blue-800 mt-1 block">
                {tableOverview.tablesWaitingForBilling || 0}
              </span>
            </div>
          </div>
        </div>

        {/* B. ORDER OVERVIEW */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5D8C6]">
            <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#92400E]/10 flex items-center justify-center text-[#92400E]">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span>Kitchen & Order Flow</span>
            </h2>
            <span className="text-xs text-[#5B6470] font-semibold bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E5D8C6]">
              Live Flow
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl hover:bg-blue-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">New Queue</span>
              <span className="text-2xl font-extrabold font-mono text-blue-800 mt-1 block">
                {orderOverview.newOrders || 0}
              </span>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl hover:bg-amber-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Cooking Now</span>
              <span className="text-2xl font-extrabold font-mono text-amber-900 mt-1 block">
                {orderOverview.preparingOrders || 0}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl hover:bg-emerald-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Ready Food</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-800 mt-1 block">
                {orderOverview.readyOrders || 0}
              </span>
            </div>
            <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl hover:bg-teal-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Served Today</span>
              <span className="text-2xl font-extrabold font-mono text-teal-800 mt-1 block">
                {orderOverview.servedOrders || 0}
              </span>
            </div>
          </div>
        </div>

        {/* C. BILL OVERVIEW */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5D8C6]">
            <h2 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#92400E]/10 flex items-center justify-center text-[#92400E]">
                <Receipt className="w-4 h-4" />
              </div>
              <span>Guest Billing Dispatch</span>
            </h2>
            <span className="text-xs text-[#5B6470] font-semibold bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E5D8C6]">
              Operational
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl hover:bg-rose-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Unpaid Bills</span>
              <span className="text-2xl font-extrabold font-mono text-rose-800 mt-1 block">
                {billOverview.pendingBills || 0}
              </span>
            </div>
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl hover:bg-blue-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Ready to Deliver</span>
              <span className="text-2xl font-extrabold font-mono text-blue-800 mt-1 block">
                {billOverview.readyToDeliverBills || 0}
              </span>
            </div>
            <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl hover:bg-teal-50 transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Delivered Bills</span>
              <span className="text-2xl font-extrabold font-mono text-teal-800 mt-1 block">
                {billOverview.deliveredBills || 0}
              </span>
            </div>
            <div className="p-3 bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl hover:bg-[#F1E8DB] transition-colors">
              <span className="text-[#5B6470] text-[11px] block font-semibold">Completed Paid</span>
              <span className="text-2xl font-extrabold font-mono text-[#1F2937] mt-1 block">
                {billOverview.completedBills || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* D. TABLE-WISE ORDER STATUS GRID */}
      <div className="bg-white border border-[#E5D8C6] rounded-2xl p-5 sm:p-6 shadow-sandstone space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5D8C6]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#92400E]" />
              <span>Table-wise Service Matrix</span>
            </h2>
            <p className="text-xs text-[#5B6470] mt-0.5">
              Real-time table occupancy, active orders, and one-click staff actions
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Cooking
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Ready
            </span>
          </div>
        </div>

        {tableOrders.length === 0 ? (
          <div className="text-center py-16 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E5D8C6] text-[#5B6470] text-sm">
            <Utensils className="w-10 h-10 mx-auto text-[#9CA3AF] mb-2" />
            <div className="font-bold text-[#1F2937]">No tables configured in this restaurant</div>
            <div className="text-xs text-[#5B6470] mt-1">Configure restaurant tables to begin floor dispatching.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tableOrders.map((t) => {
              const order = t.currentOrder;
              const isReady = order?.status === 'READY';
              const isCooking = ['ACCEPTED', 'IN_PREPARATION'].includes(order?.status);
              const isPending = order?.status === 'PENDING';
              const isServed = order?.status === 'SERVED';
              const isAvailable = t.tableStatus === 'AVAILABLE';

              return (
                <div
                  key={t.tableId}
                  className={`flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all card-hover ${
                    isReady
                      ? 'bg-rose-50/40 border-rose-300'
                      : isCooking
                      ? 'bg-amber-50/40 border-amber-300'
                      : isServed
                      ? 'bg-blue-50/30 border-blue-200'
                      : isAvailable
                      ? 'bg-white border-[#E5D8C6] hover:border-[#92400E]'
                      : 'bg-white border-[#E5D8C6]'
                  }`}
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-base font-extrabold text-[#1F2937] flex items-center gap-1.5">
                        Table #{t.tableNumber}
                        <span className="text-[11px] text-[#5B6470] font-normal">({t.capacity} seats)</span>
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          isReady
                            ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                            : isCooking
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isPending
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : isServed
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {t.operationalStatus}
                      </span>
                    </div>

                    {/* Order Details Body */}
                    {order ? (
                      <div className="space-y-1.5 my-3 text-xs bg-[#FAF7F2] p-3 rounded-xl border border-[#E5D8C6]">
                        <div className="flex justify-between items-center text-[#1F2937]">
                          <span className="font-bold text-[#1F2937] font-mono">#{order.orderNumber}</span>
                          <span className="text-[11px] text-[#5B6470] font-semibold bg-white px-2 py-0.5 rounded-md border border-[#E5D8C6]">
                            {order.itemsCount} Items
                          </span>
                        </div>
                        {order.itemsSummary && (
                          <p className="text-[11px] text-[#5B6470] line-clamp-2 leading-relaxed">
                            {order.itemsSummary}
                          </p>
                        )}
                        {order.bill && (
                          <div className="pt-2 border-t border-[#E5D8C6] flex justify-between text-[11px]">
                            <span className="text-[#5B6470]">Bill: #{order.bill.billNumber}</span>
                            <span className="font-bold text-[#92400E] font-mono">
                              {currency}
                              {Number(order.bill.totalAmount || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="my-7 text-center text-[#9CA3AF] text-xs font-medium italic">
                        Table available for new guests
                      </div>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="pt-3 border-t border-[#E5D8C6] mt-2">
                    {isReady ? (
                      <button
                        onClick={() => handleServeOrder(order.id, t.tableNumber)}
                        disabled={actionLoading === `serve-${order.id}`}
                        className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-bold rounded-xl text-xs shadow-sandstone hover:shadow-sandstone-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>SERVE FOOD</span>
                      </button>
                    ) : order?.bill && !order.bill.isDelivered ? (
                      <button
                        onClick={() => handleDeliverBill(order.bill.id, t.tableNumber)}
                        disabled={actionLoading === `deliver-${order.bill.id}`}
                        className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold rounded-xl text-xs shadow-sandstone hover:shadow-sandstone-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>DELIVER BILL</span>
                      </button>
                    ) : order?.billRequested && !order?.bill ? (
                      <div className="space-y-1">
                        <button
                          disabled
                          className="w-full py-2.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-95"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#D97706] animate-spin" />
                          <span>BILL REQUESTED</span>
                        </button>
                      </div>
                    ) : isAvailable ? (
                      <button
                        onClick={() => {
                          if (onSelectTableForOrder) {
                            onSelectTableForOrder(t);
                          } else if (setActiveTab) {
                            setActiveTab('tables');
                          }
                        }}
                        className="w-full py-2.5 bg-[#92400E] hover:bg-[#78350F] active:scale-95 text-white font-bold rounded-xl text-xs shadow-sandstone hover:shadow-sandstone-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>NEW ORDER</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (onSelectTableForOrder) {
                              onSelectTableForOrder(t);
                            } else if (setActiveTab) {
                              setActiveTab('tables');
                            }
                          }}
                          className="py-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] active:scale-95 text-[#1F2937] font-semibold rounded-xl text-xs border border-[#E5D8C6] shadow-sandstone hover:shadow-sandstone-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-[#92400E]" />
                          <span>ADD ITEMS</span>
                        </button>
                        <button
                          onClick={() => handleRequestBill(order.id, t.tableNumber)}
                          disabled={actionLoading === `bill-req-${order.id}`}
                          className="py-2.5 bg-[#92400E] hover:bg-[#78350F] active:scale-95 text-white font-bold rounded-xl text-xs shadow-sandstone hover:shadow-sandstone-md flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>REQUEST BILL</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
