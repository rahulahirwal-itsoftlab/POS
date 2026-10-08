import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Users,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  ShoppingBag,
  Receipt,
  X,
  AlertCircle
} from 'lucide-react';

export default function TableManagementView({ onSelectTableForOrder, onNavigateToBilling }) {
  const { role, addToast } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({ tableNumber: '', capacity: 4, status: 'AVAILABLE' });
  const [editForm, setEditForm] = useState({ tableNumber: '', capacity: 4, status: 'AVAILABLE' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await posService.tables.getAll();
      if (res.success && res.data) {
        // Backend returns paginated object or items array
        const list = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setTables(list);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch restaurant tables', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!addForm.tableNumber.trim()) {
      addToast('Table number is required', 'warning');
      return;
    }
    const cap = Number(addForm.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      addToast('Capacity must be a positive integer', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await posService.tables.create({
        tableNumber: addForm.tableNumber.trim(),
        capacity: cap,
        status: addForm.status || 'AVAILABLE',
      });
      addToast(`Table ${addForm.tableNumber} created successfully`, 'success');
      setShowAddModal(false);
      setAddForm({ tableNumber: '', capacity: 4, status: 'AVAILABLE' });
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to create table', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setEditForm({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
    });
    setShowEditModal(true);
  };

  const handleUpdateTable = async (e) => {
    e.preventDefault();
    if (!editingTable) return;
    if (!editForm.tableNumber.trim()) {
      addToast('Table number is required', 'warning');
      return;
    }
    const cap = Number(editForm.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      addToast('Capacity must be a positive integer', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await posService.tables.update(editingTable.id, {
        tableNumber: editForm.tableNumber.trim(),
        capacity: cap,
        status: editForm.status,
      });
      addToast(`Table ${editForm.tableNumber} updated successfully`, 'success');
      setShowEditModal(false);
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to update table', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (tableId, nextStatus) => {
    try {
      await posService.tables.updateStatus(tableId, nextStatus);
      addToast(`Table status changed to ${nextStatus}`, 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to update table status', 'error');
    }
  };

  const handleDeleteTable = async (tableId, tableNum) => {
    if (!window.confirm(`Are you sure you want to remove Table ${tableNum}?`)) return;
    try {
      await posService.tables.delete(tableId);
      addToast(`Table ${tableNum} deleted successfully`, 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Cannot delete table with active orders', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Available',
          dot: 'bg-emerald-500',
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          label: 'Occupied',
          dot: 'bg-rose-500',
        };
      case 'RESERVED':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          label: 'Reserved',
          dot: 'bg-amber-500',
        };
      case 'OUT_OF_SERVICE':
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          label: 'Out of Service',
          dot: 'bg-slate-400',
        };
    }
  };

  const filteredTables = tables.filter((t) => {
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchSearch =
      !searchQuery.trim() ||
      t.tableNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const summary = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
    outOfService: tables.filter((t) => t.status === 'OUT_OF_SERVICE').length,
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0 bg-[#FAF7F2] min-h-screen text-[#1F2937]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-[#92400E]" />
            <span>Table Management</span>
          </h1>
          <p className="text-sm text-[#5B6470] mt-0.5">
            Manage tables and seating areas for your restaurant
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTables}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-[#F1E8DB] text-[#1F2937] rounded-xl border border-[#E5D8C6] shadow-sm transition-colors cursor-pointer"
            title="Refresh Table Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#92400E]' : 'text-[#5B6470]'}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#92400E]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Real-time Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterStatus('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'ALL'
              ? 'bg-white border-[#92400E] ring-1 ring-[#92400E] shadow-sm'
              : 'bg-white border-[#E5D8C6] hover:border-[#92400E] shadow-sm'
          }`}
        >
          <div className="text-xs font-semibold text-[#5B6470]">Total Tables</div>
          <div className="text-2xl font-extrabold text-[#1F2937] mt-1">{summary.total}</div>
        </div>

        <div
          onClick={() => setFilterStatus('AVAILABLE')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'AVAILABLE'
              ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400 shadow-sm'
              : 'bg-white border-[#E5D8C6] hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Available
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1">{summary.available}</div>
        </div>

        <div
          onClick={() => setFilterStatus('OCCUPIED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'OCCUPIED'
              ? 'bg-rose-50/70 border-rose-400 ring-1 ring-rose-400 shadow-sm'
              : 'bg-white border-[#E5D8C6] hover:border-rose-300 shadow-sm'
          }`}
        >
          <div className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Occupied
          </div>
          <div className="text-2xl font-extrabold text-rose-800 mt-1">{summary.occupied}</div>
        </div>

        <div
          onClick={() => setFilterStatus('RESERVED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'RESERVED'
              ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400 shadow-sm'
              : 'bg-white border-[#E5D8C6] hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Reserved
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{summary.reserved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5D8C6] shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#92400E] text-white shadow-sm'
                  : 'bg-[#FAF7F2] text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6]'
              }`}
            >
              {status === 'ALL'
                ? `All (${summary.total})`
                : status === 'AVAILABLE'
                ? `Available (${summary.available})`
                : status === 'OCCUPIED'
                ? `Occupied (${summary.occupied})`
                : status === 'RESERVED'
                ? `Reserved (${summary.reserved})`
                : `Out of Service (${summary.outOfService})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#5B6470] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1F2937] placeholder-[#5B6470] focus:outline-none focus:border-[#92400E]"
          />
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 bg-white border border-[#E5D8C6] rounded-2xl shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin" />
          <span className="text-sm text-[#5B6470]">Loading tables from database...</span>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-12 text-center shadow-sm">
          <LayoutGrid className="w-12 h-12 text-[#E7DCCB] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#1F2937]">No Tables Found</h3>
          <p className="text-xs text-[#5B6470] mt-1 max-w-sm mx-auto">
            {tables.length === 0
              ? 'No dining tables created yet. Click "Add Table" to get started.'
              : 'No tables match the current search or status filter.'}
          </p>
          {tables.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Table
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const badge = getStatusBadge(table.status);
            const activeOrder = table.activeOrders?.[0] || table.orders?.[0];

            return (
              <div
                key={table.id}
                className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group ${
                  table.status === 'OCCUPIED'
                    ? 'border-rose-200 bg-rose-50/20'
                    : table.status === 'AVAILABLE'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-[#E5D8C6] hover:border-[#92400E]'
                }`}
              >
                {/* Table Header & Seating Info */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-[#1F2937] text-lg group-hover:text-[#92400E] transition-colors">
                      {table.tableNumber.toLowerCase().startsWith('table')
                        ? table.tableNumber
                        : `Table ${table.tableNumber}`}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#5B6470] mb-4 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#92400E]" />
                      <span className="font-semibold text-[#1F2937]">{table.capacity} Seats</span>
                    </span>
                    {activeOrder && (
                      <>
                        <span className="text-[#E5D8C6]">•</span>
                        <span className="text-rose-700 font-semibold truncate max-w-[120px]">
                          {activeOrder.orderNumber}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="space-y-2 pt-3 border-t border-[#E5D8C6]">
                  {/* Order Workflow Buttons */}
                  {table.status === 'AVAILABLE' ? (
                    <button
                      onClick={() => onSelectTableForOrder && onSelectTableForOrder(table)}
                      className="w-full flex items-center justify-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Take Order</span>
                    </button>
                  ) : table.status === 'OCCUPIED' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectTableForOrder && onSelectTableForOrder(table)}
                        className="flex items-center justify-center gap-1 bg-[#FAF7F2] hover:bg-[#F1E8DB] text-[#1F2937] border border-[#E5D8C6] text-xs font-semibold py-2 px-2 rounded-xl transition-colors cursor-pointer"
                        title="Add items to existing order"
                      >
                        <ShoppingBag className="w-3 h-3 text-[#92400E]" />
                        <span>Add Items</span>
                      </button>
                      <button
                        onClick={() => onNavigateToBilling && onNavigateToBilling(table)}
                        className="flex items-center justify-center gap-1 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold py-2 px-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                        title="Go to billing & payment"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Checkout</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Status Dropdown, Edit & Delete */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={table.status}
                      onChange={(e) => handleStatusChange(table.id, e.target.value)}
                      className="text-[11px] bg-[#FAF7F2] border border-[#E5D8C6] text-[#1F2937] rounded-lg px-2 py-1 focus:outline-none focus:border-[#92400E] cursor-pointer"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditTable(table)}
                        className="p-1.5 rounded-lg text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] transition-colors cursor-pointer"
                        title="Edit Table"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                        className="p-1.5 rounded-lg text-[#5B6470] hover:text-[#EF4444] hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD TABLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Add New Table</h3>
                <p className="text-xs text-[#5B6470]">Create a table for your restaurant</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Table Number / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 1, T2, 101"
                  value={addForm.tableNumber}
                  onChange={(e) => setAddForm({ ...addForm, tableNumber: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Seating Capacity (Guests) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={addForm.capacity}
                  onChange={(e) => setAddForm({ ...addForm, capacity: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3.5 py-2 text-sm text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Initial Status
                </label>
                <select
                  value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-[#92400E]/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TABLE MODAL */}
      {showEditModal && editingTable && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C6]">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Edit Table</h3>
                <p className="text-xs text-[#5B6470]">Update table details and seating capacity</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                }}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTable} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Table Number / Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.tableNumber}
                  onChange={(e) => setEditForm({ ...editForm, tableNumber: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Seating Capacity (Guests) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3.5 py-2 text-sm text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTable(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#92400E] hover:bg-[#78350F] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-[#92400E]/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
