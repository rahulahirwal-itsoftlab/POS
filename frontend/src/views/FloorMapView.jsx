import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Users,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  Receipt
} from 'lucide-react';

export default function FloorMapView({ onSelectTableForOrder, onNavigateToBilling }) {
  const { role, restaurant, addToast } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4, floor: 'Ground Floor' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await posService.tables.getAll();
      if (res.success && res.data) {
        setTables(res.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch floor tables', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleServeOrder = async (orderId) => {
    try {
      await posService.orders.updateStatus(orderId, 'SERVED');
      addToast('Order marked SERVED to customer!', 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to mark order as served', 'error');
    }
  };

  const handleStatusChange = async (tableId, nextStatus) => {
    try {
      await posService.tables.updateStatus(tableId, nextStatus);
      addToast(`Table status updated to ${nextStatus}`, 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to update table status', 'error');
    }
  };

  const handleDeleteTable = async (tableId, tableNum) => {
    if (!window.confirm(`Are you sure you want to remove Table #${tableNum}?`)) return;
    try {
      await posService.tables.delete(tableId);
      addToast(`Table #${tableNum} deleted`, 'success');
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Cannot delete table with active orders', 'error');
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.tableNumber) {
      addToast('Table number is required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await posService.tables.create({
        tableNumber: newTable.tableNumber.trim(),
        capacity: Number(newTable.capacity),
        floor: newTable.floor,
        status: 'AVAILABLE',
      });
      addToast(`Table ${newTable.tableNumber} added successfully`, 'success');
      setShowAddModal(false);
      setNewTable({ tableNumber: '', capacity: 4, floor: 'Ground Floor' });
      fetchTables();
    } catch (err) {
      addToast(err.message || 'Failed to create table', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const floors = ['ALL', ...new Set(tables.map((t) => t.floor || 'Main Hall'))];

  const filteredTables = tables.filter((t) => {
    const matchFloor = filterFloor === 'ALL' || (t.floor || 'Main Hall') === filterFloor;
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchFloor && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Available', dot: 'bg-emerald-400' };
      case 'OCCUPIED':
        return { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: 'Occupied', dot: 'bg-rose-400' };
      case 'RESERVED':
        return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Reserved', dot: 'bg-amber-400' };
      default:
        return { bg: 'bg-slate-700/40 text-slate-400 border-slate-700', label: 'Out of Order', dot: 'bg-slate-400' };
    }
  };

  const summary = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-emerald-400" />
            <span>Floor Plan & Dining Tables</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time table availability, active dining sessions, and seating management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTables}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh Floor"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          {['RESTAURANT_OWNER'].includes(role) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'ALL'
              ? 'bg-slate-800/90 border-emerald-500/50 shadow-md shadow-emerald-950/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-semibold text-slate-400">Total Tables</div>
          <div className="text-2xl font-bold text-white mt-1">{summary.total}</div>
        </div>

        <div
          onClick={() => setFilterStatus('AVAILABLE')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'AVAILABLE'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Available
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.available}</div>
        </div>

        <div
          onClick={() => setFilterStatus('OCCUPIED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'OCCUPIED'
              ? 'bg-rose-950/40 border-rose-500/60 shadow-md shadow-rose-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Occupied
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{summary.occupied}</div>
        </div>

        <div
          onClick={() => setFilterStatus('RESERVED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filterStatus === 'RESERVED'
              ? 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-950/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Reserved
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary.reserved}</div>
        </div>
      </div>

      {/* Floor Filter Tabs */}
      {floors.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setFilterFloor(floor)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                filterFloor === floor
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {floor === 'ALL' ? 'All Floors' : floor}
            </button>
          ))}
        </div>
      )}

      {/* Floor Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading dining floor layout...</span>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <LayoutGrid className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Tables Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {tables.length === 0
              ? 'No tables created yet. Add your dining tables to start taking orders.'
              : 'No tables match the current filter selection.'}
          </p>
          {['RESTAURANT_OWNER'].includes(role) && tables.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Add First Table
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const badge = getStatusBadge(table.status);
            return (
              <div
                key={table.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl group ${
                  table.status === 'OCCUPIED'
                    ? 'border-rose-500/30 hover:border-rose-500/60'
                    : table.status === 'AVAILABLE'
                    ? 'border-emerald-500/30 hover:border-emerald-500/60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">
                      Table #{table.tableNumber}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{table.capacity} Guests</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span>{table.floor || 'Main Hall'}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  {/* Ready Order Alert Banner for Waiter */}
                  {table.orders?.some((o) => o.status === 'READY') && (
                    <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                        <span>Food Ready to Serve!</span>
                      </div>
                      <button
                        onClick={() => {
                          const readyOrd = table.orders.find((o) => o.status === 'READY');
                          if (readyOrd) handleServeOrder(readyOrd.id);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                      >
                        Serve Food
                      </button>
                    </div>
                  )}

                  {table.status === 'AVAILABLE' ? (
                    <button
                      onClick={() => onSelectTableForOrder && onSelectTableForOrder(table)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors shadow-sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>New Order</span>
                    </button>
                  ) : table.status === 'OCCUPIED' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectTableForOrder && onSelectTableForOrder(table)}
                        className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-2 rounded-xl transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Add Items</span>
                      </button>
                      <button
                        onClick={() => onNavigateToBilling && onNavigateToBilling(table)}
                        className="flex items-center justify-center gap-1 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold py-2 px-2 rounded-xl transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Checkout</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Status Dropdown & Delete Option */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <select
                      value={table.status}
                      onChange={(e) => handleStatusChange(table.id, e.target.value)}
                      className="text-[11px] bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="AVAILABLE">Mark Available</option>
                      <option value="OCCUPIED">Mark Occupied</option>
                      <option value="RESERVED">Mark Reserved</option>
                      <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>

                    {role === 'RESTAURANT_OWNER' && (
                      <button
                        onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Dining Table</h3>
            <p className="text-xs text-slate-400 mb-5">Create a new table for dining service</p>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Table Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, T-5, Patio-1"
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Guest Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Floor / Dining Section
                </label>
                <select
                  value={newTable.floor}
                  onChange={(e) => setNewTable({ ...newTable, floor: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="First Floor">First Floor</option>
                  <option value="Rooftop Terrace">Rooftop Terrace</option>
                  <option value="Outdoor Patio">Outdoor Patio</option>
                  <option value="VIP Lounge">VIP Lounge</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  {submitting ? 'Adding...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
