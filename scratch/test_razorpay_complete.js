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
  } catch (err) {
    // raw text or empty
  }
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
  console.log(' APEXPOS RAZORPAY INTEGRATION COMPREHENSIVE TEST SUITE');
  console.log('===============================================================\n');

  // Step 0: Setup / Retrieve test entities
  const testPassword = await bcrypt.hash('Password123', 10);

  // Restaurant 1
  let restaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: { name: 'ApexPOS Flagship', currency: 'INR', taxRate: 5.0, isActive: true },
    });
  }

  // Restaurant 2 (for multi-tenant isolation)
  let restaurantB = await prisma.restaurant.findFirst({ where: { name: 'Bistro Isolation Test' } });
  if (!restaurantB) {
    restaurantB = await prisma.restaurant.create({
      data: { name: 'Bistro Isolation Test', currency: 'INR', taxRate: 5.0, isActive: true },
    });
  }

  // Receptionist user
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

  // Waiter user
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

  // Receptionist B for Restaurant B
  let receptionistB = await prisma.user.findFirst({ where: { email: 'receptionist.b@pos.com' } });
  if (!receptionistB) {
    receptionistB = await prisma.user.create({
      data: {
        restaurantId: restaurantB.id,
        name: 'Bob Receptionist B',
        email: 'receptionist.b@pos.com',
        password: testPassword,
        role: 'RECEPTIONIST',
        isActive: true,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: receptionistB.id },
      data: { password: testPassword, isActive: true, role: 'RECEPTIONIST', restaurantId: restaurantB.id },
    });
  }

  // Logins
  const loginRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'receptionist.test@pos.com', password: 'Password123' },
  });
  assert(loginRes.ok && loginRes.data?.data?.token, 'Receptionist 1 login successful');
  const token = loginRes.data.data.token;

  const loginBRes = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: 'receptionist.b@pos.com', password: 'Password123' },
  });
  assert(loginBRes.ok && loginBRes.data?.data?.token, 'Receptionist B login successful');
  const tokenB = loginBRes.data.data.token;

  // Tables
  let table1 = await prisma.table.upsert({
    where: { restaurantId_tableNumber: { restaurantId: restaurant.id, tableNumber: 'T-101' } },
    update: { status: 'AVAILABLE' },
    create: { restaurantId: restaurant.id, tableNumber: 'T-101', capacity: 4, status: 'AVAILABLE' },
  });
  let table2 = await prisma.table.upsert({
    where: { restaurantId_tableNumber: { restaurantId: restaurant.id, tableNumber: 'T-102' } },
    update: { status: 'AVAILABLE' },
    create: { restaurantId: restaurant.id, tableNumber: 'T-102', capacity: 4, status: 'AVAILABLE' },
  });

  // Helper to create served order and bill
  const createServedOrderAndBill = async (table, itemsSubtotal = 1240) => {
    // Update table OCCUPIED
    await prisma.table.update({ where: { id: table.id }, data: { status: 'OCCUPIED' } });
    
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        waiterId: waiter.id,
        orderNumber,
        status: 'SERVED',
        billRequested: true,
      },
    });

    const taxAmount = (itemsSubtotal * 0.05);
    const totalAmount = itemsSubtotal + taxAmount;
    const billNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bill = await prisma.bill.create({
      data: {
        restaurantId: restaurant.id,
        orderId: order.id,
        receptionistId: receptionist.id,
        billNumber,
        subtotal: itemsSubtotal,
        taxRate: 5.0,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        status: 'UNPAID',
      },
      include: { order: { include: { table: true } } },
    });

    return { order, bill };
  };

  // =========================================================================
  // TEST 1 — EXISTING FLOW (MANUAL CASH PAYMENT)
  // =========================================================================
  console.log('\n--- Running TEST 1: Existing Manual Cash Payment Flow ---');
  {
    const { order, bill } = await createServedOrderAndBill(table1, 500);

    const payRes = await apiRequest('/payments', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        method: 'CASH',
        amount: Number(bill.totalAmount),
        notes: 'Cash payment from test 1',
      },
    });

    assert(payRes.ok, 'TEST 1: Manual Cash payment accepted', payRes.data);
    assert(payRes.data.data.bill.status === 'PAID', 'TEST 1: Bill marked as PAID');
    assert(payRes.data.data.isFullyPaid === true, 'TEST 1: Payment marked fully paid');

    // Verify DB states: Order COMPLETED, Table AVAILABLE
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert(updatedOrder.status === 'COMPLETED', 'TEST 1: Order marked COMPLETED in database');

    const updatedTable = await prisma.table.findUnique({ where: { id: table1.id } });
    assert(updatedTable.status === 'AVAILABLE', 'TEST 1: Table released to AVAILABLE');
  }

  // =========================================================================
  // TEST 2 & TEST 7 — RAZORPAY ORDER CREATION & AMOUNT VALIDATION
  // =========================================================================
  console.log('\n--- Running TEST 2 & TEST 7: Razorpay Order Creation & Amount in Paise ---');
  let test2Bill;
  let test2Order;
  let rzpOrderData;
  {
    // Amount is 1,240 subtotal + 5% tax (62) = 1,302
    const { order, bill } = await createServedOrderAndBill(table1, 1240);
    test2Bill = bill;
    test2Order = order;

    const rzpOrderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });

    assert(rzpOrderRes.ok, 'TEST 2: Razorpay order creation endpoint succeeded', rzpOrderRes.data);
    rzpOrderData = rzpOrderRes.data.data;

    assert(rzpOrderData.orderId && rzpOrderData.orderId.startsWith('order_'), 'TEST 2: Valid Razorpay order ID received from Razorpay API');
    
    // TEST 7: Check amount conversion to paise
    const expectedPaise = Math.round(Number(bill.totalAmount) * 100);
    assert(rzpOrderData.amount === expectedPaise, `TEST 7: Correct amount in paise: ${rzpOrderData.amount} === ${expectedPaise}`);
    assert(rzpOrderData.currency === 'INR', 'TEST 2: Currency is INR');
    assert(rzpOrderData.keyId === env.RAZORPAY_KEY_ID, 'TEST 2: Public Key ID returned matches env');
    assert(rzpOrderData.billId === bill.id, 'TEST 2: Bill ID matches');

    // Bill must still be UNPAID and Table OCCUPIED
    const checkBill = await prisma.bill.findUnique({ where: { id: bill.id } });
    assert(checkBill.status === 'UNPAID', 'TEST 2: Bill remains UNPAID after order creation');
    const checkTable = await prisma.table.findUnique({ where: { id: table1.id } });
    assert(checkTable.status === 'OCCUPIED', 'TEST 2: Table remains OCCUPIED');
  }

  // =========================================================================
  // TEST 3 — RAZORPAY SUCCESS VERIFICATION & SETTLEMENT
  // =========================================================================
  console.log('\n--- Running TEST 3: Razorpay Success Signature Verification & Settlement ---');
  {
    // Simulate Razorpay checkout response
    const fakePaymentId = `pay_test_${Date.now()}`;
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderData.orderId}|${fakePaymentId}`)
      .digest('hex');

    const verifyRes = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: test2Bill.id,
        razorpayOrderId: rzpOrderData.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: generatedSignature,
      },
    });

    assert(verifyRes.ok, 'TEST 3: Signature verification & settlement succeeded', verifyRes.data);
    assert(verifyRes.data.data.bill.status === 'PAID', 'TEST 3: Bill marked PAID');
    assert(verifyRes.data.data.payment.method === 'RAZORPAY', 'TEST 3: Payment method recorded as RAZORPAY');
    assert(verifyRes.data.data.payment.provider === 'RAZORPAY', 'TEST 3: Payment provider recorded as RAZORPAY');
    assert(verifyRes.data.data.payment.razorpayPaymentId === fakePaymentId, 'TEST 3: Razorpay payment ID recorded');

    // DB state checks:
    const updatedOrder = await prisma.order.findUnique({ where: { id: test2Order.id } });
    assert(updatedOrder.status === 'COMPLETED', 'TEST 3: Order COMPLETED');

    const updatedTable = await prisma.table.findUnique({ where: { id: table1.id } });
    assert(updatedTable.status === 'AVAILABLE', 'TEST 3: Table released to AVAILABLE');

    // =========================================================================
    // TEST 5 — DUPLICATE PAYMENT / IDEMPOTENCY
    // =========================================================================
    console.log('\n--- Running TEST 5: Duplicate Payment / Idempotency Check ---');
    const duplicateRes = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: test2Bill.id,
        razorpayOrderId: rzpOrderData.orderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: generatedSignature,
      },
    });

    assert(duplicateRes.ok, 'TEST 5: Duplicate verification returns 200 safe response');
    assert(duplicateRes.data.data.alreadyProcessed === true, 'TEST 5: Safely identified as alreadyProcessed');

    const paymentsCount = await prisma.payment.count({
      where: { billId: test2Bill.id, status: 'COMPLETED' },
    });
    assert(paymentsCount === 1, 'TEST 5: Exactly one payment record exists for the bill (no double charge)');
  }

  // =========================================================================
  // TEST 4 — INVALID SIGNATURE REJECTION
  // =========================================================================
  console.log('\n--- Running TEST 4: Invalid Razorpay Signature Rejection ---');
  {
    const { order, bill } = await createServedOrderAndBill(table1, 800);

    const rzpOrderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill.id },
    });
    assert(rzpOrderRes.ok, 'Created Razorpay order for invalid signature test');

    const forgedSignature = 'bad_forged_signature_00000000000000000000000000000000';
    const verifyRes = await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: bill.id,
        razorpayOrderId: rzpOrderRes.data.data.orderId,
        razorpayPaymentId: 'pay_fraudulent_123',
        razorpaySignature: forgedSignature,
      },
    });

    assert(!verifyRes.ok && verifyRes.status === 400, 'TEST 4: Tampered signature rejected with 400 Bad Request');

    // Verify bill remains UNPAID and order not completed
    const checkBill = await prisma.bill.findUnique({ where: { id: bill.id } });
    assert(checkBill.status === 'UNPAID', 'TEST 4: Bill remains UNPAID');
    const checkOrder = await prisma.order.findUnique({ where: { id: order.id } });
    assert(checkOrder.status === 'SERVED', 'TEST 4: Order remains SERVED (not completed)');
    const checkTable = await prisma.table.findUnique({ where: { id: table1.id } });
    assert(checkTable.status === 'OCCUPIED', 'TEST 4: Table remains OCCUPIED');
  }

  // =========================================================================
  // TEST 6 — ALREADY PAID BILL DISALLOWS PAYMENT
  // =========================================================================
  console.log('\n--- Running TEST 6: Already Paid Bill Rejection ---');
  {
    const orderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: test2Bill.id },
    });
    assert(!orderRes.ok && orderRes.status === 400, 'TEST 6: Cannot create order for already paid bill');
  }

  // =========================================================================
  // TEST 8 — MULTIPLE TABLES INDEPENDENCE
  // =========================================================================
  console.log('\n--- Running TEST 8: Multiple Tables Independence ---');
  {
    const { order: order1, bill: bill1 } = await createServedOrderAndBill(table1, 300);
    const { order: order2, bill: bill2 } = await createServedOrderAndBill(table2, 450);

    // Pay bill1 with Razorpay
    const rzpOrder1 = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token,
      body: { billId: bill1.id },
    });
    const fakePay1 = `pay_t1_${Date.now()}`;
    const sig1 = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrder1.data.data.orderId}|${fakePay1}`)
      .digest('hex');

    await apiRequest('/payments/razorpay/verify', {
      method: 'POST',
      token,
      body: {
        billId: bill1.id,
        razorpayOrderId: rzpOrder1.data.data.orderId,
        razorpayPaymentId: fakePay1,
        razorpaySignature: sig1,
      },
    });

    // Check Table 1 is AVAILABLE
    const checkT1 = await prisma.table.findUnique({ where: { id: table1.id } });
    assert(checkT1.status === 'AVAILABLE', 'TEST 8: Table 1 released to AVAILABLE');

    // Check Table 2 remains OCCUPIED and Bill 2 remains UNPAID
    const checkT2 = await prisma.table.findUnique({ where: { id: table2.id } });
    assert(checkT2.status === 'OCCUPIED', 'TEST 8: Table 2 remains OCCUPIED');
    const checkB2 = await prisma.bill.findUnique({ where: { id: bill2.id } });
    assert(checkB2.status === 'UNPAID', 'TEST 8: Bill 2 remains UNPAID');

    // Cleanup Table 2 by paying bill2
    await apiRequest('/payments', {
      method: 'POST',
      token,
      body: { billId: bill2.id, method: 'CASH', amount: Number(bill2.totalAmount) },
    });
  }

  // =========================================================================
  // TEST 9 — TENANT ISOLATION (SECURITY)
  // =========================================================================
  console.log('\n--- Running TEST 9: Multi-tenant Restaurant Security Isolation ---');
  {
    const { bill } = await createServedOrderAndBill(table1, 600);

    // Receptionist B from Restaurant B attempts to create order for Restaurant A's bill
    const crossOrderRes = await apiRequest('/payments/razorpay/order', {
      method: 'POST',
      token: tokenB,
      body: { billId: bill.id },
    });
    assert(crossOrderRes.status === 404 || crossOrderRes.status === 403, 'TEST 9: Receptionist B rejected when accessing Restaurant A bill');

    // Clean up
    await apiRequest('/payments', {
      method: 'POST',
      token,
      body: { billId: bill.id, method: 'CASH', amount: Number(bill.totalAmount) },
    });
  }

  console.log('\n===============================================================');
  console.log(` ALL TESTS COMPLETED: ${passed} / ${total} PASSED (100%)`);
  console.log('===============================================================\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ Unhandled error in test suite:', err);
  process.exit(1);
});
