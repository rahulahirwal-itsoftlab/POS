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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] text-[#1F2937]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E5D8C6] p-5 sm:p-6 rounded-2xl shadow-sandstone">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#92400E]/10 border border-[#92400E]/20 flex items-center justify-center text-[#92400E] shrink-0 shadow-sm">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight">
                Kitchen Admin Dashboard
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-[#92400E] font-bold border border-amber-200">
                KDS Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5B6470] mt-0.5 font-medium">
              Real-time kitchen metrics, table-wise active orders, and automated recipe inventory depletion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] rounded-xl text-xs font-semibold border border-[#E5D8C6] shadow-sandstone hover:shadow-sandstone-md active:scale-95 transition-all cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#92400E]' : 'text-[#5B6470]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 7 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* New Orders */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6470] mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">New Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1F2937] mt-1">{kpis.newOrders}</div>
          <div className="text-[10px] text-[#2563EB] font-semibold mt-1">Awaiting Kitchen</div>
        </div>

        {/* Preparing Orders */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6470] mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Preparing</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D97706]">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1F2937] mt-1">{kpis.preparingOrders}</div>
          <div className="text-[10px] text-[#D97706] font-semibold mt-1">Cooking at Station</div>
        </div>

        {/* Ready Orders */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6470] mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Ready</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#16A34A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1F2937] mt-1">{kpis.readyOrders}</div>
          <div className="text-[10px] text-[#16A34A] font-semibold mt-1">Waiter Pick</div>
        </div>

        {/* Completed Orders Today */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6470] mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E5D8C6] flex items-center justify-center text-[#92400E]">
              <CheckCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1F2937] mt-1">{kpis.completedOrders}</div>
          <div className="text-[10px] text-[#92400E] font-semibold mt-1">Served Today</div>
        </div>

        {/* Low Stock Ingredients */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6470] mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#D97706]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#D97706] mt-1">{kpis.lowStockIngredients}</div>
          <div className="text-[10px] text-[#5B6470] font-semibold mt-1">Below min level</div>
        </div>

        {/* Out of Stock Ingredients */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6470] mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#EF4444]">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#EF4444] mt-1">{kpis.outOfStockIngredients}</div>
          <div className="text-[10px] text-[#EF4444] font-semibold mt-1">Depleted stock</div>
        </div>

        {/* Avg Preparation Time */}
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#5B6470] mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Avg Prep</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#1F2937] mt-1">{kpis.averagePrepTimeMinutes}m</div>
          <div className="text-[10px] text-[#5B6470] font-semibold mt-1">Time to Ready</div>
        </div>
      </div>

      {/* Critical Stock Alerts Bar (if any out of stock or low stock) */}
      {(lowStockList.length > 0 || outOfStockList.length > 0) && (
        <div className="bg-gradient-to-r from-amber-50/90 to-amber-100/50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sandstone card-hover">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#D97706]/15 border border-[#D97706]/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#B45309]">Kitchen Inventory Attention Required</h4>
              <p className="text-[11px] sm:text-xs text-[#5B6470] font-medium mt-0.5">
                {outOfStockList.length > 0
                  ? `${outOfStockList.map((i) => i.name).join(', ')} is completely OUT OF STOCK.`
                  : `${lowStockList.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')} are running low.`}
              </p>
            </div>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-[#92400E] hover:text-[#78350F] px-4 py-2 rounded-xl bg-white border border-[#E5D8C6] shadow-sandstone hover:shadow-sandstone-md active:scale-95 transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              Check Inventory &rarr;
            </button>
          )}
        </div>
      )}

      {/* Table-Wise Orders Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#92400E]/10 flex items-center justify-center text-[#92400E]">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] tracking-tight">Active Table Orders</h2>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-[#1F2937] border border-[#E5D8C6] shadow-sm">
            {tableOrders.length}
          </span>
        </div>
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs font-bold text-[#92400E] hover:text-[#78350F] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table-Wise Orders Grid */}
      {loading && !dashboardData ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin" />
          <span className="text-sm text-[#5B6470] font-medium">Loading live table orders...</span>
        </div>
      ) : tableOrders.length === 0 ? (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-16 text-center shadow-sandstone card-hover">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#E5D8C6] flex items-center justify-center mx-auto mb-4 text-[#9CA3AF]">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#1F2937]">Kitchen is All Clear!</h3>
          <p className="text-sm text-[#5B6470] mt-1">No active food orders currently pending or preparing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tableOrders.map((order) => {
            const isCritical = order.elapsedMinutes > 20 && order.status !== 'READY';
            const isWarning = order.elapsedMinutes > 10 && order.status !== 'READY';

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sandstone card-hover ${
                  order.status === 'READY'
                    ? 'border-[#16A34A]/50 bg-emerald-50/20'
                    : isCritical
                    ? 'border-[#EF4444]/60 bg-rose-50/20'
                    : isWarning
                    ? 'border-[#D97706]/50 bg-amber-50/20'
                    : 'border-[#E5D8C6]'
                }`}
              >
                <div>
                  {/* Card Header: Table Number & Ticket */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-[#1F2937]">
                          Table #{order.tableNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                            order.status === 'PENDING'
                              ? 'bg-[#2563EB]/15 border-[#2563EB]/30 text-[#2563EB]'
                              : order.status === 'ACCEPTED'
                              ? 'bg-[#92400E]/15 border-[#92400E]/30 text-[#92400E]'
                              : order.status === 'IN_PREPARATION'
                              ? 'bg-[#D97706]/15 border-[#D97706]/30 text-[#B45309]'
                              : 'bg-[#16A34A]/15 border-[#16A34A]/30 text-[#16A34A]'
                          }`}
                        >
                          {order.status === 'IN_PREPARATION' ? 'COOKING' : order.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5B6470] mt-1 font-medium">
                        Ticket: <span className="font-mono text-[#1F2937] font-bold">{order.orderNumber}</span> • Waiter:{' '}
                        <span className="text-[#1F2937] font-semibold">{order.waiter}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#E5D8C6] shadow-sm">
                      <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-[#EF4444] animate-pulse' : 'text-[#D97706]'}`} />
                      <span className={isCritical ? 'text-[#EF4444] font-bold' : 'text-[#1F2937] font-semibold'}>
                        {order.elapsedMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="text-xs text-[#B45309] bg-[#D97706]/10 p-2.5 rounded-xl border border-[#D97706]/20 mb-3 font-medium">
                      Note: {order.notes}
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="space-y-2 border-t border-[#E5D8C6] pt-3.5">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-[#FAF7F2] hover:bg-[#F1E8DB] rounded-xl px-3 py-2 border border-[#E5D8C6] transition-colors"
                      >
                        <span className="font-bold text-[#1F2937] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.quantity}
                          </span>
                          <span className="truncate max-w-[170px]">{item.name}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {item.prepTime && (
                            <span className="text-[10px] text-[#5B6470] font-mono">
                              ~{item.prepTime}m
                            </span>
                          )}
                          {!item.hasRecipe && (
                            <span className="text-[9px] uppercase font-bold text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 px-1.5 py-0.5 rounded">
                              No Recipe
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recipe Ingredient Stock BOM Check */}
                  {order.calculatedIngredients && order.calculatedIngredients.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-[#E5D8C6]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#5B6470] uppercase tracking-wider mb-2">
                        <span className="flex items-center gap-1.5 text-[#92400E]">
                          <PackageCheck className="w-3.5 h-3.5" /> Recipe Ingredients
                        </span>
                        <span className="font-mono text-[#5B6470]">
                          {order.calculatedIngredients.filter((i) => i.isSufficient).length}/
                          {order.calculatedIngredients.length} Stock OK
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {order.calculatedIngredients.map((ing, iIdx) => (
                          <div
                            key={iIdx}
                            className={`flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg border ${
                              ing.isSufficient
                                ? 'bg-[#FAF7F2] border-[#E5D8C6] text-[#1F2937]'
                                : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] font-semibold'
                            }`}
                          >
                            <span className="truncate max-w-[130px] flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ing.isSufficient ? 'bg-[#16A34A]' : 'bg-[#EF4444] animate-ping'
                                }`}
                              ></span>
                              {ing.name}
                            </span>
                            <span className="font-mono text-[10px] text-right">
                              <span>Req: {ing.requiredQuantity} {ing.unit}</span>
                              <span className={`ml-1.5 ${ing.isSufficient ? 'text-[#5B6470]' : 'text-[#EF4444] font-bold'}`}>
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
                <div className="pt-4 border-t border-[#E5D8C6] mt-4">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sandstone hover:shadow-sandstone-md cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Accepting...' : 'Accept Order'}</span>
                    </button>
                  )}

                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStartPrep(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] active:scale-95 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sandstone hover:shadow-sandstone-md cursor-pointer disabled:opacity-50"
                    >
                      <Flame className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Starting...' : 'Start Cooking'}</span>
                    </button>
                  )}

                  {order.status === 'IN_PREPARATION' && (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sandstone hover:shadow-sandstone-md cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Marking...' : 'Mark Food Ready (Deduct Stock)'}</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <div className="w-full bg-[#16A34A]/10 border border-[#16A34A]/30 rounded-xl py-2.5 px-3 text-center">
                      <span className="text-xs font-bold text-[#16A34A] flex items-center justify-center gap-1.5">
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
