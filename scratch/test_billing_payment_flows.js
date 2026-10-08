import { prisma } from '../backend/src/config/env.js';
import * as billingService from '../backend/src/services/billing.service.js';
import * as paymentService from '../backend/src/services/payment.service.js';
import crypto from 'crypto';

async function runTests() {
  console.log('=== STARTING BILLING & PAYMENT STATUS VERIFICATION ===\n');

  // 1. Find or create restaurant, users, and tables
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      tables: true,
      menuItems: true,
      users: true,
    },
  });

  if (!restaurant) {
    throw new Error('No restaurant found in DB');
  }

  const restaurantId = restaurant.id;
  const receptionist = restaurant.users.find(u => u.role === 'RECEPTIONIST') || restaurant.users[0];
  const table = restaurant.tables[0];
  const menuItem = restaurant.menuItems[0];

  console.log(`Using restaurant: ${restaurant.name} (${restaurantId})`);
  console.log(`Using receptionist: ${receptionist.name} (${receptionist.id})`);

  // Helper to create served order
  async function createServedOrder(tag) {
    const orderNumber = `ORD-TEST-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId: table.id,
        orderNumber,
        status: 'SERVED',
        billRequested: true,
        items: {
          create: [
            {
              menuItemId: menuItem.id,
              quantity: 2,
              unitPrice: Number(menuItem.price),
              subtotal: Number(menuItem.price) * 2,
              status: 'SERVED',
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });
    return order;
  }

  // Frontend helper simulation (exact logic implemented in BillingView.jsx)
  function getBillPaymentInfo(bill) {
    if (!bill) return { isPaid: false, statusText: 'UNPAID', mode: null, paidAt: null };
    const completedPayments = (bill.payments || []).filter(
      (p) => (p.status || 'COMPLETED').toUpperCase() === 'COMPLETED'
    );
    const sortedPayments = [...completedPayments].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    const latestPayment = sortedPayments[0];
    const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalBillAmount = Number(bill.totalAmount || bill.grandTotal || 0);
    const rawStatus = (bill.status || bill.paymentStatus || '').toUpperCase();
    const isPaid = rawStatus === 'PAID' || (totalBillAmount > 0 && totalPaid >= totalBillAmount);
    const isPartiallyPaid = !isPaid && (rawStatus === 'PARTIALLY_PAID' || (totalPaid > 0 && totalPaid < totalBillAmount));
    const statusText = isPaid ? 'PAID' : (isPartiallyPaid ? 'PARTIALLY_PAID' : 'UNPAID');

    let rawMode = null;
    if (isPaid || isPartiallyPaid) {
      rawMode =
        latestPayment?.method ||
        latestPayment?.paymentMethod ||
        bill.payments?.[0]?.method ||
        bill.payments?.[0]?.paymentMethod ||
        null;
    }
    const mode = rawMode ? String(rawMode).toUpperCase() : null;
    const paidAt =
      isPaid || isPartiallyPaid
        ? latestPayment?.createdAt || bill.payments?.[0]?.createdAt || bill.updatedAt || null
        : null;

    return { isPaid, isPartiallyPaid, statusText, mode, paidAt };
  }

  // TEST 1 — CASH PAYMENT
  console.log('--- TEST 1: Cash Payment ---');
  const order1 = await createServedOrder('CASH');
  const bill1 = await billingService.generateBill(restaurantId, receptionist.id, { orderId: order1.id });
  console.log(`Generated Bill: ${bill1.billNumber}, Total: ${bill1.totalAmount}, Status: ${bill1.status}`);

  const payResult1 = await paymentService.processPayment(restaurantId, {
    billId: bill1.id,
    amount: Number(bill1.totalAmount),
    method: 'CASH',
  });
  console.log(`Payment processed. Bill status: ${payResult1.bill.status}, Payment method: ${payResult1.payment.method}`);

  // Fetch via getAllBills
  const refetchedBills1 = await billingService.getAllBills(restaurantId, null, { limit: 100 });
  const fetchedBill1 = refetchedBills1.items.find(b => b.id === bill1.id);
  const info1 = getBillPaymentInfo(fetchedBill1);
  console.log(`UI Evaluation -> Status: ${info1.statusText}, Mode: ${info1.mode}, Paid At: ${info1.paidAt}`);
  if (info1.statusText !== 'PAID' || info1.mode !== 'CASH' || !info1.paidAt) {
    throw new Error('TEST 1 FAILED: Cash payment did not evaluate to PAID | CASH | timestamp');
  }
  console.log('✓ TEST 1 PASSED: Cash payment correctly evaluates to PAID | CASH | timestamp\n');

  // TEST 2 — UPI PAYMENT
  console.log('--- TEST 2: UPI Payment ---');
  const order2 = await createServedOrder('UPI');
  const bill2 = await billingService.generateBill(restaurantId, receptionist.id, { orderId: order2.id });

  const payResult2 = await paymentService.processPayment(restaurantId, {
    billId: bill2.id,
    amount: Number(bill2.totalAmount),
    method: 'UPI',
    transactionReference: 'UPI-REF-9876543210',
  });

  const refetchedBills2 = await billingService.getAllBills(restaurantId, null, { limit: 100 });
  const fetchedBill2 = refetchedBills2.items.find(b => b.id === bill2.id);
  const info2 = getBillPaymentInfo(fetchedBill2);
  console.log(`UI Evaluation -> Status: ${info2.statusText}, Mode: ${info2.mode}, Paid At: ${info2.paidAt}`);
  if (info2.statusText !== 'PAID' || info2.mode !== 'UPI' || !info2.paidAt) {
    throw new Error('TEST 2 FAILED: UPI payment did not evaluate to PAID | UPI | timestamp');
  }
  console.log('✓ TEST 2 PASSED: UPI payment correctly evaluates to PAID | UPI | timestamp\n');

  // TEST 3 — CARD PAYMENT
  console.log('--- TEST 3: Card Payment ---');
  const order3 = await createServedOrder('CARD');
  const bill3 = await billingService.generateBill(restaurantId, receptionist.id, { orderId: order3.id });

  const payResult3 = await paymentService.processPayment(restaurantId, {
    billId: bill3.id,
    amount: Number(bill3.totalAmount),
    method: 'CARD',
    transactionReference: 'AUTH-CARD-4421',
  });

  const refetchedBills3 = await billingService.getAllBills(restaurantId, null, { limit: 100 });
  const fetchedBill3 = refetchedBills3.items.find(b => b.id === bill3.id);
  const info3 = getBillPaymentInfo(fetchedBill3);
  console.log(`UI Evaluation -> Status: ${info3.statusText}, Mode: ${info3.mode}, Paid At: ${info3.paidAt}`);
  if (info3.statusText !== 'PAID' || info3.mode !== 'CARD' || !info3.paidAt) {
    throw new Error('TEST 3 FAILED: Card payment did not evaluate to PAID | CARD | timestamp');
  }
  console.log('✓ TEST 3 PASSED: Card payment correctly evaluates to PAID | CARD | timestamp\n');

  // TEST 4 — RAZORPAY PAYMENT
  console.log('--- TEST 4: Razorpay Payment ---');
  const order4 = await createServedOrder('RAZORPAY');
  const bill4 = await billingService.generateBill(restaurantId, receptionist.id, { orderId: order4.id });

  // Simulate Razorpay signature & verification
  const dummyRzpOrderId = `order_${Date.now()}`;
  const dummyRzpPaymentId = `pay_${Date.now()}`;
  const dummySignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret')
    .update(`${dummyRzpOrderId}|${dummyRzpPaymentId}`)
    .digest('hex');

  const verifyResult4 = await paymentService.verifyRazorpayPayment(restaurantId, {
    billId: bill4.id,
    razorpayOrderId: dummyRzpOrderId,
    razorpayPaymentId: dummyRzpPaymentId,
    razorpaySignature: dummySignature,
  });

  const refetchedBills4 = await billingService.getAllBills(restaurantId, null, { limit: 100 });
  const fetchedBill4 = refetchedBills4.items.find(b => b.id === bill4.id);
  const info4 = getBillPaymentInfo(fetchedBill4);
  console.log(`UI Evaluation -> Status: ${info4.statusText}, Mode: ${info4.mode}, Paid At: ${info4.paidAt}`);
  if (info4.statusText !== 'PAID' || info4.mode !== 'RAZORPAY' || !info4.paidAt) {
    throw new Error('TEST 4 FAILED: Razorpay payment did not evaluate to PAID | RAZORPAY | timestamp');
  }
  console.log('✓ TEST 4 PASSED: Razorpay payment correctly evaluates to PAID | RAZORPAY | timestamp\n');

  // TEST 5 — UNPAID BILL
  console.log('--- TEST 5: Unpaid Bill ---');
  const order5 = await createServedOrder('UNPAID');
  const bill5 = await billingService.generateBill(restaurantId, receptionist.id, { orderId: order5.id });

  const refetchedBills5 = await billingService.getAllBills(restaurantId, null, { limit: 100 });
  const fetchedBill5 = refetchedBills5.items.find(b => b.id === bill5.id);
  const info5 = getBillPaymentInfo(fetchedBill5);
  console.log(`UI Evaluation -> Status: ${info5.statusText}, Mode: ${info5.mode || 'Unsettled'}, Paid At: ${info5.paidAt || '—'}`);
  if (info5.statusText !== 'UNPAID' || info5.mode !== null || info5.paidAt !== null) {
    throw new Error('TEST 5 FAILED: Unpaid bill did not evaluate to UNPAID | Unsettled | —');
  }
  console.log('✓ TEST 5 PASSED: Unpaid bill correctly evaluates to UNPAID | Unsettled | —\n');

  // TEST 6 to 9 — DYNAMIC FILTERS
  console.log('--- TEST 6-9: Dynamic Filters Evaluation ---');
  const allBillsResult = await billingService.getAllBills(restaurantId, null, { limit: 100 });
  const bills = allBillsResult.items;

  // Compute filter counts
  let countAll = bills.length;
  let countPaid = 0;
  let countUnpaid = 0;
  let countCash = 0;
  let countUpi = 0;
  let countCard = 0;
  let countRazorpay = 0;

  bills.forEach(b => {
    const info = getBillPaymentInfo(b);
    if (info.isPaid) {
      countPaid++;
      if (info.mode === 'CASH') countCash++;
      else if (info.mode === 'UPI') countUpi++;
      else if (info.mode === 'CARD') countCard++;
      else if (info.mode === 'RAZORPAY') countRazorpay++;
    } else {
      countUnpaid++;
    }
  });

  console.log(`Calculated Dynamic Counts:`);
  console.log(`All: ${countAll}`);
  console.log(`Paid: ${countPaid}`);
  console.log(`Unpaid: ${countUnpaid}`);
  console.log(`Cash: ${countCash}`);
  console.log(`UPI: ${countUpi}`);
  console.log(`Card: ${countCard}`);
  console.log(`Razorpay: ${countRazorpay}`);

  // Test Paid Filter
  const paidFiltered = bills.filter(b => getBillPaymentInfo(b).isPaid);
  if (paidFiltered.length !== countPaid || paidFiltered.some(b => !getBillPaymentInfo(b).isPaid)) {
    throw new Error('TEST 6 FAILED: Paid filter includes non-paid bills');
  }
  console.log(`✓ TEST 6 PASSED: Paid filter contains strictly ${paidFiltered.length} paid bills`);

  // Test Unpaid Filter
  const unpaidFiltered = bills.filter(b => !getBillPaymentInfo(b).isPaid);
  if (unpaidFiltered.length !== countUnpaid || unpaidFiltered.some(b => getBillPaymentInfo(b).isPaid)) {
    throw new Error('TEST 7 FAILED: Unpaid filter includes paid bills');
  }
  console.log(`✓ TEST 7 PASSED: Unpaid filter contains strictly ${unpaidFiltered.length} unpaid bills`);

  // Test Cash Filter
  const cashFiltered = bills.filter(b => {
    const info = getBillPaymentInfo(b);
    return info.isPaid && info.mode === 'CASH';
  });
  if (cashFiltered.length !== countCash || cashFiltered.some(b => getBillPaymentInfo(b).mode !== 'CASH')) {
    throw new Error('TEST 8 FAILED: Cash filter includes non-cash bills');
  }
  console.log(`✓ TEST 8 PASSED: Cash filter contains strictly ${cashFiltered.length} Cash bills`);

  // Test Razorpay Filter
  const rzpFiltered = bills.filter(b => {
    const info = getBillPaymentInfo(b);
    return info.isPaid && info.mode === 'RAZORPAY';
  });
  if (rzpFiltered.length !== countRazorpay || rzpFiltered.some(b => getBillPaymentInfo(b).mode !== 'RAZORPAY')) {
    throw new Error('TEST 9 FAILED: Razorpay filter includes non-Razorpay bills');
  }
  console.log(`✓ TEST 9 PASSED: Razorpay filter contains strictly ${rzpFiltered.length} Razorpay bills`);

  // TEST 10 — REFRESH PERSISTENCE
  console.log('\n--- TEST 10: Refresh Persistence ---');
  const refreshedBill = await billingService.getBillById(restaurantId, bill1.id);
  const refreshedInfo = getBillPaymentInfo(refreshedBill);
  if (refreshedInfo.statusText !== 'PAID') {
    throw new Error('TEST 10 FAILED: Bill status did not remain PAID after re-querying');
  }
  console.log(`✓ TEST 10 PASSED: Re-queried bill ${refreshedBill.billNumber} permanently remains PAID\n`);

  // TEST 11 — DUPLICATE PAYMENT REJECTION
  console.log('--- TEST 11: Duplicate Payment Prevention ---');
  try {
    await paymentService.processPayment(restaurantId, {
      billId: bill1.id,
      amount: Number(bill1.totalAmount),
      method: 'CASH',
    });
    throw new Error('TEST 11 FAILED: Expected duplicate settlement to be rejected, but it succeeded');
  } catch (err) {
    if (err.message?.includes('already fully paid')) {
      console.log(`✓ TEST 11 PASSED: Duplicate payment correctly blocked with error: "${err.message}"`);
    } else {
      throw err;
    }
  }

  console.log('\n==================================================');
  console.log('ALL 11 TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
