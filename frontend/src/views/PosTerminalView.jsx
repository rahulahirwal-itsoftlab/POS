import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  History
} from 'lucide-react';

export default function PosTerminalView({ preSelectedTable, onOrderPlaced }) {
  const { restaurant, addToast, role } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(preSelectedTable?.id || '');
  const [activeCategoryId, setActiveCategoryId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('DINE_IN');
  const [specialNotes, setSpecialNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Orders History Drawer
  const [showHistory, setShowHistory] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const currency = restaurant?.currency || '₹';

  useEffect(() => {
    if (preSelectedTable) {
      setSelectedTableId(preSelectedTable.id);
    }
  }, [preSelectedTable]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, tblRes] = await Promise.all([
        posService.menu.getCategories(),
        posService.menu.getItems(),
        posService.tables.getAll(),
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (itemRes.success) setMenuItems(itemRes.data || []);
      if (tblRes.success) {
        setTables(tblRes.data || []);
        if (!selectedTableId && tblRes.data?.length > 0) {
          const avail = tblRes.data.find((t) => t.status === 'AVAILABLE') || tblRes.data[0];
          setSelectedTableId(avail.id);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to load POS catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchActiveOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await posService.orders.getAll();
      if (res.success && res.data) {
        setActiveOrders(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load active orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      await posService.orders.cancel(orderId, reason);
      addToast('Order cancelled successfully', 'success');
      fetchActiveOrders();
    } catch (err) {
      addToast(err.message || 'Failed to cancel order', 'error');
    }
  };

  // Cart operations
  const addToCart = (item) => {
    if (!item.isAvailable) {
      addToast(`${item.name} is currently out of stock`, 'warning');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          specialInstructions: '',
        },
      ];
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.menuItemId === menuItemId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean)
    );
  };

  const updateItemNotes = (menuItemId, notes) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, specialInstructions: notes } : c))
    );
  };

  const clearCart = () => setCart([]);

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      addToast('Your order ticket is empty', 'warning');
      return;
    }
    if (orderType === 'DINE_IN' && !selectedTableId) {
      addToast('Please select a dining table for Dine-In orders', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tableId: selectedTableId || null,
        orderType,
        notes: specialNotes.trim() || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          specialInstructions: c.specialInstructions || undefined,
        })),
      };

      const res = await posService.orders.create(payload);
      if (res.success) {
        addToast('Order fired to kitchen successfully!', 'success');
        clearCart();
        setSpecialNotes('');
        if (onOrderPlaced) onOrderPlaced(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const taxRate = restaurant?.taxRate || 5;
  const estimatedTax = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + estimatedTax;

  const filteredItems = menuItems.filter((item) => {
    const matchCat = activeCategoryId === 'ALL' || item.categoryId === activeCategoryId;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* LEFT: Menu Catalog & Categories */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/40 p-6 overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, drinks, starters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchActiveOrders();
                setShowHistory(true);
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>Active Orders</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveCategoryId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategoryId === 'ALL'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategoryId === cat.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Food Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 mt-2">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Loading menu catalog...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1" />
              <p>No dishes match your selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none group ${
                    !item.isAvailable
                      ? 'opacity-50 border-slate-800 bg-slate-900/50 cursor-not-allowed'
                      : 'border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {item.name}
                      </span>
                      {item.isVeg !== undefined && (
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border p-0.5 flex items-center justify-center shrink-0 ${
                            item.isVeg ? 'border-emerald-500' : 'border-rose-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2">
                    <span className="font-bold text-emerald-400 text-sm">
                      {currency}{Number(item.price).toFixed(2)}
                    </span>
                    {!item.isAvailable ? (
                      <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        86 Out
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-lg bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-400 group-hover:text-white flex items-center justify-center transition-all duration-200">
                        <Plus className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Live Order Cart Ticket */}
      <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">Current Ticket</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table & Order Type Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Table
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table #{t.tableNumber} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Type
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="DINE_IN">Dine-In</option>
                <option value="TAKEAWAY">Takeaway</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>
          </div>

          {/* Active Table Session Banner (Allows adding items multiple times) */}
          {tables.find((t) => t.id === selectedTableId)?.status === 'OCCUPIED' && (
            <div className="mt-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Active Table Session:</span> Items fired will automatically append to this table's running order.
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
              <p className="font-semibold text-sm text-slate-400">Ticket is Empty</p>
              <p className="text-xs text-slate-500 mt-1">
                Select menu items from the catalog on the left to build the customer's order.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-white text-xs leading-tight">{item.name}</div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                      {currency}{item.price.toFixed(2)} each
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Special Instructions */}
                <input
                  type="text"
                  placeholder="Notes (e.g. less salt, spicy)"
                  value={item.specialInstructions}
                  onChange={(e) => updateItemNotes(item.menuItemId, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
          <div>
            <input
              type="text"
              placeholder="Kitchen Order Note (optional)"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-white">{currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Tax ({taxRate}%)</span>
              <span className="font-mono text-white">{currency}{estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>Grand Total</span>
              <span className="text-emerald-400 font-mono">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/50"
          >
            <Send className="w-4 h-4" />
            <span>
              {submitting
                ? 'Submitting Ticket...'
                : tables.find((t) => t.id === selectedTableId)?.status === 'OCCUPIED'
                ? 'Add Items to Active Table Order'
                : 'Fire to Kitchen'}
            </span>
          </button>
        </div>
      </div>

      {/* ACTIVE ORDERS DRAWER */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <History className="w-5 h-5 text-emerald-400" />
                <span>Active Kitchen & Service Orders</span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingOrders ? (
                <div className="text-center py-12 text-slate-400 text-sm">Loading orders...</div>
              ) : activeOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">No active orders found.</div>
              ) : (
                activeOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">
                          Table #{ord.table?.tableNumber || ord.tableNumber || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          #{ord.orderNumber || ord.id.slice(0, 8)}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border bg-slate-800 text-emerald-400 border-emerald-500/30">
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {it.quantity}x {it.menuItem?.name || it.name}
                          </span>
                          <span className="text-slate-500">
                            {currency}{Number(it.unitPrice || it.price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {['PENDING', 'IN_PREPARATION'].includes(ord.status) && (
                      <div className="pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
