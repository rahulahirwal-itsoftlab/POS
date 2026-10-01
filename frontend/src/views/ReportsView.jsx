import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Boxes,
  Trash2,
  Calendar,
  DollarSign,
  PieChart,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ReceiptText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function ReportsView() {
  const { restaurant, addToast } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'financials'
  const [dashboard, setDashboard] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [wastageReport, setWastageReport] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

  // Financial Ledger Filter
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');

  const currency = restaurant?.currency || '₹';

  const loadReports = async () => {
    setLoading(true);
    try {
      const [dash, sales, inv, wst, fin] = await Promise.all([
        posService.reports.getDashboard(),
        posService.reports.getSales(),
        posService.reports.getInventory(),
        posService.reports.getWastage(),
        posService.reports.getFinancials(),
      ]);
      if (dash.success) setDashboard(dash.data);
      if (sales.success) setSalesReport(sales.data);
      if (inv.success) setInventoryReport(inv.data);
      if (wst.success) setWastageReport(wst.data);
      if (fin.success) setFinancials(fin.data);
    } catch (err) {
      addToast(err.message || 'Failed to compile analytical reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredLedger = financials?.ledger?.filter((entry) => {
    const matchSearch =
      entry.description?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      entry.category?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      entry.method?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (entry.ref && entry.ref.toLowerCase().includes(ledgerSearch.toLowerCase()));

    const matchType =
      ledgerTypeFilter === 'ALL' ||
      (ledgerTypeFilter === 'SALE' && entry.type === 'SALE') ||
      (ledgerTypeFilter === 'EXPENSE' && entry.type === 'EXPENSE');

    return matchSearch && matchType;
  }) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Executive Intelligence & Financial Command</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time financial performance, sales velocity, warehouse valuation, and Money In vs Money Out ledger
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Operational Overview
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'financials'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Financial Ledger (Cashflow)
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        /* TAB 1: OPERATIONAL OVERVIEW */
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Gross Sales Revenue</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                {currency}{Number(dashboard?.totalRevenue || salesReport?.totalSales || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Completed orders & settlements</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Orders Handled</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white mt-2">
                {dashboard?.totalOrders || salesReport?.orderCount || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Dine-In, Takeaway & Delivery
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Warehouse Valuation</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white mt-2 font-mono">
                {currency}{Number(inventoryReport?.totalValuation || inventoryReport?.totalValue || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {inventoryReport?.totalItems || 0} ingredient SKUs on hand
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Recorded Wastage Loss</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">
                {currency}{Number(wastageReport?.totalWastageCost || wastageReport?.totalCost || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-rose-400/80 mt-1">
                {wastageReport?.incidentCount || 0} spoilage/prep incidents
              </div>
            </div>
          </div>

          {/* Sales Breakdown & Top Selling Dishes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Top Performing Menu Items</span>
              </h3>

              {salesReport?.topSellingItems?.length > 0 ? (
                <div className="space-y-3">
                  {salesReport.topSellingItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          {currency}{Number(item.totalRevenue || item.revenue || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.totalQuantity || item.quantity} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Place and complete food orders to populate velocity stats.
                </div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-400" />
                <span>Payment Method Distribution</span>
              </h3>

              {salesReport?.paymentMethodBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {salesReport.paymentMethodBreakdown.map((pm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-xs font-bold text-white uppercase">{pm.method}</span>
                      <div className="text-right">
                        <div className="text-xs font-bold text-white font-mono">
                          {currency}{Number(pm.total || pm.amount || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">{pm.count} transactions</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Settled payments will display method breakdown here.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* TAB 2: FINANCIAL STATEMENT & CASHFLOW LEDGER */
        <div className="space-y-6">
          {/* Financial KPI Cards: Money In vs Money Out */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Money In (Total Revenue)</span>
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {financials?.counts?.salesTransactions || 0} Sales
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-3 font-mono">
                +{currency}{Number(financials?.totalRevenue || 0).toFixed(2)}
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-900/40 text-[11px] text-slate-300 space-y-1">
                {financials?.breakdown?.revenueByMethod &&
                  Object.entries(financials.breakdown.revenueByMethod).map(([m, amt]) => (
                    <div key={m} className="flex justify-between font-mono">
                      <span className="text-slate-400">{m}:</span>
                      <span className="text-emerald-400 font-semibold">{currency}{Number(amt).toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-rose-500/30 p-5 rounded-2xl bg-rose-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Money Out (Total Expenses)</span>
                </span>
                <span className="text-xs bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/30">
                  Purchases + Waste
                </span>
              </div>
              <div className="text-3xl font-extrabold text-rose-400 mt-3 font-mono">
                -{currency}{Number(financials?.totalExpenses || 0).toFixed(2)}
              </div>
              <div className="mt-3 pt-2 border-t border-rose-900/40 text-[11px] text-slate-300 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Supplier Purchases:</span>
                  <span className="text-rose-400 font-semibold">
                    -{currency}{Number(financials?.breakdown?.purchasesExpense || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wastage / Spoilage Losses:</span>
                  <span className="text-rose-400 font-semibold">
                    -{currency}{Number(financials?.breakdown?.wastageExpense || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className={`bg-slate-900 border p-5 rounded-2xl ${
              (financials?.netAmount || 0) >= 0
                ? 'border-emerald-500/40 bg-slate-900'
                : 'border-rose-500/40 bg-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  <span>Net Revenue / Profit</span>
                </span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Cashflow
                </span>
              </div>
              <div className={`text-3xl font-extrabold mt-3 font-mono ${
                (financials?.netAmount || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(financials?.netAmount || 0) >= 0 ? '+' : ''}
                {currency}{Number(financials?.netAmount || 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                Calculated as: Total Settlements - (Supplier Invoices + Wastage Deductions)
              </p>
            </div>
          </div>

          {/* Ledger Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger by description, vendor, or invoice #..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: 'ALL', label: 'All Transactions' },
                { id: 'SALE', label: 'Money In (Sales)' },
                { id: 'EXPENSE', label: 'Money Out (Expenses)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLedgerTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    ledgerTypeFilter === f.id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chronological Ledger Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-emerald-400" />
                <span>Chronological Financial Ledger ({filteredLedger.length} Records)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing newest to oldest activity
              </span>
            </div>

            {filteredLedger.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No financial transactions found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4">Flow Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description & Reference</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredLedger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full border ${
                              tx.type === 'SALE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {tx.type === 'SALE' ? (
                              <>
                                <ArrowUpRight className="w-3 h-3" /> Money In
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="w-3 h-3" /> Money Out
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-semibold uppercase text-[10px]">
                          {tx.category} ({tx.method})
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div>{tx.description}</div>
                          {tx.ref && <div className="text-[10px] text-slate-500 font-mono">Ref: {tx.ref}</div>}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          tx.type === 'SALE' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {tx.type === 'SALE' ? '+' : ''}{currency}{Math.abs(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
