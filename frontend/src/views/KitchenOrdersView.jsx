import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  PackageCheck,
  X,
  Filter,
  Eye,
  CheckCheck
} from 'lucide-react';

export default function KitchenOrdersView() {
  const { addToast } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await posService.kitchen.getOrders(params);
      if (res.success && res.data) {
        const orderList = Array.isArray(res.data) ? res.data : res.data.items || [];
        setOrders(orderList);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch kitchen orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery]);

  const handleAccept = async (orderId) => {
    setActionLoading(orderId);
    try {
      await posService.kitchen.acceptOrder(orderId);
      addToast('Order accepted into preparation', 'info');
      fetchOrders();
      if (selectedOrderForDetail?.id === orderId) {
        const updated = await posService.kitchen.getOrderById(orderId);
        if (updated.success) setSelectedOrderForDetail(updated.data);
      }
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
      addToast('Order preparation started', 'info');
      fetchOrders();
      if (selectedOrderForDetail?.id === orderId) {
        const updated = await posService.kitchen.getOrderById(orderId);
        if (updated.success) setSelectedOrderForDetail(updated.data);
      }
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
      addToast('Order marked READY! Inventory ingredients automatically deducted.', 'success');
      fetchOrders();
      if (selectedOrderForDetail?.id === orderId) {
        const updated = await posService.kitchen.getOrderById(orderId);
        if (updated.success) setSelectedOrderForDetail(updated.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to mark ready. Check inventory stock.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openOrderDetail = async (order) => {
    setSelectedOrderForDetail(order);
    try {
      const res = await posService.kitchen.getOrderById(order.id);
      if (res.success && res.data) {
        setSelectedOrderForDetail(res.data);
      }
    } catch (e) {
      // Fallback to existing order state
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber && o.orderNumber.toLowerCase().includes(q);
      const matchTable = o.table?.tableNumber && o.table.tableNumber.toLowerCase().includes(q);
      const matchWaiter = o.waiter?.name && o.waiter.name.toLowerCase().includes(q);
      if (!matchNum && !matchTable && !matchWaiter) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-blue-950/80 border-blue-800/80 text-blue-300';
      case 'ACCEPTED':
        return 'bg-indigo-950/80 border-indigo-800/80 text-indigo-300';
      case 'IN_PREPARATION':
        return 'bg-amber-950/80 border-amber-800/80 text-amber-300';
      case 'READY':
        return 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300';
      case 'SERVED':
        return 'bg-purple-950/80 border-purple-800/80 text-purple-300';
      case 'COMPLETED':
        return 'bg-slate-800 border-slate-700 text-slate-300';
      default:
        return 'bg-rose-950/80 border-rose-800/80 text-rose-300';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-emerald-400" />
            <span>Kitchen Orders</span>
          </h1>
          <p className="text-sm text-slate-400">
            Manage incoming food orders, recipe requirements, and prep status transitions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        {/* Status Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'PENDING', label: 'New' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'IN_PREPARATION', label: 'Cooking' },
            { id: 'READY', label: 'Ready' },
            { id: 'SERVED', label: 'Served' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md shadow-emerald-950/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Order # or Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading && orders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading kitchen orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Orders Found</h3>
          <p className="text-sm text-slate-400 mt-1">There are no orders matching the selected status or search.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Table / Order</th>
                  <th className="px-5 py-4">Waiter</th>
                  <th className="px-5 py-4">Ordered Items</th>
                  <th className="px-5 py-4">Order Time</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">
                        Table #{ord.table?.tableNumber || ord.tableNumber || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        #{ord.orderNumber || ord.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {ord.waiter?.name || 'Staff'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-0.5 max-w-xs">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="text-slate-300 text-xs flex items-center gap-1.5">
                            <span className="font-bold text-amber-400">{it.quantity}x</span>
                            <span>{it.menuItem?.name || it.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400">
                      <div>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-500">
                        {Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000)}m ago
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(ord.status)}`}>
                        {ord.status === 'IN_PREPARATION' ? 'COOKING' : ord.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openOrderDetail(ord)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                          title="View Order & Recipe Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {ord.status === 'PENDING' && (
                          <button
                            onClick={() => handleAccept(ord.id)}
                            disabled={actionLoading === ord.id}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Accept
                          </button>
                        )}

                        {ord.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleStartPrep(ord.id)}
                            disabled={actionLoading === ord.id}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Start Cooking
                          </button>
                        )}

                        {ord.status === 'IN_PREPARATION' && (
                          <button
                            onClick={() => handleMarkReady(ord.id)}
                            disabled={actionLoading === ord.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Mark Ready
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white">
                    Table #{selectedOrderForDetail.table?.tableNumber || 'N/A'}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(selectedOrderForDetail.status)}`}>
                    {selectedOrderForDetail.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Ticket #{selectedOrderForDetail.orderNumber} • Waiter: {selectedOrderForDetail.waiter?.name || 'Staff'} • Ordered:{' '}
                  {new Date(selectedOrderForDetail.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note */}
            {selectedOrderForDetail.notes && (
              <div className="bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs p-3 rounded-xl mb-4">
                <strong>Kitchen Note:</strong> {selectedOrderForDetail.notes}
              </div>
            )}

            {/* Ordered Dishes Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ordered Dishes</h4>
              <div className="space-y-2">
                {selectedOrderForDetail.items?.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                          {item.quantity}
                        </span>
                        <span>{item.menuItem?.name || item.name}</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {item.menuItem?.recipe?.prepTime ? `Prep: ~${item.menuItem.recipe.prepTime}m` : 'Standard'}
                      </span>
                    </div>

                    {/* Dish Recipe Ingredients */}
                    {item.menuItem?.recipe?.ingredients && item.menuItem.recipe.ingredients.length > 0 ? (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">
                          Recipe Requirement per unit:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {item.menuItem.recipe.ingredients.map((ing, iIdx) => (
                            <div key={iIdx} className="bg-slate-900 px-2 py-1 rounded-lg border border-slate-800/50 flex justify-between">
                              <span>{ing.inventoryItem?.name || 'Ingredient'}</span>
                              <span className="font-mono text-slate-300">
                                {Number(ing.quantityRequired) * item.quantity} {ing.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-rose-400 italic">
                        No recipe configured for this menu item.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Recipe Ingredient BOM Check */}
              {selectedOrderForDetail.calculatedIngredients && selectedOrderForDetail.calculatedIngredients.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4" /> Total Order Ingredient Requirements
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedOrderForDetail.calculatedIngredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border ${
                          ing.isSufficient
                            ? 'bg-slate-900 border-slate-800 text-slate-200'
                            : 'bg-rose-950/40 border-rose-800/60 text-rose-300 font-bold'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ing.isSufficient ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`} />
                          <span>{ing.name}</span>
                        </span>
                        <span className="font-mono text-xs">
                          Required: {ing.requiredQuantity} {ing.unit} | In Stock: {ing.currentStock} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedOrderForDetail.status === 'PENDING' && (
                <button
                  onClick={() => handleAccept(selectedOrderForDetail.id)}
                  disabled={actionLoading === selectedOrderForDetail.id}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Accept Order
                </button>
              )}

              {selectedOrderForDetail.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleStartPrep(selectedOrderForDetail.id)}
                  disabled={actionLoading === selectedOrderForDetail.id}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Start Cooking
                </button>
              )}

              {selectedOrderForDetail.status === 'IN_PREPARATION' && (
                <button
                  onClick={() => handleMarkReady(selectedOrderForDetail.id)}
                  disabled={actionLoading === selectedOrderForDetail.id}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Mark Food Ready (Deduct Inventory)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
