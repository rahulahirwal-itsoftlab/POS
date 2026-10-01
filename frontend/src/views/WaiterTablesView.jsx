import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Users,
  RefreshCw,
  PlusCircle,
  Clock,
  CheckCircle2,
  Receipt,
  Check,
  Search,
  Filter
} from 'lucide-react';

export default function WaiterTablesView({ onSelectTableForOrder, onNavigateToBills }) {
  const { restaurant, addToast } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTables = async () => {
    try {
      const res = await posService.tables.getAll();
      if (res.success && res.data) {
        setTables(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch restaurant tables', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleServeOrder = async (orderId, tableNumber) => {
    setActionLoading(`serve-${orderId}`);
    try {
      await posService.waiter.serveOrder(orderId);
      addToast(`Order for Table #${tableNumber} marked SERVED to customer!`, 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to mark order as served', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliverBill = async (billId, tableNumber) => {
    setActionLoading(`deliver-${billId}`);
    try {
      await posService.waiter.deliverBill(billId);
      addToast(`Bill delivered to Table #${tableNumber}!`, 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to deliver bill', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTables = tables.filter((t) => {
    const matchSearch = String(t.tableNumber).toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (filterStatus === 'OCCUPIED') return t.status === 'OCCUPIED';

    const order = t.orders?.[0];
    if (filterStatus === 'READY') return order?.status === 'READY';
    if (filterStatus === 'PREPARING') return ['ACCEPTED', 'IN_PREPARATION'].includes(order?.status);
    if (filterStatus === 'SERVED') return order?.status === 'SERVED';

    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Floor Tables Management
              </h1>
              <p className="text-xs text-slate-400">
                Operational table assignments, seating, and live order states
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'AVAILABLE', 'PREPARING', 'READY', 'SERVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mr-2" />
          Loading floor tables...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800/60 text-slate-400 text-sm">
          No tables found matching your search and filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredTables.map((t) => {
            const activeOrder = t.orders?.[0];
            const isReady = activeOrder?.status === 'READY';
            const isCooking = ['ACCEPTED', 'IN_PREPARATION'].includes(activeOrder?.status);
            const isPending = activeOrder?.status === 'PENDING';
            const isServed = activeOrder?.status === 'SERVED';
            const isAvailable = t.status === 'AVAILABLE';

            return (
              <div
                key={t.id}
                className={`flex flex-col justify-between p-5 rounded-2xl border transition shadow-lg ${
                  isReady
                    ? 'bg-amber-950/30 border-amber-500/70 shadow-amber-950/20'
                    : isCooking
                    ? 'bg-slate-900/90 border-blue-500/40'
                    : isServed
                    ? 'bg-purple-950/20 border-purple-500/30'
                    : isAvailable
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                        Table {t.tableNumber}
                      </h3>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5" /> {t.capacity} Guests
                      </span>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                        isReady
                          ? 'bg-amber-500 text-slate-950 animate-pulse font-extrabold'
                          : isCooking
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : isPending
                          ? 'bg-slate-700 text-slate-300'
                          : isServed
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {activeOrder ? activeOrder.status : t.status}
                    </span>
                  </div>

                  {/* Active Order Details */}
                  {activeOrder ? (
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs my-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">#{activeOrder.orderNumber}</span>
                        <span className="text-slate-400">
                          {activeOrder.items?.length || 0} Dish
                          {(activeOrder.items?.length || 0) > 1 ? 'es' : ''}
                        </span>
                      </div>

                      {activeOrder.items && activeOrder.items.length > 0 && (
                        <div className="text-[11px] text-slate-400 space-y-0.5 max-h-20 overflow-y-auto pr-1">
                          {activeOrder.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate pr-2">
                                {i.quantity}x {i.menuItem?.name}
                              </span>
                              <span className="text-slate-300 font-mono">
                                {restaurant?.currency || '₹'}
                                {Number(i.subtotal || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeOrder.bill && (
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Bill Status:</span>
                          <span
                            className={`font-semibold ${
                              activeOrder.bill.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {activeOrder.bill.status} ({restaurant?.currency || '₹'}
                            {Number(activeOrder.bill.totalAmount).toFixed(2)})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="my-8 text-center text-slate-500 text-xs italic">
                      Ready for next seated party
                    </div>
                  )}
                </div>

                {/* Contextual Action Button */}
                <div className="pt-3 border-t border-slate-800/60">
                  {isReady ? (
                    <button
                      onClick={() => handleServeOrder(activeOrder.id, t.tableNumber)}
                      disabled={actionLoading === `serve-${activeOrder.id}`}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5 transition"
                    >
                      <Check className="w-4 h-4" />
                      SERVE FOOD
                    </button>
                  ) : activeOrder?.bill && !activeOrder.bill.isDelivered ? (
                    <button
                      onClick={() => handleDeliverBill(activeOrder.bill.id, t.tableNumber)}
                      disabled={actionLoading === `deliver-${activeOrder.bill.id}`}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-950 flex items-center justify-center gap-1.5 transition"
                    >
                      <Receipt className="w-4 h-4" />
                      DELIVER BILL
                    </button>
                  ) : isAvailable ? (
                    <button
                      onClick={() => onSelectTableForOrder && onSelectTableForOrder(t)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      NEW ORDER
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectTableForOrder && onSelectTableForOrder(t)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      ADD ITEMS TO ORDER
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
