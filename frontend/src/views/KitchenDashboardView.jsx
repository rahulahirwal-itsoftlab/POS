import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Flame,
  ArrowRight,
  PackageCheck,
  AlertCircle,
  TrendingUp,
  LayoutGrid,
  ClipboardList,
  Layers,
  CheckCheck
} from 'lucide-react';

export default function KitchenDashboardView({ setActiveTab }) {
  const { addToast } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await posService.kitchen.getDashboard();
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load kitchen dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 8000); // Polling every 8 seconds for live dashboard
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.acceptOrder(orderId);
      addToast('Ticket accepted by Kitchen Admin', 'info');
      fetchDashboard();
    } catch (err) {
      addToast(err.message || 'Failed to accept order', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartPrep = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.startPreparation(orderId);
      addToast('Order moved to Cooking / IN_PREPARATION', 'info');
      fetchDashboard();
    } catch (err) {
      addToast(err.message || 'Failed to start preparation', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.markReady(orderId);
      addToast('Order marked READY! Recipe ingredients automatically deducted from inventory.', 'success');
      fetchDashboard();
    } catch (err) {
      addToast(err.message || 'Failed to mark ready. Check ingredient stock.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const kpis = dashboardData?.kpis || {
    newOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    lowStockIngredients: 0,
    outOfStockIngredients: 0,
    averagePrepTimeMinutes: 0,
  };

  const tableOrders = dashboardData?.tableOrders || [];
  const lowStockList = dashboardData?.lowStockList || [];
  const outOfStockList = dashboardData?.outOfStockList || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-amber-400" />
            <span>Kitchen Admin Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time kitchen metrics, table-wise active orders, and automated recipe inventory depletion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* New Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">New Orders</span>
            <AlertCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{kpis.newOrders}</div>
          <div className="text-[10px] text-blue-400 font-medium mt-1">Awaiting Kitchen</div>
        </div>

        {/* Preparing Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Preparing</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{kpis.preparingOrders}</div>
          <div className="text-[10px] text-amber-400 font-medium mt-1">Cooking at Station</div>
        </div>

        {/* Ready Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{kpis.readyOrders}</div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1">Runner / Waiter Pick</div>
        </div>

        {/* Completed Orders Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{kpis.completedOrders}</div>
          <div className="text-[10px] text-purple-400 font-medium mt-1">Served / Billed Today</div>
        </div>

        {/* Low Stock Ingredients */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{kpis.lowStockIngredients}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Below threshold</div>
        </div>

        {/* Out of Stock Ingredients */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{kpis.outOfStockIngredients}</div>
          <div className="text-[10px] text-rose-400 font-medium mt-1">Depleted stock</div>
        </div>

        {/* Avg Preparation Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Prep</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300 mt-1">{kpis.averagePrepTimeMinutes}m</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Time to Ready</div>
        </div>
      </div>

      {/* Critical Stock Alerts Bar (if any out of stock or low stock) */}
      {(lowStockList.length > 0 || outOfStockList.length > 0) && (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300">Kitchen Inventory Attention Required</h4>
              <p className="text-[11px] text-amber-200/80">
                {outOfStockList.length > 0
                  ? `${outOfStockList.map((i) => i.name).join(', ')} is completely OUT OF STOCK.`
                  : `${lowStockList.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')} are running low.`}
              </p>
            </div>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-amber-300 hover:text-white px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-700/60 transition-colors whitespace-nowrap cursor-pointer"
            >
              Check Inventory &rarr;
            </button>
          )}
        </div>
      )}

      {/* Table-Wise Orders Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Active Table Orders</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {tableOrders.length}
          </span>
        </div>
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            View All Orders &rarr;
          </button>
        )}
      </div>

      {/* Table-Wise Orders Grid */}
      {loading && !dashboardData ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading live table orders...</span>
        </div>
      ) : tableOrders.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
          <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Kitchen is All Clear!</h3>
          <p className="text-sm text-slate-400 mt-1">No active food orders currently pending or preparing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tableOrders.map((order) => {
            const isCritical = order.elapsedMinutes > 20 && order.status !== 'READY';
            const isWarning = order.elapsedMinutes > 10 && order.status !== 'READY';

            return (
              <div
                key={order.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xl ${
                  order.status === 'READY'
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : isCritical
                    ? 'border-rose-500/60 bg-rose-950/25'
                    : isWarning
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                <div>
                  {/* Card Header: Table Number & Ticket */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-white">
                          Table #{order.tableNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                            order.status === 'PENDING'
                              ? 'bg-blue-950/80 border-blue-800/80 text-blue-300'
                              : order.status === 'ACCEPTED'
                              ? 'bg-indigo-950/80 border-indigo-800/80 text-indigo-300'
                              : order.status === 'IN_PREPARATION'
                              ? 'bg-amber-950/80 border-amber-800/80 text-amber-300'
                              : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
                          }`}
                        >
                          {order.status === 'IN_PREPARATION' ? 'COOKING' : order.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Ticket: <span className="font-mono text-slate-300">{order.orderNumber}</span> • Waiter:{' '}
                        <span className="text-slate-300 font-medium">{order.waiter}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                      <span className={isCritical ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {order.elapsedMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-xl border border-amber-800/40 mb-3">
                      Note: {order.notes}
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-slate-950/50 rounded-xl px-3 py-2 border border-slate-800/60"
                      >
                        <span className="font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.quantity}
                          </span>
                          <span className="truncate max-w-[180px]">{item.name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {item.prepTime && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ~{item.prepTime}m
                            </span>
                          )}
                          {!item.hasRecipe && (
                            <span className="text-[9px] uppercase font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded">
                              No Recipe
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recipe Ingredient Stock BOM Check */}
                  {order.calculatedIngredients && order.calculatedIngredients.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1 text-amber-300">
                          <PackageCheck className="w-3.5 h-3.5" /> Recipe Ingredients
                        </span>
                        <span className="font-mono text-slate-400">
                          {order.calculatedIngredients.filter((i) => i.isSufficient).length}/
                          {order.calculatedIngredients.length} Stock OK
                        </span>
                      </div>
                      <div className="space-y-1">
                        {order.calculatedIngredients.map((ing, iIdx) => (
                          <div
                            key={iIdx}
                            className={`flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg border ${
                              ing.isSufficient
                                ? 'bg-slate-950/70 border-slate-800 text-slate-300'
                                : 'bg-rose-950/50 border-rose-800/80 text-rose-300 font-semibold'
                            }`}
                          >
                            <span className="truncate max-w-[130px] flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ing.isSufficient ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'
                                }`}
                              ></span>
                              {ing.name}
                            </span>
                            <span className="font-mono text-[10px] text-right">
                              <span>Req: {ing.requiredQuantity} {ing.unit}</span>
                              <span className={`ml-1.5 ${ing.isSufficient ? 'text-slate-500' : 'text-rose-400 font-bold'}`}>
                                (Stock: {ing.currentStock})
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progressive Kitchen Action Button */}
                <div className="pt-4 border-t border-slate-800/80 mt-4">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-blue-950/40 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Accepting...' : 'Accept Order'}</span>
                    </button>
                  )}

                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStartPrep(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Starting...' : 'Start Cooking'}</span>
                    </button>
                  )}

                  {order.status === 'IN_PREPARATION' && (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Marking...' : 'Mark Food Ready (Deduct Stock)'}</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <div className="w-full bg-emerald-950/40 border border-emerald-500/40 rounded-xl py-2 px-3 text-center">
                      <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ready for Waiter Delivery</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
