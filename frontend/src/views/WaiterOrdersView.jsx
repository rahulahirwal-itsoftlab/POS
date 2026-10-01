import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  PlusCircle,
  Send,
  X,
  Receipt
} from 'lucide-react';

export default function WaiterOrdersView({ onSelectTableForOrder }) {
  const { restaurant, addToast } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await posService.orders.getAll();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleServe = async (orderId, tableNumber) => {
    setActionLoading(`serve-${orderId}`);
    try {
      await posService.waiter.serveOrder(orderId);
      addToast(`Order for Table #${tableNumber} marked SERVED!`, 'success');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: 'SERVED' }));
      }
    } catch (err) {
      addToast(err.message || 'Failed to serve order', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendToKitchen = async (orderId) => {
    setActionLoading(`kitchen-${orderId}`);
    try {
      await posService.waiter.sendToKitchen(orderId);
      addToast('Order ticket fired to kitchen!', 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.message || 'Failed to send to kitchen', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt('Please enter reason for order cancellation:');
    if (!reason || !reason.trim()) return;

    setActionLoading(`cancel-${orderId}`);
    try {
      await posService.orders.cancel(orderId, reason.trim());
      addToast('Order cancelled successfully', 'info');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      addToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const currency = restaurant?.currency || '₹';

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.table?.tableNumber && String(o.table.tableNumber).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return !['COMPLETED', 'CANCELLED'].includes(o.status);
    return o.status === statusFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Waiter Orders & Tickets
              </h1>
              <p className="text-xs text-slate-400">
                Track active orders, kitchen preparation status, and customer service delivery
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            {['ALL', 'READY', 'IN_PREPARATION', 'ACCEPTED', 'PENDING', 'SERVED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex justify-center items-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mr-2" />
            Loading kitchen tickets...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No orders found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order #</th>
                  <th className="py-3.5 px-4 font-semibold">Table</th>
                  <th className="py-3.5 px-4 font-semibold">Dishes & Quantity</th>
                  <th className="py-3.5 px-4 font-semibold">Kitchen Status</th>
                  <th className="py-3.5 px-4 font-semibold">Billing Status</th>
                  <th className="py-3.5 px-4 font-semibold">Created</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredOrders.map((o) => {
                  const isReady = o.status === 'READY';
                  const isCooking = ['ACCEPTED', 'IN_PREPARATION'].includes(o.status);
                  const isPending = o.status === 'PENDING';
                  const isServed = o.status === 'SERVED';
                  const isCompleted = o.status === 'COMPLETED';

                  const totalItems = o.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  const dishesSummary = o.items?.map((i) => `${i.quantity}x ${i.menuItem?.name}`).join(', ') || '';

                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isReady ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        #{o.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">
                          {o.table ? `Table #${o.table.tableNumber}` : 'Takeaway'}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-medium text-slate-200 block truncate" title={dishesSummary}>
                          {dishesSummary || 'No items'}
                        </span>
                        <span className="text-[11px] text-slate-400">{totalItems} Total items</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isReady
                              ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse'
                              : isCooking
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : isPending
                              ? 'bg-slate-700 text-slate-300'
                              : isServed
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {o.bill ? (
                          <span
                            className={`font-semibold ${
                              o.bill.status === 'PAID'
                                ? 'text-emerald-400'
                                : o.bill.isDelivered
                                ? 'text-sky-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {o.bill.status} ({currency}
                            {Number(o.bill.totalAmount).toFixed(2)})
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unbilled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isReady && (
                            <button
                              onClick={() => handleServe(o.id, o.table?.tableNumber || 'Takeaway')}
                              disabled={actionLoading === `serve-${o.id}`}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Serve
                            </button>
                          )}

                          {!['COMPLETED', 'CANCELLED'].includes(o.status) && (
                            <button
                              onClick={() => {
                                if (onSelectTableForOrder && o.table) {
                                  onSelectTableForOrder(o.table);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700 transition"
                              title="Add more dishes"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Order #{selectedOrder.orderNumber}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {selectedOrder.table ? `Table #${selectedOrder.table.tableNumber}` : 'Takeaway'}
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Created at {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {selectedOrder.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">
                      {item.quantity}x {item.menuItem?.name}
                    </span>
                    {item.notes && <p className="text-[11px] text-amber-400 mt-0.5">Note: {item.notes}</p>}
                  </div>
                  <span className="font-mono text-slate-300 font-bold">
                    {currency}
                    {Number(item.subtotal || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary details */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Status:</span>
                <span className="font-bold text-white uppercase">{selectedOrder.status}</span>
              </div>
              {selectedOrder.readyAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Kitchen Ready At:</span>
                  <span className="text-emerald-400">
                    {new Date(selectedOrder.readyAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {selectedOrder.servedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer Served At:</span>
                  <span className="text-purple-400">
                    {new Date(selectedOrder.servedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
              {selectedOrder.notes && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Special Instructions:</span>
                  <p className="text-slate-200 text-xs italic">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Actions in modal */}
            <div className="flex gap-2 pt-2">
              {selectedOrder.status === 'READY' && (
                <button
                  onClick={() => handleServe(selectedOrder.id, selectedOrder.table?.tableNumber || 'Takeaway')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Mark Served
                </button>
              )}
              {selectedOrder.status === 'PENDING' && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="py-2 px-4 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-semibold rounded-xl text-xs transition"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
