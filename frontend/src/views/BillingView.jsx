import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';
import {
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Printer,
  Search,
  DollarSign,
  AlertTriangle,
  Eye,
  X,
  User,
  Clock,
  Calendar,
  Utensils
} from 'lucide-react';

export default function BillingView({ preSelectedTable }) {
  const { restaurant, addToast } = useAuth();
  const [activeTab, setActiveTab] = useState('bills'); // 'pending' | 'bills' | 'payments'
  const [pendingOrders, setPendingOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL'); // 'ALL' | 'CASH' | 'UPI' | 'CARD'
  const [billSearch, setBillSearch] = useState('');

  // Bill Generation Modal State
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(restaurant?.taxRate || 5);
  const [billNotes, setBillNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // Payment Settlement Modal State
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [settling, setSettling] = useState(false);

  // Receipt Modal State
  const [receiptBill, setReceiptBill] = useState(null);

  // Ordered Items Inspector Modal State
  const [selectedBillForItems, setSelectedBillForItems] = useState(null);

  const currency = restaurant?.currency || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordRes, billRes, payRes] = await Promise.all([
        posService.billing.getPendingOrders(),
        posService.billing.getBills(),
        posService.payments.getAll(),
      ]);
      if (ordRes.success) setPendingOrders(ordRes.data || []);
      if (billRes.success) setBills(billRes.data || []);
      if (payRes.success) setPayments(payRes.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load billing records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openGenerateModal = (order) => {
    setSelectedOrderForBill(order);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setTaxRate(restaurant?.taxRate || 5);
    setBillNotes('');
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!selectedOrderForBill) return;

    setGenerating(true);
    try {
      const payload = {
        orderId: selectedOrderForBill.id,
        discountPercent: Number(discountPercent) || 0,
        discountAmount: Number(discountAmount) || 0,
        taxRate: Number(taxRate) || 0,
        notes: billNotes.trim() || undefined,
      };

      const res = await posService.billing.generateBill(payload);
      if (res.success) {
        addToast('Invoice / Bill generated successfully!', 'success');
        setSelectedOrderForBill(null);
        loadData();
        if (res.data) {
          openPaymentModal(res.data);
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to generate bill. Order must be COMPLETED first.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBillForPayment(bill);
    setPaymentMethod('CASH');
    setAmountPaid(Number(bill.totalAmount || bill.grandTotal || 0));
    setPaymentNotes('');
  };

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!selectedBillForPayment) return;

    setSettling(true);
    try {
      const payload = {
        billId: selectedBillForPayment.id,
        paymentMethod,
        amountPaid: Number(amountPaid),
        notes: paymentNotes.trim() || undefined,
      };

      const res = await posService.payments.processPayment(payload);
      if (res.success) {
        addToast('Payment settled! Table released to AVAILABLE.', 'success');
        setReceiptBill(selectedBillForPayment);
        setSelectedBillForPayment(null);
        loadData();
      }
    } catch (err) {
      addToast(err.message || 'Payment settlement failed', 'error');
    } finally {
      setSettling(false);
    }
  };

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchSearch =
      (b.billNumber && b.billNumber.toLowerCase().includes(billSearch.toLowerCase())) ||
      (b.receptionist?.name && b.receptionist.name.toLowerCase().includes(billSearch.toLowerCase())) ||
      (b.order?.table?.tableNumber && b.order.table.tableNumber.toLowerCase().includes(billSearch.toLowerCase()));

    const billPayment = b.payments?.[0];
    const mode = billPayment?.paymentMethod || billPayment?.method;
    const matchMode =
      paymentModeFilter === 'ALL' ||
      (paymentModeFilter === 'CASH' && mode === 'CASH') ||
      (paymentModeFilter === 'UPI' && mode === 'UPI') ||
      (paymentModeFilter === 'CARD' && mode === 'CARD') ||
      (paymentModeFilter === 'UNPAID' && b.paymentStatus !== 'PAID');

    return matchSearch && matchMode;
  });

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (paymentModeFilter === 'ALL') return true;
    return (p.paymentMethod || p.method) === paymentModeFilter;
  });

  const getMethodBadge = (mode) => {
    switch (mode) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Banknote className="w-3 h-3" />
            <span>Cash</span>
          </span>
        );
      case 'UPI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Smartphone className="w-3 h-3" />
            <span>UPI / QR</span>
          </span>
        );
      case 'CARD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <CreditCard className="w-3 h-3" />
            <span>Card</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            {mode || '—'}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <span>Billing & Payments Center</span>
          </h1>
          <p className="text-sm text-slate-400">
            Inspect all bills generated by receptionists, review ordered items, verify payment statuses, and track Cash/UPI/Card transactions
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'bills'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Generated Invoices ({bills.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Unbilled Orders ({pendingOrders.length})
        </button>
      </div>

      {/* TAB 1: GENERATED BILLS BY RECEPTIONIST */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Bill #, Receptionist, Table..."
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'CASH', 'UPI', 'CARD', 'UNPAID'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentModeFilter(mode)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    paymentModeFilter === mode
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {mode === 'ALL' ? 'All Modes' : mode}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredBills.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Invoices Found</h3>
                <p className="text-xs text-slate-500 mt-1">Generated bills will be listed here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Bill Number</th>
                      <th className="px-5 py-3.5">Generated By</th>
                      <th className="px-5 py-3.5">Table</th>
                      <th className="px-5 py-3.5">Subtotal</th>
                      <th className="px-5 py-3.5">Grand Total</th>
                      <th className="px-5 py-3.5">Payment Status</th>
                      <th className="px-5 py-3.5">Payment Mode</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredBills.map((bill) => {
                      const isPaid = bill.paymentStatus === 'PAID';
                      const payment = bill.payments?.[0];
                      const mode = payment?.paymentMethod || payment?.method;
                      const orderItems = bill.order?.items || [];

                      return (
                        <tr key={bill.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-white">
                            {bill.billNumber || `INV-${bill.id.slice(0, 8)}`}
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            <span className="font-semibold text-slate-200">
                              {bill.receptionist?.name || 'Reception Staff'}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-300">
                            Table #{bill.order?.table?.tableNumber || bill.tableNumber || 'N/A'}
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono">
                            {currency}{Number(bill.subtotal || 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-400 font-mono text-sm">
                            {currency}{Number(bill.totalAmount || bill.grandTotal || 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                isPaid
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {bill.paymentStatus || 'UNPAID'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {isPaid ? getMethodBadge(mode) : <span className="text-[10px] text-slate-500">Unsettled</span>}
                          </td>
                          <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedBillForItems(bill)}
                              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Inspect Ordered Items"
                            >
                              <Eye className="w-3 h-3 text-emerald-400" />
                              <span>View Items</span>
                            </button>

                            <button
                              onClick={() => setReceiptBill(bill)}
                              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Print Receipt"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>

                            {!isPaid && (
                              <button
                                onClick={() => openPaymentModal(bill)}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors shadow-sm cursor-pointer"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Settle</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT TRANSACTIONS (CASH, UPI, CARD) */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Payment Mode Filter */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white">Filter by Payment Mode:</span>
            </div>

            <div className="flex items-center gap-1.5">
              {['ALL', 'CASH', 'UPI', 'CARD'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentModeFilter(mode)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    paymentModeFilter === mode
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {mode === 'ALL' ? 'All Transactions' : mode}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Banknote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Payments Recorded Yet</h3>
                <p className="text-xs text-slate-500 mt-1">Payment transactions will appear here as bills are settled.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Payment ID</th>
                      <th className="px-5 py-3.5">Bill / Ref</th>
                      <th className="px-5 py-3.5">Payment Mode</th>
                      <th className="px-5 py-3.5">Amount Paid</th>
                      <th className="px-5 py-3.5">Settled At</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPayments.map((p) => {
                      const mode = p.paymentMethod || p.method || 'CASH';
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-4 font-mono text-slate-400">
                            #{p.id.slice(0, 8)}
                          </td>
                          <td className="px-5 py-4 font-semibold text-white">
                            {p.bill?.billNumber || `Bill #${p.billId?.slice(0, 6)}`}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-300">
                            {getMethodBadge(mode)}
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-400 font-mono text-sm">
                            {currency}{Number(p.amountPaid || p.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono">
                            {new Date(p.createdAt || Date.now()).toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {p.status || 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: UNBILLED ORDERS */}
      {activeTab === 'pending' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {pendingOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400/80 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Pending Orders to Bill</h3>
              <p className="text-xs text-slate-500 mt-1">
                Completed orders will automatically appear here ready for invoice creation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Table / Ticket</th>
                    <th className="px-5 py-3.5">Items Ordered</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Elapsed</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">
                          Table #{ord.table?.tableNumber || ord.tableNumber || 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          #{ord.orderNumber || ord.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          {ord.items?.map((it, idx) => (
                            <div key={idx} className="text-slate-300">
                              {it.quantity}x {it.menuItem?.name || it.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openGenerateModal(ord)}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Generate Bill</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ORDERED ITEMS INSPECTOR MODAL */}
      {selectedBillForItems && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <span>Invoice #{selectedBillForItems.billNumber || selectedBillForItems.id.slice(0, 8)}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generated by: <span className="text-white font-semibold">{selectedBillForItems.receptionist?.name || 'Receptionist'}</span> on {new Date(selectedBillForItems.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedBillForItems(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
              {/* Meta details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Table</span>
                  <span className="font-bold text-white">
                    Table #{selectedBillForItems.order?.table?.tableNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Payment Status</span>
                  <span className={`font-bold ${selectedBillForItems.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedBillForItems.paymentStatus || 'UNPAID'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Payment Mode</span>
                  <span className="font-bold text-white">
                    {selectedBillForItems.payments?.[0]?.paymentMethod || selectedBillForItems.payments?.[0]?.method || 'Not Settled'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Order ID</span>
                  <span className="font-mono text-slate-300">
                    #{selectedBillForItems.orderId?.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Ordered Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ordered Items in Bill</span>
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-2.5">Item Name</th>
                        <th className="px-3.5 py-2.5 text-center">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Price</th>
                        <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(selectedBillForItems.order?.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="px-3.5 py-2.5 font-semibold text-white">
                            {it.menuItem?.name || it.name || 'Dish Item'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-300">
                            {it.quantity}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-slate-400">
                            {currency}{Number(it.unitPrice || it.price || 0).toFixed(2)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-white">
                            {currency}{Number(it.subtotal || it.quantity * (it.unitPrice || it.price || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill Totals Summary */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">
                    {currency}{Number(selectedBillForItems.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({selectedBillForItems.taxRate || 5}%):</span>
                  <span className="font-mono text-slate-200">
                    {currency}{Number(selectedBillForItems.taxAmount || 0).toFixed(2)}
                  </span>
                </div>
                {Number(selectedBillForItems.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount:</span>
                    <span className="font-mono">
                      -{currency}{Number(selectedBillForItems.discountAmount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                  <span className="text-white">Total Bill Amount:</span>
                  <span className="text-emerald-400 font-mono">
                    {currency}{Number(selectedBillForItems.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedBillForItems(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATE BILL MODAL */}
      {selectedOrderForBill && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Generate Tax Invoice</h3>
            <p className="text-xs text-slate-400 mb-5">
              Order #{selectedOrderForBill.id.slice(0, 8)} (Table #{selectedOrderForBill.table?.tableNumber || 'N/A'})
            </p>

            <form onSubmit={handleGenerateBill} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fixed Disc ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate discount applied"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForBill(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  {generating ? 'Generating...' : 'Confirm & Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT SETTLEMENT MODAL */}
      {selectedBillForPayment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Settle Bill Payment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Invoice #{selectedBillForPayment.billNumber || selectedBillForPayment.id.slice(0, 8)}
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 text-center">
              <span className="text-xs text-slate-400">Total Payable Amount</span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                {currency}{Number(selectedBillForPayment.totalAmount || selectedBillForPayment.grandTotal || 0).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = paymentMethod === mode.id;
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => setPaymentMethod(mode.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount Received ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transaction Reference / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref #12345 or Auth Code"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBillForPayment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  {settling ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {receiptBill && (
        <ReceiptModal bill={receiptBill} onClose={() => setReceiptBill(null)} />
      )}
    </div>
  );
}
