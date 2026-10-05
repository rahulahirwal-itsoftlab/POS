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
        return 'bg-[#2563EB]/15 border-[#2563EB]/30 text-[#2563EB]';
      case 'ACCEPTED':
        return 'bg-[#92400E]/15 border-[#92400E]/30 text-[#92400E]';
      case 'IN_PREPARATION':
        return 'bg-[#D97706]/15 border-[#D97706]/30 text-[#B45309]';
      case 'READY':
        return 'bg-[#16A34A]/15 border-[#16A34A]/30 text-[#16A34A]';
      case 'SERVED':
        return 'bg-[#92400E]/10 border-[#92400E]/20 text-[#92400E]';
      case 'COMPLETED':
        return 'bg-[#FAF7F2] border-[#E5D8C6] text-[#5B6470]';
      default:
        return 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]';
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] text-[#1F2937]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E5D8C6] p-5 rounded-2xl shadow-sandstone">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-[#92400E]" />
            <span>Kitchen Orders</span>
          </h1>
          <p className="text-sm text-[#5B6470] mt-0.5 font-medium">
            Manage incoming food orders, recipe requirements, and prep status transitions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] rounded-xl border border-[#E5D8C6] transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-sm"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#92400E]' : 'text-[#5B6470]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone">
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
                  ? 'bg-[#92400E] text-white border-[#92400E] font-bold shadow-sm'
                  : 'bg-[#FAF7F2] text-[#5B6470] border-[#E5D8C6] hover:bg-[#F1E8DB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6470]" />
          <input
            type="text"
            placeholder="Search by Order # or Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#92400E]"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading && orders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin" />
          <span className="text-sm text-[#5B6470] font-medium">Loading kitchen orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-16 text-center shadow-sandstone">
          <ClipboardList className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#1F2937]">No Orders Found</h3>
          <p className="text-sm text-[#5B6470] mt-1">There are no orders matching the selected status or search.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sandstone">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
                <tr>
                  <th className="px-5 py-4">Table / Order</th>
                  <th className="px-5 py-4">Waiter</th>
                  <th className="px-5 py-4">Ordered Items</th>
                  <th className="px-5 py-4">Order Time</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D8C6]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F1E8DB] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#1F2937] text-sm">
                        Table #{ord.table?.tableNumber || ord.tableNumber || 'N/A'}
                      </div>
                      <div className="text-[11px] text-[#5B6470] font-mono">
                        #{ord.orderNumber || ord.id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-[#1F2937] font-medium">
                      {ord.waiter?.name || 'Staff'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-0.5 max-w-xs">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="text-[#1F2937] text-xs flex items-center gap-1.5">
                            <span className="font-bold text-[#B45309]">{it.quantity}x</span>
                            <span>{it.menuItem?.name || it.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-[#5B6470]">
                      <div>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-[#5B6470]">
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
                          className="p-2 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] border border-[#E5D8C6] rounded-xl transition-colors cursor-pointer shadow-sm"
                          title="View Order & Recipe Details"
                        >
                          <Eye className="w-4 h-4 text-[#5B6470]" />
                        </button>

                        {ord.status === 'PENDING' && (
                          <button
                            onClick={() => handleAccept(ord.id)}
                            disabled={actionLoading === ord.id}
                            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sandstone cursor-pointer"
                          >
                            Accept
                          </button>
                        )}

                        {ord.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleStartPrep(ord.id)}
                            disabled={actionLoading === ord.id}
                            className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sandstone cursor-pointer"
                          >
                            Start Cooking
                          </button>
                        )}

                        {ord.status === 'IN_PREPARATION' && (
                          <button
                            onClick={() => handleMarkReady(ord.id)}
                            disabled={actionLoading === ord.id}
                            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sandstone cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[#1F2937]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E5D8C6] pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-[#1F2937]">
                    Table #{selectedOrderForDetail.table?.tableNumber || 'N/A'}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(selectedOrderForDetail.status)}`}>
                    {selectedOrderForDetail.status}
                  </span>
                </div>
                <div className="text-xs text-[#5B6470] mt-1 font-medium">
                  Ticket #{selectedOrderForDetail.orderNumber} • Waiter: {selectedOrderForDetail.waiter?.name || 'Staff'} • Ordered:{' '}
                  {new Date(selectedOrderForDetail.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1 rounded-lg hover:bg-[#F1E8DB] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note */}
            {selectedOrderForDetail.notes && (
              <div className="bg-[#D97706]/10 border border-[#D97706]/20 text-[#B45309] text-xs p-3 rounded-xl mb-4 font-medium">
                <strong>Kitchen Note:</strong> {selectedOrderForDetail.notes}
              </div>
            )}

            {/* Ordered Dishes Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Ordered Dishes</h4>
              <div className="space-y-2">
                {selectedOrderForDetail.items?.map((item, idx) => (
                  <div key={idx} className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F2937] text-sm flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30 flex items-center justify-center font-bold text-xs">
                          {item.quantity}
                        </span>
                        <span>{item.menuItem?.name || item.name}</span>
                      </span>
                      <span className="text-xs text-[#5B6470] font-mono">
                        {item.menuItem?.recipe?.prepTime ? `Prep: ~${item.menuItem.recipe.prepTime}m` : 'Standard'}
                      </span>
                    </div>

                    {/* Dish Recipe Ingredients */}
                    {item.menuItem?.recipe?.ingredients && item.menuItem.recipe.ingredients.length > 0 ? (
                      <div className="mt-3 pt-2 border-t border-[#E5D8C6] text-[11px] text-[#5B6470]">
                        <div className="text-[10px] font-semibold text-[#5B6470] uppercase mb-1">
                          Recipe Requirement per unit:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {item.menuItem.recipe.ingredients.map((ing, iIdx) => (
                            <div key={iIdx} className="bg-white px-2 py-1 rounded-lg border border-[#E5D8C6] flex justify-between">
                              <span>{ing.inventoryItem?.name || 'Ingredient'}</span>
                              <span className="font-mono text-[#1F2937] font-semibold">
                                {Number(ing.quantityRequired) * item.quantity} {ing.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-[#EF4444] italic">
                        No recipe configured for this menu item.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Recipe Ingredient BOM Check */}
              {selectedOrderForDetail.calculatedIngredients && selectedOrderForDetail.calculatedIngredients.length > 0 && (
                <div className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-[#92400E] uppercase tracking-wider mb-2">
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
                            ? 'bg-white border-[#E5D8C6] text-[#1F2937]'
                            : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] font-bold'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ing.isSufficient ? 'bg-[#16A34A]' : 'bg-[#EF4444] animate-ping'}`} />
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
            <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-[#E5D8C6]">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] transition-colors cursor-pointer border border-[#E5D8C6] rounded-xl"
              >
                Close
              </button>

              {selectedOrderForDetail.status === 'PENDING' && (
                <button
                  onClick={() => handleAccept(selectedOrderForDetail.id)}
                  disabled={actionLoading === selectedOrderForDetail.id}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-sandstone cursor-pointer"
                >
                  Accept Order
                </button>
              )}

              {selectedOrderForDetail.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleStartPrep(selectedOrderForDetail.id)}
                  disabled={actionLoading === selectedOrderForDetail.id}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-sandstone cursor-pointer"
                >
                  Start Cooking
                </button>
              )}

              {selectedOrderForDetail.status === 'IN_PREPARATION' && (
                <button
                  onClick={() => handleMarkReady(selectedOrderForDetail.id)}
                  disabled={actionLoading === selectedOrderForDetail.id}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-sandstone cursor-pointer"
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
