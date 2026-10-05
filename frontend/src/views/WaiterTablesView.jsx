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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5D8C6] shadow-sandstone">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl text-[#92400E]">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                Floor Tables Management
              </h1>
              <p className="text-xs text-[#5B6470]">
                Operational table assignments, seating, and live order states
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5B6470] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1F2937] placeholder-[#5B6470] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5D8C6] text-xs">
            {['ALL', 'AVAILABLE', 'PREPARING', 'READY', 'SERVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#92400E] text-white shadow-sandstone'
                    : 'text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB]'
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
        <div className="py-20 flex justify-center items-center text-[#5B6470] text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-[#92400E] mr-2" />
          Loading floor tables...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5D8C6] text-[#5B6470] text-sm shadow-sandstone">
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
                className={`flex flex-col justify-between p-5 rounded-2xl border transition shadow-sandstone hover:shadow-sandstone-md hover:-translate-y-0.5 ${
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
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-1.5">
                        Table {t.tableNumber}
                      </h3>
                      <span className="text-xs text-[#5B6470] flex items-center gap-1 mt-0.5 font-medium">
                        <Users className="w-3.5 h-3.5" /> {t.capacity} Guests
                      </span>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                        isReady
                          ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse font-extrabold'
                          : isCooking
                          ? 'bg-amber-100 text-amber-900 border-amber-200'
                          : isPending
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : isServed
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {activeOrder ? activeOrder.status : t.status}
                    </span>
                  </div>

                  {/* Active Order Details */}
                  {activeOrder ? (
                    <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E5D8C6] space-y-2 text-xs my-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1F2937]">#{activeOrder.orderNumber}</span>
                        <span className="text-[#5B6470] font-medium">
                          {activeOrder.items?.length || 0} Dish
                          {(activeOrder.items?.length || 0) > 1 ? 'es' : ''}
                        </span>
                      </div>

                      {activeOrder.items && activeOrder.items.length > 0 && (
                        <div className="text-[11px] text-[#5B6470] space-y-0.5 max-h-20 overflow-y-auto pr-1">
                          {activeOrder.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate pr-2 font-medium">
                                {i.quantity}x {i.menuItem?.name}
                              </span>
                              <span className="text-[#92400E] font-mono font-bold">
                                {restaurant?.currency || '₹'}
                                {Number(i.subtotal || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeOrder.bill && (
                        <div className="pt-2 border-t border-[#E5D8C6] flex justify-between items-center text-[11px]">
                          <span className="text-[#5B6470]">Bill Status:</span>
                          <span
                            className={`font-bold ${
                              activeOrder.bill.status === 'PAID' ? 'text-emerald-800' : 'text-[#92400E]'
                            }`}
                          >
                            {activeOrder.bill.status} ({restaurant?.currency || '₹'}
                            {Number(activeOrder.bill.totalAmount).toFixed(2)})
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="my-8 text-center text-[#9CA3AF] text-xs italic">
                      Ready for next seated party
                    </div>
                  )}
                </div>

                {/* Contextual Action Button */}
                <div className="pt-3 border-t border-[#E5D8C6]">
                  {isReady ? (
                    <button
                      onClick={() => handleServeOrder(activeOrder.id, t.tableNumber)}
                      disabled={actionLoading === `serve-${activeOrder.id}`}
                      className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs shadow-sandstone flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      SERVE FOOD
                    </button>
                  ) : activeOrder?.bill && !activeOrder.bill.isDelivered ? (
                    <button
                      onClick={() => handleDeliverBill(activeOrder.bill.id, t.tableNumber)}
                      disabled={actionLoading === `deliver-${activeOrder.bill.id}`}
                      className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl text-xs shadow-sandstone flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      DELIVER BILL
                    </button>
                  ) : isAvailable ? (
                    <button
                      onClick={() => onSelectTableForOrder && onSelectTableForOrder(t)}
                      className="w-full py-2.5 bg-[#92400E] hover:bg-[#78350F] text-white font-bold rounded-xl text-xs shadow-sandstone flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      NEW ORDER
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectTableForOrder && onSelectTableForOrder(t)}
                      className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] font-semibold rounded-xl text-xs border border-[#E5D8C6] shadow-sandstone flex items-center justify-center gap-1.5 transition cursor-pointer"
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
