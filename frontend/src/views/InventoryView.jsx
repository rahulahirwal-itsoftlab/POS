import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import { INVENTORY_UNITS, getUnitLabel } from '../constants/inventory.constants';
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
  FileSpreadsheet,
  History,
  ArrowLeftRight,
  X
} from 'lucide-react';

export default function InventoryView() {
  const { restaurant, addToast, role } = useAuth();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'consumption' | 'audit' | 'wastage'
  const [items, setItems] = useState([]);
  const [wastages, setWastages] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [auditTransactions, setAuditTransactions] = useState([]);
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);

  // Forms
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    unit: 'KG',
    currentStock: 0,
    minStockThreshold: 5,
    costPerUnit: 0,
    storageLocation: 'Kitchen Storage',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    unit: 'KG',
    currentStock: 0,
    minStockThreshold: 5,
    costPerUnit: 0,
    storageLocation: 'Kitchen Storage',
  });

  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('Purchase Inward Receipt');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

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
      const [invRes, wstRes, kRes, txRes] = await Promise.all([
        posService.inventory.getAll(),
        posService.wastage.getAll(),
        posService.kitchen.getDashboard().catch(() => ({})),
        posService.inventory.getTransactions({ limit: 100 }).catch(() => ({})),
      ]);
      if (invRes.success) setItems(invRes.data || []);
      if (wstRes.success) setWastages(wstRes.data || []);
      if (kRes?.success && kRes.data?.recentActivity) {
        setConsumptions(kRes.data.recentActivity || []);
      }
      if (txRes?.success && txRes.data) {
        setAuditTransactions(Array.isArray(txRes.data) ? txRes.data : (txRes.data.transactions || []));
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
    const name = itemForm.name.trim();
    if (!name) {
      addToast('Item name is required', 'warning');
      return;
    }

    const currentStock = itemForm.currentStock === '' || itemForm.currentStock === null || itemForm.currentStock === undefined
      ? 0
      : Number(itemForm.currentStock);
    if (!Number.isFinite(currentStock) || currentStock < 0) {
      addToast('Opening stock cannot be negative', 'warning');
      return;
    }

    const minStockThreshold = itemForm.minStockThreshold === '' || itemForm.minStockThreshold === null || itemForm.minStockThreshold === undefined
      ? 5
      : Number(itemForm.minStockThreshold);
    if (!Number.isFinite(minStockThreshold) || minStockThreshold < 0) {
      addToast('Min safe level cannot be negative', 'warning');
      return;
    }

    const costPerUnit = itemForm.costPerUnit === '' || itemForm.costPerUnit === null || itemForm.costPerUnit === undefined
      ? 0
      : Number(itemForm.costPerUnit);
    if (!Number.isFinite(costPerUnit) || costPerUnit < 0) {
      addToast('Cost per unit cannot be negative', 'warning');
      return;
    }

    try {
      const payload = {
        name,
        sku: itemForm.sku.trim() || undefined,
        unit: itemForm.unit,
        currentStock,
        minStockThreshold,
        costPerUnit,
      };

      await posService.inventory.create(payload);
      addToast(`${payload.name} added to inventory`, 'success');
      setShowItemModal(false);
      setItemForm({
        name: '',
        sku: '',
        unit: 'KG',
        currentStock: 0,
        minStockThreshold: 5,
        costPerUnit: 0,
        storageLocation: 'Kitchen Storage',
      });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create inventory item', 'error');
    }
  };

  const openEditModal = (it) => {
    setSelectedItemForEdit(it);
    setEditForm({
      name: it.name || '',
      sku: it.sku || '',
      unit: it.unit || 'KG',
      currentStock: it.currentStock !== undefined ? Number(it.currentStock) : 0,
      minStockThreshold: it.minStockThreshold !== undefined ? Number(it.minStockThreshold) : 5,
      costPerUnit: it.costPerUnit !== undefined ? Number(it.costPerUnit) : 0,
      storageLocation: it.storageLocation || 'Kitchen Storage',
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;
    const name = editForm.name.trim();
    if (!name) {
      addToast('Item name is required', 'warning');
      return;
    }

    try {
      const payload = {
        name,
        sku: editForm.sku.trim() || undefined,
        unit: editForm.unit,
        currentStock: Number(editForm.currentStock) || 0,
        minStockThreshold: Number(editForm.minStockThreshold) || 0,
        costPerUnit: Number(editForm.costPerUnit) || 0,
      };

      await posService.inventory.update(selectedItemForEdit.id, payload);
      addToast(`${payload.name} updated successfully`, 'success');
      setShowEditModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update inventory item', 'error');
    }
  };

  const handleDeleteItem = async (it) => {
    if (!window.confirm(`Are you sure you want to delete ${it.name}?`)) return;
    try {
      await posService.inventory.delete(it.id);
      addToast(`${it.name} deleted successfully`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to delete inventory item', 'error');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedItemForAdjust || adjustLoading) return;

    if (adjustQuantity === '' || adjustQuantity === null || adjustQuantity === undefined) {
      addToast('Please enter a quantity adjustment', 'warning');
      return;
    }

    const numAdj = Number(adjustQuantity);
    if (!Number.isFinite(numAdj)) {
      addToast('Quantity adjustment must be a valid number', 'warning');
      return;
    }

    if (numAdj === 0) {
      addToast('Quantity adjustment cannot be zero', 'warning');
      return;
    }

    if (!adjustReason || !adjustReason.trim()) {
      addToast('Please select a reason for the adjustment', 'warning');
      return;
    }

    setAdjustLoading(true);
    try {
      await posService.inventory.adjustStock(selectedItemForAdjust.id, {
        quantityAdjustment: numAdj,
        reason: adjustReason.trim(),
        auditNotes: adjustNotes.trim() || undefined,
      });
      addToast('Stock adjusted successfully', 'success');
      setShowAdjustModal(false);
      setAdjustQuantity('');
      setAdjustNotes('');
      await loadData();
    } catch (err) {
      addToast(err.message || 'Unable to adjust stock. Please try again.', 'error');
    } finally {
      setAdjustLoading(false);
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

  const lowStockItems = items.filter((it) => {
    const threshold = Number(it.minStockThreshold !== undefined ? it.minStockThreshold : (it.minStockLevel !== undefined ? it.minStockLevel : 5));
    return Number(it.currentStock ?? 0) <= threshold;
  });

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (it.sku && it.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] min-h-screen text-[#1F2937]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#92400E]" />
            <span>Inventory, Stock & Wastage Control</span>
          </h1>
          <p className="text-sm text-[#5B6470]">
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
            className="flex items-center gap-1.5 bg-white hover:bg-rose-50 text-[#EF4444] text-xs font-semibold px-4 py-2.5 rounded-xl border border-rose-200 transition-colors shadow-sm"
          >
            <TrendingDown className="w-4 h-4 text-[#EF4444]" />
            <span>Log Wastage</span>
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            className="flex items-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#92400E]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#D97706] shrink-0" />
            <div>
              <div className="text-sm font-bold text-[#92400E]">
                Low Stock Warning: {lowStockItems.length} ingredients below safe reorder threshold!
              </div>
              <div className="text-xs text-[#B45309] mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).slice(0, 4).join(', ')}
                {lowStockItems.length > 4 ? ' and more...' : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5D8C6] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'stock'
              ? 'bg-[#92400E] text-white shadow-sm'
              : 'bg-[#FAF7F2] text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6]'
          }`}
        >
          Raw Materials Stock ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('consumption')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'consumption'
              ? 'bg-[#92400E] text-white shadow-sm'
              : 'bg-[#FAF7F2] text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6]'
          }`}
        >
          Consumption History ({consumptions.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-[#92400E] text-white shadow-sm'
              : 'bg-[#FAF7F2] text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6]'
          }`}
        >
          Stock Movements & Audit ({auditTransactions.length})
        </button>
        {role !== 'KITCHEN_ADMIN' && (
          <button
            onClick={() => setActiveTab('wastage')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wastage'
                ? 'bg-[#92400E] text-white shadow-sm'
                : 'bg-[#FAF7F2] text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6]'
            }`}
          >
            Wastage Log History ({wastages.length})
          </button>
        )}
      </div>

      {/* TAB 1: STOCK ITEMS */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5D8C6] flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-[#5B6470] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw material or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1F2937] placeholder-[#5B6470] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
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
              <tbody className="divide-y divide-[#E5D8C6]/60">
                {filteredItems.map((it) => {
                  const minSafe = Number(it.minStockThreshold !== undefined ? it.minStockThreshold : (it.minStockLevel !== undefined ? it.minStockLevel : 5));
                  const currentStock = Number(it.currentStock ?? 0);
                  const isLow = currentStock <= minSafe;
                  const cost = Number(it.costPerUnit !== undefined ? it.costPerUnit : (it.costPrice !== undefined ? it.costPrice : 0));
                  return (
                    <tr key={it.id} className="hover:bg-[#F1E8DB]/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1F2937] text-sm">{it.name}</div>
                        <div className="text-[11px] text-[#5B6470] font-mono">Unit: {it.unit}</div>
                      </td>
                      <td className="px-5 py-4 font-mono text-[#5B6470]">
                        {it.sku || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isLow ? 'text-[#EF4444]' : 'text-[#16A34A]'
                          }`}
                        >
                          {currentStock % 1 === 0 ? currentStock : currentStock.toFixed(2)} {it.unit}
                        </span>
                        {isLow && (
                          <div className="text-[10px] text-[#EF4444] font-bold uppercase mt-0.5">
                            Low Stock Alert
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#5B6470] font-mono">
                        {minSafe % 1 === 0 ? minSafe : minSafe.toFixed(2)} {it.unit}
                      </td>
                      <td className="px-5 py-4 text-[#1F2937] font-mono">
                        {currency}{cost.toFixed(2)} / {it.unit}
                      </td>
                      <td className="px-5 py-4 text-[#5B6470]">
                        {it.storageLocation || 'Main Warehouse'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setSelectedItemForAdjust(it);
                              setAdjustQuantity('');
                              setAdjustReason('Purchase Inward Receipt');
                              setAdjustNotes('');
                              setShowAdjustModal(true);
                            }}
                            className="inline-flex items-center gap-1 bg-white hover:bg-[#F1E8DB] text-[#92400E] px-2.5 py-1.5 rounded-lg border border-[#E5D8C6] font-semibold transition-colors shadow-sm text-xs"
                            title="Adjust Stock"
                          >
                            <Scale className="w-3.5 h-3.5 text-[#92400E]" />
                            <span>Adjust</span>
                          </button>
                          <button
                            onClick={() => openEditModal(it)}
                            className="p-1.5 bg-white hover:bg-[#F1E8DB] text-[#5B6470] hover:text-[#1F2937] rounded-lg border border-[#E5D8C6] transition-colors shadow-sm"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {role === 'RESTAURANT_OWNER' && (
                            <button
                              onClick={() => handleDeleteItem(it)}
                              className="p-1.5 bg-white hover:bg-rose-50 text-[#5B6470] hover:text-[#EF4444] rounded-lg border border-[#E5D8C6] hover:border-rose-200 transition-colors shadow-sm"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
        <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sm">
          {wastages.length === 0 ? (
            <div className="p-12 text-center text-[#5B6470]">
              <TrendingDown className="w-12 h-12 mx-auto mb-2 text-[#E7DCCB]" />
              <p className="text-[#1F2937] font-semibold">No Spoilage / Wastage Logged</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
                  <tr>
                    <th className="px-5 py-3.5">Ingredient</th>
                    <th className="px-5 py-3.5">Wasted Quantity</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Estimated Cost</th>
                    <th className="px-5 py-3.5">Logged At</th>
                    <th className="px-5 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D8C6]/60">
                  {wastages.map((wst) => (
                    <tr key={wst.id} className="hover:bg-[#F1E8DB]/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#1F2937]">
                        {wst.inventoryItem?.name || 'Raw Ingredient'}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-[#EF4444]">
                        {wst.quantity} {wst.inventoryItem?.unit || 'units'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-[#EF4444] border border-rose-200">
                          {wst.reason}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[#1F2937]">
                        {currency}{Number(wst.totalCost || wst.cost || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#5B6470]">
                        {new Date(wst.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-[#5B6470] italic">
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
        <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5D8C6]">
            <h3 className="text-sm font-bold text-[#1F2937]">Recipe Ingredient Depletion Audit Trail</h3>
            <p className="text-xs text-[#5B6470]">Traceable log of stock automatically deducted when food tickets are marked READY</p>
          </div>

          {consumptions.length === 0 ? (
            <div className="p-12 text-center text-[#5B6470]">
              <Boxes className="w-12 h-12 mx-auto mb-2 text-[#E7DCCB]" />
              <p className="text-[#1F2937] font-semibold">No Consumption Recorded Yet</p>
              <p className="text-xs text-[#5B6470] mt-1">Stock consumption entries appear when kitchen orders are completed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
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
                <tbody className="divide-y divide-[#E5D8C6]/60">
                  {consumptions.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#F1E8DB]/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-[#5B6470]">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#1F2937]">
                        {entry.inventoryItem?.name || 'Raw Material'}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-[#EF4444]">
                        {Number(entry.quantity).toFixed(4)} {entry.unit}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#5B6470]">
                        {Number(entry.previousBalance).toFixed(4)} {entry.unit}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-[#16A34A]">
                        {Number(entry.remainingBalance).toFixed(4)} {entry.unit}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#D97706] font-semibold">
                        {entry.reference || '—'}
                      </td>
                      <td className="px-5 py-4 text-[#1F2937]">
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

      {/* TAB 4: STOCK MOVEMENTS & AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5D8C6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">Stock Movements & Transaction Audit Trail</h3>
              <p className="text-xs text-[#5B6470]">Traceable ledger of inward receipts, manual adjustments, transfers, and opening stock</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5D8C6]">
              {['ALL', 'PURCHASE', 'ADJUSTMENT', 'TRANSFER'].map((f) => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    auditFilter === f
                      ? 'bg-[#92400E] text-white shadow-xs'
                      : 'text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB]'
                  }`}
                >
                  {f === 'ALL' ? 'All Movements' : f === 'PURCHASE' ? 'Inward / Opening' : f === 'ADJUSTMENT' ? 'Adjustments' : 'Transfers'}
                </button>
              ))}
            </div>
          </div>

          {auditTransactions.filter((t) => auditFilter === 'ALL' || t.type === auditFilter).length === 0 ? (
            <div className="p-12 text-center text-[#5B6470]">
              <History className="w-12 h-12 mx-auto mb-2 text-[#E7DCCB]" />
              <p className="text-[#1F2937] font-semibold">No Stock Movements Found</p>
              <p className="text-xs text-[#5B6470] mt-1">Stock adjustments, inward purchases, and transfers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
                  <tr>
                    <th className="px-5 py-3.5">Date / Time</th>
                    <th className="px-5 py-3.5">Ingredient / SKU</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Change</th>
                    <th className="px-5 py-3.5">Prev Balance</th>
                    <th className="px-5 py-3.5">New Balance</th>
                    <th className="px-5 py-3.5">Reason & Reference</th>
                    <th className="px-5 py-3.5">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D8C6]/60">
                  {auditTransactions
                    .filter((t) => auditFilter === 'ALL' || t.type === auditFilter)
                    .map((entry) => {
                      const isPositive = Number(entry.quantity) >= 0;
                      const unit = entry.unit || entry.inventoryItem?.unit || 'units';
                      return (
                        <tr key={entry.id} className="hover:bg-[#F1E8DB]/40 transition-colors">
                          <td className="px-5 py-4 font-mono text-[#5B6470] whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 font-bold text-[#1F2937]">
                            <div>{entry.inventoryItem?.name || 'Raw Material'}</div>
                            {entry.inventoryItem?.sku && (
                              <div className="text-[10px] text-[#5B6470] font-mono">{entry.inventoryItem.sku}</div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              entry.type === 'PURCHASE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : entry.type === 'TRANSFER'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : entry.type === 'CONSUMPTION'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {entry.reason?.includes('Opening') ? 'Opening Stock' : entry.type}
                            </span>
                          </td>
                          <td className={`px-5 py-4 font-mono font-bold ${isPositive ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                            {isPositive ? `+${Number(entry.quantity).toFixed(2)}` : Number(entry.quantity).toFixed(2)} {unit}
                          </td>
                          <td className="px-5 py-4 font-mono text-[#5B6470]">
                            {Number(entry.previousBalance).toFixed(2)} {unit}
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-[#1F2937]">
                            {Number(entry.remainingBalance).toFixed(2)} {unit}
                          </td>
                          <td className="px-5 py-4 text-[#1F2937]">
                            <div className="font-medium">{entry.reason || 'Manual Adjustment'}</div>
                            {entry.reference && (
                              <div className="text-[11px] text-[#5B6470] italic">{entry.reference}</div>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono text-[#5B6470]">
                            {entry.user?.name || entry.user?.email?.split('@')[0] || 'System'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE STOCK ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Add Warehouse Inventory Item</h3>
                <p className="text-xs text-[#5B6470]">Track bulk raw ingredients, produce, and bar supplies</p>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arabica Coffee Beans"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="ING-COF-01"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Unit of Measure *</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.currentStock}
                    onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">Min Safe Level</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.minStockThreshold}
                    onChange={(e) => setItemForm({ ...itemForm, minStockThreshold: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.costPerUnit}
                    onChange={(e) => setItemForm({ ...itemForm, costPerUnit: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-[#92400E]/20"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STOCK ITEM MODAL */}
      {showEditModal && selectedItemForEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Edit Inventory Item</h3>
                <p className="text-xs text-[#5B6470]">Update raw ingredient details and thresholds</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Unit of Measure *</label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  >
                    {INVENTORY_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">Current Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.currentStock}
                    onChange={(e) => setEditForm({ ...editForm, currentStock: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">Min Safe Level</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.minStockThreshold}
                    onChange={(e) => setEditForm({ ...editForm, minStockThreshold: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2937] mb-1">Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.costPerUnit}
                    onChange={(e) => setEditForm({ ...editForm, costPerUnit: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-2.5 py-1.5 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-[#92400E]/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showAdjustModal && selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Adjust Inventory Stock</h3>
                <p className="text-xs text-[#5B6470]">
                  Current Balance: <span className="font-bold text-[#16A34A]">
                    {Number(selectedItemForAdjust.currentStock) % 1 === 0 ? Number(selectedItemForAdjust.currentStock) : Number(selectedItemForAdjust.currentStock).toFixed(2)} {selectedItemForAdjust.unit}
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={adjustLoading}
                onClick={() => !adjustLoading && setShowAdjustModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB] disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Quantity Adjustment (positive to add, negative to deduct) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="+10 or -5"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  disabled={adjustLoading}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-sm text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Reason *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  disabled={adjustLoading}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E] disabled:opacity-50"
                >
                  <option value="Purchase Inward Receipt">Purchase Inward Receipt</option>
                  <option value="Physical Inventory Audit / Reconciliation">Physical Inventory Audit / Reconciliation</option>
                  <option value="Damaged / Broken">Damaged / Broken</option>
                  <option value="Expired Shelf Life">Expired Shelf Life</option>
                  <option value="Manual Correction">Manual Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Month-end count correction"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  disabled={adjustLoading}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E] disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  disabled={adjustLoading}
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-[#92400E]/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {adjustLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{adjustLoading ? 'Adjusting...' : 'Confirm Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* LOG WASTAGE MODAL */}
      {showWastageModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Log Spoilage / Food Wastage</h3>
                <p className="text-xs text-[#5B6470]">Record kitchen waste to maintain accurate stock and cost tracking</p>
              </div>
              <button
                onClick={() => setShowWastageModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogWastage} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Raw Ingredient *</label>
                <select
                  required
                  value={wastageForm.inventoryItemId}
                  onChange={(e) => setWastageForm({ ...wastageForm, inventoryItemId: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
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
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Quantity Lost *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={wastageForm.quantity}
                    onChange={(e) => setWastageForm({ ...wastageForm, quantity: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Reason</label>
                  <select
                    value={wastageForm.reason}
                    onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
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
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Incident Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Refrigerator temperature failure overnight"
                  value={wastageForm.notes}
                  onChange={(e) => setWastageForm({ ...wastageForm, notes: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-rose-950/20"
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
