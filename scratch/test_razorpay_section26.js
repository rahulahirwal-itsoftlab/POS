import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma, env } from '../backend/src/config/env.js';

const API_BASE = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (err) {}
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let total = 0;

function assert(condition, testName, details) {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    if (details) console.error('   Details:', details);
    throw new Error(`Test failed: ${testName}`);
  }
  passed++;
  console.log(`✅ PASSED: ${testName}`);
}

async function run() {
  console.log('\n===============================================================');
  console.log(' APEXPOS SECTION 26 RAZORPAY TEST MATRIX (TESTS 1 - 9)');
  console.log('===============================================================\n');

  const testPassword = await bcrypt.hash('Password123', 10);

  // Setup Restaurant
  let restaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: { name: 'ApexPOS Flagship', currency: 'INR', taxRate: 5.0, isActive: true },
    });
  }

  // Setup Receptionist
  let receptionist = await prisma.user.findFirst({ where: { email: 'receptionist.test@pos.com' } });
  if (!receptionist) {
    receptionist = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Rita Receptionist',
        email: 'receptionist.test@pos.com',
        password: testPassword,
        role: 'RECEPTIONIST',
        isActive: true,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: receptionist.id },
      data: { password: testPassword, isActive: true, role: 'RECEPTIONIST', restaurantId: restaurant.id },
    });
  }

  // Setup Waiter
  let waiter = await prisma.user.findFirst({ where: { email: 'waiter.test@pos.com' } });
  if (!waiter) {
    waiter = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Sam Waiter',
        email: 'waiter.test@pos.com',
        password: testPassword,
        role: 'WAITER',
        isActive: true,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: waiter.id },
      data: { password: testPassword, isActive: true, role: 'WAITER', restaurantId: restaurant.id },
    });
  }

  // Login Receptionist
  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'receptionist.test@pos.com', password: 'Password123' },
  });
  assert(loginRes.ok && loginRes.data?.data?.token, 'Receptionist login successful');
  const token = loginRes.data.data.token;

  // Clean and prepare test tables
  const tableNumbers = ['T-201', 'T-202', 'T-203', 'T-204', 'T-205', 'T-206', 'T-207', 'T-208', 'T-209'];
  const tables = {};
  for (const tNum of tableNumbers) {
    let t = await prisma.table.upsert({
      where: { restaurantId_tableNumber: { restaurantId: restaurant.id, tableNumber: tNum } },
      update: { status: 'AVAILABLE' },
      create: { restaurantId: restaurant.id, tableNumber: tNum, capacity: 4, status: 'AVAILABLE' },
    });
    // Cancel any prior active orders on this table
    await prisma.order.updateMany({
      where: { tableId: t.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      data: { status: 'CANCELLED' },
    });
    await prisma.table.update({ where: { id: t.id }, data: { status: 'AVAILABLE' } });
    tables[tNum] = t;
  }

  // Helper to create served order and bill with exact total amount
  const createBillWithExactTotal = async (table, exactTotal) => {
    await prisma.table.update({ where: { id: table.id }, data: { status: 'OCCUPIED' } });
    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        waiterId: waiter.id,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'SERVED',
        billRequested: true,
        customerName: 'Test Customer',
      },
    });

    const subtotal = Math.round((exactTotal / 1.05) * 100) / 100;
    const taxAmount = exactTotal - subtotal;
    const bill = await prisma.bill.create({
      data: {
        restaurantId: restaurant.id,
        orderId: order.id,
        receptionistId: receptionist.id,
        billNumber: `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        subtotal,
        taxRate: 5.0,
        taxAmount,
        discountAmount: 0,
        totalAmount: exactTotal,
        status: 'UNPAID',
      },
      include: { order: { include: { table: true } } },
    });

    return { order, bill };
  };

  // -------------------------------------------------------------------------
  // TEST 1: ₹105 bill → Razorpay Checkout order → verify → bill PAID
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 1: ₹105 Bill Razorpay Dynamic Order & Verification ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-201'], 105);
    const orderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });
    assert(orderRes.ok, 'TEST 1: Razorpay order created for ₹105 bill');
    assert(orderRes.data.data.amount === 10500, 'TEST 1: Amount converted dynamically to 10500 paise');
    assert(orderRes.data.data.orderId.startsWith('order_'), 'TEST 1: Real order ID received');

    const fakePaymentId = `pay_t1_${Date.now()}`;
    const sig = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderRes.data.data.orderId}|${fakePaymentId}`)
      .digest('hex');

    const verifyRes = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        razorpayOrderId: orderRes.data.data.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: sig,
      },
    });

    assert(verifyRes.ok, 'TEST 1: Signature verified successfully');
    assert(verifyRes.data.data.bill.status === 'PAID', 'TEST 1: Bill status is PAID');
    const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert(dbOrder.status === 'COMPLETED', 'TEST 1: Order is COMPLETED');
    const dbTable = await prisma.table.findUnique({ where: { id: tables['T-201'].id } });
    assert(dbTable.status === 'AVAILABLE', 'TEST 1: Table released to AVAILABLE');
  }

  // -------------------------------------------------------------------------
  // TEST 2: ₹500 bill → Razorpay dynamic order (50000 paise) → verification
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: ₹500 Bill Dynamic Razorpay Order & Settlement ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-202'], 500);
    const orderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });
    assert(orderRes.ok, 'TEST 2: Razorpay order created for ₹500 bill');
    assert(orderRes.data.data.amount === 50000, 'TEST 2: Amount converted dynamically to 50000 paise');

    const fakePaymentId = `pay_t2_${Date.now()}`;
    const sig = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderRes.data.data.orderId}|${fakePaymentId}`)
      .digest('hex');

    const verifyRes = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        razorpayOrderId: orderRes.data.data.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: sig,
      },
    });

    assert(verifyRes.ok, 'TEST 2: Signature verified & settled');
    assert(verifyRes.data.data.bill.status === 'PAID', 'TEST 2: Bill marked PAID');
    const dbTable = await prisma.table.findUnique({ where: { id: tables['T-202'].id } });
    assert(dbTable.status === 'AVAILABLE', 'TEST 2: Table released to AVAILABLE');
  }

  // -------------------------------------------------------------------------
  // TEST 3: Razorpay payment cancelled / unverified → bill remains unpaid
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Payment Cancelled / Unverified (Modal Dismissed) ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-203'], 250);
    const orderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });
    assert(orderRes.ok, 'TEST 3: Order created');
    // User cancels / modal closes without calling /verify
    const checkBill = await prisma.bill.findUnique({ where: { id: bill.id } });
    assert(checkBill.status === 'UNPAID', 'TEST 3: Bill remains UNPAID');
    const checkOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert(checkOrder.status === 'SERVED', 'TEST 3: Order remains SERVED (not completed)');
    const checkTable = await prisma.table.findUnique({ where: { id: tables['T-203'].id } });
    assert(checkTable.status === 'OCCUPIED', 'TEST 3: Table remains OCCUPIED');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Invalid signature → payment rejected
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Invalid Signature Security Rejection ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-204'], 350);
    const orderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });
    assert(orderRes.ok, 'TEST 4: Order created');

    const invalidSig = 'forged_fake_signature_abc1234567890';
    const verifyRes = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        razorpayOrderId: orderRes.data.data.orderId,
        razorpayPaymentId: 'pay_invalid_123',
        razorpaySignature: invalidSig,
      },
    });

    assert(!verifyRes.ok && verifyRes.status === 400, 'TEST 4: Invalid signature rejected with status 400');
    const checkBill = await prisma.bill.findUnique({ where: { id: bill.id } });
    assert(checkBill.status === 'UNPAID', 'TEST 4: Bill remains UNPAID');
  }

  // -------------------------------------------------------------------------
  // TEST 5: Duplicate verification → no duplicate payment
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Duplicate Verification / Idempotency ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-205'], 420);
    const orderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });

    const fakePaymentId = `pay_t5_${Date.now()}`;
    const sig = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderRes.data.data.orderId}|${fakePaymentId}`)
      .digest('hex');

    const firstVerify = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        razorpayOrderId: orderRes.data.data.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: sig,
      },
    });
    assert(firstVerify.ok, 'TEST 5: First verification succeeded');

    const secondVerify = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        razorpayOrderId: orderRes.data.data.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: sig,
      },
    });
    assert(secondVerify.ok, 'TEST 5: Duplicate verification returns 200 idempotent response');
    assert(secondVerify.data.data.alreadyProcessed === true, 'TEST 5: Flagged as alreadyProcessed');

    const paymentsCount = await prisma.payment.count({
      where: { billId: bill.id, status: 'COMPLETED' },
    });
    assert(paymentsCount === 1, 'TEST 5: Exactly one payment record exists in DB (no duplicates)');
  }

  // -------------------------------------------------------------------------
  // TEST 6: Already paid bill → payment blocked
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Already Paid Bill Rejection ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-206'], 180);
    // Mark bill paid
    await prisma.bill.update({ where: { id: bill.id }, data: { status: 'PAID' } });

    const orderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });
    assert(!orderRes.ok && orderRes.status === 400, 'TEST 6: Blocked creating Razorpay order for already paid bill');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Cash payment → existing workflow still works
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Manual Cash Payment Workflow Intact ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-207'], 150);
    const payRes = await apiRequest('/payments', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        method: 'CASH',
        amount: 150,
        notes: 'Manual Cash flow test',
      },
    });
    assert(payRes.ok, 'TEST 7: Manual Cash payment accepted');
    assert(payRes.data.data.bill.status === 'PAID', 'TEST 7: Bill marked PAID');
    const dbTable = await prisma.table.findUnique({ where: { id: tables['T-207'].id } });
    assert(dbTable.status === 'AVAILABLE', 'TEST 7: Table released to AVAILABLE');
  }

  // -------------------------------------------------------------------------
  // TEST 8: Card payment → existing workflow still works
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Manual Card Payment Workflow Intact ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-208'], 220);
    const payRes = await apiRequest('/payments', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        method: 'CARD',
        amount: 220,
        notes: 'Card Auth 998877',
      },
    });
    assert(payRes.ok, 'TEST 8: Manual Card payment accepted');
    assert(payRes.data.data.bill.status === 'PAID', 'TEST 8: Bill marked PAID');
    const dbTable = await prisma.table.findUnique({ where: { id: tables['T-208'].id } });
    assert(dbTable.status === 'AVAILABLE', 'TEST 8: Table released to AVAILABLE');
  }

  // -------------------------------------------------------------------------
  // TEST 9: Manual UPI → existing workflow still works
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Manual UPI Payment Workflow Intact ---');
  {
    const { order, bill } = await createBillWithExactTotal(tables['T-209'], 310);
    const payRes = await apiRequest('/payments', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        method: 'UPI',
        amount: 310,
        transactionReference: 'UPI-REF-TEST-12345',
        notes: 'Manual UPI flow test',
      },
    });
    assert(payRes.ok, 'TEST 9: Manual UPI payment accepted');
    assert(payRes.data.data.bill.status === 'PAID', 'TEST 9: Bill marked PAID');
    assert(payRes.data.data.payment.method === 'UPI', 'TEST 9: Payment method recorded as UPI');
    const dbTable = await prisma.table.findUnique({ where: { id: tables['T-209'].id } });
    assert(dbTable.status === 'AVAILABLE', 'TEST 9: Table released to AVAILABLE');
  }

  console.log('\n===============================================================');
  console.log(` ALL 9 SECTION 26 TESTS COMPLETED: ${passed} / ${total} PASSED (100%)`);
  console.log('===============================================================\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ Unhandled error in Section 26 test suite:', err);
  process.exit(1);
});
