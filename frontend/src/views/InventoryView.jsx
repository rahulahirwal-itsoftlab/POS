import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Plus,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Search,
  Scale,
  DollarSign,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';

export default function InventoryView() {
  const { restaurant, addToast, role } = useAuth();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'wastage' | 'consumption'
  const [items, setItems] = useState([]);
  const [wastages, setWastages] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);

  // Forms
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    unit: 'kg',
    currentStock: 0,
    minStockLevel: 5,
    costPrice: 0,
    storageLocation: 'Kitchen Storage',
  });

  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('PURCHASE_RECEIPT');
  const [adjustNotes, setAdjustNotes] = useState('');

  const [wastageForm, setWastageForm] = useState({
    inventoryItemId: '',
    quantity: 1,
    reason: 'SPOILAGE',
    notes: '',
  });

  const currency = restaurant?.currency || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, wstRes, kRes] = await Promise.all([
        posService.inventory.getAll(),
        posService.wastage.getAll(),
        posService.kitchen.getDashboard().catch(() => ({})),
      ]);
      if (invRes.success) setItems(invRes.data || []);
      if (wstRes.success) setWastages(wstRes.data || []);
      if (kRes?.success && kRes.data?.recentActivity) {
        setConsumptions(kRes.data.recentActivity || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;
    try {
      const payload = {
        name: itemForm.name.trim(),
        sku: itemForm.sku.trim() || undefined,
        unit: itemForm.unit,
        currentStock: Number(itemForm.currentStock) || 0,
        minStockLevel: Number(itemForm.minStockLevel) || 0,
        costPrice: Number(itemForm.costPrice) || 0,
        storageLocation: itemForm.storageLocation.trim() || undefined,
      };

      await posService.inventory.create(payload);
      addToast(`${payload.name} added to inventory`, 'success');
      setShowItemModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create inventory item', 'error');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;
    try {
      await posService.inventory.adjustStock(selectedItemForAdjust.id, {
        quantity: Number(adjustQuantity),
        reason: adjustReason,
        notes: adjustNotes.trim() || undefined,
      });
      addToast('Inventory stock adjusted successfully', 'success');
      setShowAdjustModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to adjust stock', 'error');
    }
  };

  const handleLogWastage = async (e) => {
    e.preventDefault();
    if (!wastageForm.inventoryItemId) {
      addToast('Please select an ingredient', 'warning');
      return;
    }
    try {
      await posService.wastage.log({
        inventoryItemId: wastageForm.inventoryItemId,
        quantity: Number(wastageForm.quantity),
        reason: wastageForm.reason,
        notes: wastageForm.notes.trim() || undefined,
      });
      addToast('Wastage logged & inventory reduced', 'success');
      setShowWastageModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to log wastage', 'error');
    }
  };

  const lowStockItems = items.filter((it) => Number(it.currentStock) <= Number(it.minStockLevel));

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (it.sku && it.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-400" />
            <span>Inventory, Stock & Wastage Control</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time raw material balances, threshold reorder alerts, and spoilage tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (items.length > 0) {
                setWastageForm({
                  inventoryItemId: items[0].id,
                  quantity: 1,
                  reason: 'SPOILAGE',
                  notes: '',
                });
              }
              setShowWastageModal(true);
            }}
            className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-rose-800/60 transition-colors"
          >
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>Log Wastage</span>
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-amber-200">
                Low Stock Warning: {lowStockItems.length} ingredients below safe reorder threshold!
              </div>
              <div className="text-xs text-amber-300/80 mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).slice(0, 4).join(', ')}
                {lowStockItems.length > 4 ? ' and more...' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Raw Materials Stock ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('consumption')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'consumption'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Consumption History ({consumptions.length})
        </button>
        {role !== 'KITCHEN_ADMIN' && (
          <button
            onClick={() => setActiveTab('wastage')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'wastage'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Wastage Log History ({wastages.length})
          </button>
        )}
      </div>

      {/* TAB 1: STOCK ITEMS */}
      {activeTab === 'stock' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw material or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Raw Material / Ingredient</th>
                  <th className="px-5 py-3.5">SKU / Code</th>
                  <th className="px-5 py-3.5">Current Stock</th>
                  <th className="px-5 py-3.5">Min Safe Level</th>
                  <th className="px-5 py-3.5">Cost / Unit</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((it) => {
                  const isLow = Number(it.currentStock) <= Number(it.minStockLevel);
                  return (
                    <tr key={it.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{it.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Unit: {it.unit}</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {it.sku || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isLow ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {Number(it.currentStock).toFixed(2)} {it.unit}
                        </span>
                        {isLow && (
                          <div className="text-[10px] text-rose-400 font-bold uppercase mt-0.5">
                            Low Stock Alert
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {it.minStockLevel} {it.unit}
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-mono">
                        {currency}{Number(it.costPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {it.storageLocation || 'Main Warehouse'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedItemForAdjust(it);
                            setAdjustQuantity(0);
                            setAdjustReason('PURCHASE_RECEIPT');
                            setAdjustNotes('');
                            setShowAdjustModal(true);
                          }}
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-700 font-semibold"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WASTAGE LOGS */}
      {activeTab === 'wastage' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {wastages.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="text-white font-semibold">No Spoilage / Wastage Logged</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Ingredient</th>
                    <th className="px-5 py-3.5">Wasted Quantity</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Estimated Cost</th>
                    <th className="px-5 py-3.5">Logged At</th>
                    <th className="px-5 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {wastages.map((wst) => (
                    <tr key={wst.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-white">
                        {wst.inventoryItem?.name || 'Raw Ingredient'}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-rose-400">
                        {wst.quantity} {wst.inventoryItem?.unit || 'units'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {wst.reason}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-300">
                        {currency}{Number(wst.totalCost || wst.cost || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {new Date(wst.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-slate-400 italic">
                        {wst.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONSUMPTION HISTORY */}
      {activeTab === 'consumption' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Recipe Ingredient Depletion Audit Trail</h3>
            <p className="text-xs text-slate-400">Traceable log of stock automatically deducted when food tickets are marked READY</p>
          </div>

          {consumptions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Boxes className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="text-white font-semibold">No Consumption Recorded Yet</p>
              <p className="text-xs text-slate-400 mt-1">Stock consumption entries appear when kitchen orders are completed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Date / Time</th>
                    <th className="px-5 py-3.5">Ingredient</th>
                    <th className="px-5 py-3.5">Deduction (Quantity)</th>
                    <th className="px-5 py-3.5">Previous Balance</th>
                    <th className="px-5 py-3.5">Remaining Stock</th>
                    <th className="px-5 py-3.5">Order Reference</th>
                    <th className="px-5 py-3.5">Reason / Dishes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {consumptions.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-bold text-white">
                        {entry.inventoryItem?.name || 'Raw Material'}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-rose-400">
                        {Number(entry.quantity).toFixed(4)} {entry.unit}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {Number(entry.previousBalance).toFixed(4)} {entry.unit}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                        {Number(entry.remainingBalance).toFixed(4)} {entry.unit}
                      </td>
                      <td className="px-5 py-4 font-mono text-amber-300">
                        {entry.reference || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {entry.reason || 'Order consumption'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE STOCK ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Warehouse Inventory Item</h3>
            <p className="text-xs text-slate-400 mb-5">Track bulk raw ingredients, produce, and bar supplies</p>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arabica Coffee Beans"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="ING-COF-01"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="l">l (Liter)</option>
                    <option value="ml">ml (Milliliter)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="box">box (Box / Pack)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.currentStock}
                    onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Min Safe Level</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.minStockLevel}
                    onChange={(e) => setItemForm({ ...itemForm, minStockLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.costPrice}
                    onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showAdjustModal && selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-400 mb-4">
              Current Balance: <span className="font-bold text-emerald-400">{selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}</span>
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity Adjustment (positive to add, negative to deduct)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="+10 or -5"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="PURCHASE_RECEIPT">Purchase Inward Receipt</option>
                  <option value="CYCLE_COUNT">Physical Inventory Audit / Reconciliation</option>
                  <option value="DAMAGE">Damaged / Broken</option>
                  <option value="EXPIRED">Expired Shelf Life</option>
                  <option value="CORRECTION">Manual Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Month-end count correction"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG WASTAGE MODAL */}
      {showWastageModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Log Spoilage / Food Wastage</h3>
            <p className="text-xs text-slate-400 mb-4">Record kitchen waste to maintain accurate stock and cost tracking</p>

            <form onSubmit={handleLogWastage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Raw Ingredient *</label>
                <select
                  required
                  value={wastageForm.inventoryItemId}
                  onChange={(e) => setWastageForm({ ...wastageForm, inventoryItemId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} (Stock: {it.currentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity Lost *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={wastageForm.quantity}
                    onChange={(e) => setWastageForm({ ...wastageForm, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reason</label>
                  <select
                    value={wastageForm.reason}
                    onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="SPOILAGE">Spoiled / Rotten</option>
                    <option value="EXPIRATION">Expired Shelf Date</option>
                    <option value="PREPARATION_ERROR">Kitchen Prep Burn / Error</option>
                    <option value="SPILLAGE">Spilled / Dropped</option>
                    <option value="OVERPRODUCTION">Unsold Overproduction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Refrigerator temperature failure overnight"
                  value={wastageForm.notes}
                  onChange={(e) => setWastageForm({ ...wastageForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-rose-950/40"
                >
                  Record Wastage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
