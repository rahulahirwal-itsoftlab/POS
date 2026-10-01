import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';

export default function PurchasesView() {
  const { restaurant, addToast } = useAuth();
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' | 'suppliers'
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
  });

  // Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    items: [],
    notes: '',
  });

  const currency = restaurant?.currency || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, invRes] = await Promise.all([
        posService.purchases.getAll(),
        posService.suppliers.getAll(),
        posService.inventory.getAll(),
      ]);
      if (purRes.success) setPurchases(purRes.data || []);
      if (supRes.success) setSuppliers(supRes.data || []);
      if (invRes.success) setInventoryItems(invRes.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load procurement data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    try {
      await posService.suppliers.create(supplierForm);
      addToast('Supplier added successfully', 'success');
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '', taxId: '' });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create supplier', 'error');
    }
  };

  const handleAddPurchaseItem = () => {
    if (inventoryItems.length === 0) {
      addToast('Add inventory items before creating purchase order', 'warning');
      return;
    }
    setPurchaseForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          inventoryItemId: inventoryItems[0].id,
          quantity: 1,
          unitCost: inventoryItems[0].costPrice || 10,
        },
      ],
    }));
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplierId) {
      addToast('Please select a supplier', 'warning');
      return;
    }
    if (purchaseForm.items.length === 0) {
      addToast('Add at least one raw material line item', 'warning');
      return;
    }

    try {
      const payload = {
        supplierId: purchaseForm.supplierId,
        invoiceNumber: purchaseForm.invoiceNumber.trim() || undefined,
        purchaseDate: purchaseForm.purchaseDate,
        notes: purchaseForm.notes.trim() || undefined,
        items: purchaseForm.items.map((it) => ({
          inventoryItemId: it.inventoryItemId,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
        })),
      };

      await posService.purchases.create(payload);
      addToast('Purchase receipt recorded & warehouse stock updated!', 'success');
      setShowPurchaseModal(false);
      setPurchaseForm({
        supplierId: '',
        invoiceNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        items: [],
        notes: '',
      });
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to record purchase', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <span>Procurement & Supplier Relations</span>
          </h1>
          <p className="text-sm text-slate-400">
            Manage vendor accounts, record inward stock purchases, and restock ingredient inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>New Supplier</span>
          </button>
          <button
            onClick={() => {
              if (suppliers.length === 0) {
                addToast('Create a supplier first', 'warning');
                return;
              }
              setPurchaseForm({
                supplierId: suppliers[0].id,
                invoiceNumber: `PO-${Date.now().toString().slice(-6)}`,
                purchaseDate: new Date().toISOString().split('T')[0],
                items: inventoryItems.length > 0 ? [{ inventoryItemId: inventoryItems[0].id, quantity: 10, unitCost: inventoryItems[0].costPrice || 25 }] : [],
                notes: '',
              });
              setShowPurchaseModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Record Inward Stock</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'purchases'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Purchase Orders ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Vendors & Suppliers ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {purchases.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="text-white font-semibold">No Inward Purchases Recorded</p>
              <p className="text-xs text-slate-500 mt-1">Record purchases to automatically replenish ingredient inventory levels.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Items Restocked</th>
                    <th className="px-5 py-3.5">Total Cost</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-white">
                        {p.invoiceNumber || `PO-${p.id.slice(0, 8)}`}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-300">
                        {p.supplier?.name || 'Unknown Supplier'}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {new Date(p.purchaseDate || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <div className="space-y-0.5">
                          {p.items?.map((it, idx) => (
                            <div key={idx}>
                              {it.quantity}x {it.inventoryItem?.name || 'Item'} @ {currency}{it.unitCost}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-400 font-mono text-sm">
                        {currency}{Number(p.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {p.status || 'RECEIVED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {suppliers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-600" />
              <p className="text-white font-semibold">No Suppliers Registered</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Vendor Name</th>
                    <th className="px-5 py-3.5">Contact Person</th>
                    <th className="px-5 py-3.5">Phone / Email</th>
                    <th className="px-5 py-3.5">Address</th>
                    <th className="px-5 py-3.5">Tax / GSTIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-white text-sm">
                        {s.name}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {s.contactPerson || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        <div>{s.phone || '—'}</div>
                        <div className="text-[11px] text-slate-500">{s.email || ''}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {s.address || '—'}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {s.taxId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Vendor / Supplier</h3>
            <p className="text-xs text-slate-400 mb-5">Register a wholesale merchant for goods procurement</p>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Farm Produce Ltd."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="sales@vendor.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="Industrial Area, Sector 4"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PURCHASE MODAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold text-white mb-1">Record Inward Stock Purchase</h3>
            <p className="text-xs text-slate-400 mb-4">Stock received will automatically increase ingredient inventories</p>

            <form onSubmit={handleCreatePurchase} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Supplier *</label>
                  <select
                    required
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">Goods Inward Items</span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {purchaseForm.items.map((it, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                      <select
                        value={it.inventoryItemId}
                        onChange={(e) => {
                          const inv = inventoryItems.find((x) => x.id === e.target.value);
                          setPurchaseForm((prev) => ({
                            ...prev,
                            items: prev.items.map((x, i) =>
                              i === idx ? { ...x, inventoryItemId: e.target.value, unitCost: inv?.costPrice || x.unitCost } : x
                            ),
                          }));
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) =>
                          setPurchaseForm((prev) => ({
                            ...prev,
                            items: prev.items.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)),
                          }))
                        }
                        className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Unit Cost"
                        value={it.unitCost}
                        onChange={(e) =>
                          setPurchaseForm((prev) => ({
                            ...prev,
                            items: prev.items.map((x, i) => (i === idx ? { ...x, unitCost: e.target.value } : x)),
                          }))
                        }
                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setPurchaseForm((prev) => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Batch Info</label>
                <input
                  type="text"
                  placeholder="e.g. Received batch fresh from supplier van"
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  Confirm Goods Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
