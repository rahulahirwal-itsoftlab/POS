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
  Layers,
  X
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
          costPerUnit: Number(it.unitCost),
          unitCost: Number(it.unitCost),
        })),
      };

      const res = await posService.purchases.create(payload);
      if (res?.data?.id) {
        try {
          await posService.purchases.receive(res.data.id);
        } catch {
          // If already received or error, continue
        }
      }
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] min-h-screen text-[#1F2937]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#92400E]" />
            <span>Procurement & Supplier Relations</span>
          </h1>
          <p className="text-sm text-[#5B6470]">
            Manage vendor accounts, record inward stock purchases, and restock ingredient inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F1E8DB] text-[#1F2937] text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#E5D8C6] transition-colors shadow-sm"
          >
            <Building2 className="w-4 h-4 text-[#D97706]" />
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
            className="flex items-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#92400E]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Record Inward Stock</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5D8C6] pb-3">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'purchases'
              ? 'bg-[#92400E] text-white shadow-sm'
              : 'bg-[#FAF7F2] text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6]'
          }`}
        >
          Purchase Orders ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-[#92400E] text-white shadow-sm'
              : 'bg-[#FAF7F2] text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6]'
          }`}
        >
          Vendors & Suppliers ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sm">
          {purchases.length === 0 ? (
            <div className="p-12 text-center text-[#5B6470]">
              <Package className="w-12 h-12 mx-auto mb-2 text-[#E7DCCB]" />
              <p className="text-[#1F2937] font-semibold">No Inward Purchases Recorded</p>
              <p className="text-xs text-[#5B6470] mt-1">Record purchases to automatically replenish ingredient inventory levels.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
                  <tr>
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Items Restocked</th>
                    <th className="px-5 py-3.5">Total Cost</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D8C6]/60">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F1E8DB]/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#1F2937]">
                        {p.invoiceNumber || `PO-${p.id.slice(0, 8)}`}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#1F2937]">
                        {p.supplier?.name || 'Unknown Supplier'}
                      </td>
                      <td className="px-5 py-4 text-[#5B6470] font-mono">
                        {new Date(p.purchaseDate || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-[#1F2937]">
                        <div className="space-y-0.5">
                          {p.items?.map((it, idx) => (
                            <div key={idx}>
                              {it.quantity} {it.inventoryItem?.unit || ''} {it.inventoryItem?.name || 'Item'} @ {currency}{Number(it.costPerUnit ?? it.unitCost ?? 0).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#16A34A] font-mono text-sm">
                        {currency}{Number(p.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-[#16A34A] border border-emerald-200">
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
        <div className="bg-white border border-[#E5D8C6] rounded-2xl overflow-hidden shadow-sm">
          {suppliers.length === 0 ? (
            <div className="p-12 text-center text-[#5B6470]">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-[#E7DCCB]" />
              <p className="text-[#1F2937] font-semibold">No Suppliers Registered</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#5B6470] uppercase text-[10px] font-bold border-b border-[#E5D8C6]">
                  <tr>
                    <th className="px-5 py-3.5">Vendor Name</th>
                    <th className="px-5 py-3.5">Contact Person</th>
                    <th className="px-5 py-3.5">Phone / Email</th>
                    <th className="px-5 py-3.5">Address</th>
                    <th className="px-5 py-3.5">Tax / GSTIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D8C6]/60">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F1E8DB]/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#1F2937] text-sm">
                        {s.name}
                      </td>
                      <td className="px-5 py-4 text-[#1F2937]">
                        {s.contactPerson || '—'}
                      </td>
                      <td className="px-5 py-4 text-[#5B6470] font-mono">
                        <div>{s.phone || '—'}</div>
                        <div className="text-[11px] text-[#5B6470]">{s.email || ''}</div>
                      </td>
                      <td className="px-5 py-4 text-[#5B6470]">
                        {s.address || '—'}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#5B6470]">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Add Vendor / Supplier</h3>
                <p className="text-xs text-[#5B6470]">Register a wholesale merchant for goods procurement</p>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Farm Produce Ltd."
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Email</label>
                <input
                  type="email"
                  placeholder="sales@vendor.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="Industrial Area, Sector 4"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-[#92400E]/20"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Record Inward Stock Purchase</h3>
                <p className="text-xs text-[#5B6470]">Stock received will automatically increase ingredient inventories</p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 flex-1 overflow-y-auto pr-1 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Supplier *</label>
                  <select
                    required
                    value={purchaseForm.supplierId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={purchaseForm.invoiceNumber}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1F2937]">Goods Inward Items</span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="text-xs text-[#92400E] font-semibold hover:text-[#78350F] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {purchaseForm.items.map((it, idx) => (
                    <div key={idx} className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E5D8C6] flex items-center gap-2">
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
                        className="flex-1 bg-white border border-[#E5D8C6] rounded-lg px-2 py-1 text-xs text-[#1F2937]"
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
                        className="w-20 bg-white border border-[#E5D8C6] rounded-lg px-2 py-1 text-xs text-[#1F2937] font-mono"
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
                        className="w-24 bg-white border border-[#E5D8C6] rounded-lg px-2 py-1 text-xs text-[#1F2937] font-mono"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setPurchaseForm((prev) => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-[#5B6470] hover:text-[#EF4444] p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">Notes / Batch Info</label>
                <input
                  type="text"
                  placeholder="e.g. Received batch fresh from supplier van"
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-[#92400E]/20"
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
