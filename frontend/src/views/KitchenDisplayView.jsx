import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flame,
  ArrowRight,
  PackageCheck
} from 'lucide-react';

export default function KitchenDisplayView() {
  const { addToast } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await posService.kitchen.getOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load kitchen orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000); // Polling every 8 seconds for live kitchen orders
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.acceptOrder(orderId);
      addToast('Ticket accepted for preparation', 'info');
      fetchOrders();
    } catch (err) {
      addToast(err.message || 'Failed to accept order', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.markReady(orderId);
      addToast('Order marked READY for food runner / waiter', 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.message || 'Failed to mark ready', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkServed = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.markServed(orderId);
      addToast('Order marked SERVED to dining table', 'info');
      fetchOrders();
    } catch (err) {
      addToast(err.message || 'Failed to mark served', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.completeOrder(orderId);
      addToast('Order completed & recipe inventory stock deducted!', 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.message || 'Failed to complete order. Check stock availability.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getElapsedMinutes = (dateStr) => {
    if (!dateStr) return 0;
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diffMs / 60000);
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStage === 'ALL') return true;
    return o.status === filterStage;
  });

  const getStatusColor = (status, mins) => {
    if (status === 'READY') return 'border-emerald-500/50 bg-emerald-950/20';
    if (status === 'SERVED') return 'border-purple-500/50 bg-purple-950/20';
    if (mins > 20) return 'border-rose-500/70 bg-rose-950/25';
    if (mins > 10) return 'border-amber-500/60 bg-amber-950/20';
    return 'border-slate-800 bg-slate-900/90';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-400" />
            <span>Kitchen Display System (KDS)</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time kitchen order tickets, prep stations, and automated inventory depletion
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stage Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: `All Tickets (${orders.length})` },
          { id: 'PENDING', label: `New (${orders.filter((o) => o.status === 'PENDING').length})` },
          { id: 'IN_PREPARATION', label: `Cooking (${orders.filter((o) => o.status === 'IN_PREPARATION').length})` },
          { id: 'READY', label: `Ready (${orders.filter((o) => o.status === 'READY').length})` },
          { id: 'SERVED', label: `Served (${orders.filter((o) => o.status === 'SERVED').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStage(tab.id)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
              filterStage === tab.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-950/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets Grid */}
      {loading && orders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading active tickets...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
          <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">All Clear, Chef!</h3>
          <p className="text-sm text-slate-400 mt-1">No active food orders in this stage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const mins = getElapsedMinutes(order.createdAt);
            const isCritical = mins > 20 && order.status !== 'READY' && order.status !== 'SERVED';
            const cardBg = getStatusColor(order.status, mins);

            return (
              <div
                key={order.id}
                className={`border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-lg ${cardBg}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-lg font-bold text-white">
                        Table #{order.table?.tableNumber || order.tableNumber || 'Takeaway'}
                      </span>
                      <div className="text-[11px] text-slate-400">
                        Ticket #{order.orderNumber || order.id.slice(0, 6)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
                      <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                      <span className={isCritical ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {mins}m
                      </span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-slate-950/60 border-slate-700 text-slate-300">
                      {order.status}
                    </span>
                    {order.notes && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-800/40 mt-2">
                        Note: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Item List */}
                  <div className="space-y-2 border-t border-slate-800/80 pt-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                              {item.quantity}
                            </span>
                            <span>{item.menuItem?.name || item.name}</span>
                          </span>
                        </div>
                        {item.specialInstructions && (
                          <div className="text-[11px] text-rose-300 mt-1 pl-7 italic">
                            • {item.specialInstructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recipe Ingredients Checkpoint (Auto-Calculated BOM) */}
                  {order.calculatedIngredients && order.calculatedIngredients.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1.5">
                        <span className="flex items-center gap-1">
                          <PackageCheck className="w-3.5 h-3.5" /> Recipe BOM Check
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {order.calculatedIngredients.filter((i) => i.isSufficient).length}/{order.calculatedIngredients.length} Stock OK
                        </span>
                      </div>
                      <div className="space-y-1">
                        {order.calculatedIngredients.map((ing, iIdx) => (
                          <div
                            key={iIdx}
                            className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-lg border ${
                              ing.isSufficient
                                ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                                : 'bg-rose-950/40 border-rose-800/60 text-rose-300 font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ing.isSufficient ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'
                                }`}
                              ></span>
                              <span className="truncate max-w-[120px]">{ing.name}</span>
                            </div>
                            <div className="font-mono text-[10px] text-right">
                              <span>Req: {ing.requiredQuantity} {ing.unit}</span>
                              <span className={`ml-1.5 ${ing.isSufficient ? 'text-slate-500' : 'text-rose-400 font-bold'}`}>
                                (Stock: {ing.currentStock})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progressive Action Button */}
                <div className="pt-4 border-t border-slate-800/80 mt-4">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/30"
                    >
                      <Flame className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Accepting...' : 'Start Cooking'}</span>
                    </button>
                  )}

                  {order.status === 'IN_PREPARATION' && (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Marking...' : 'Mark Food Ready'}</span>
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleMarkServed(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-blue-950/30"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Updating...' : 'Mark Served to Table'}</span>
                    </button>
                  )}

                  {order.status === 'SERVED' && (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-purple-950/30"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>{actionLoading === order.id ? 'Completing...' : 'Complete & Deduct Stock'}</span>
                    </button>
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
