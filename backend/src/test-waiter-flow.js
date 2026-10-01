/**
 * Comprehensive Automated End-to-End Test Suite for Waiter Module.
 * Validates all required scenarios for Waiter role, dashboard, table operations,
 * order lifecycle, kitchen synchronization, bill delivery, and security boundaries.
 */

import { prisma } from './config/env.js';

const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message, context) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    if (context) console.error('   Context:', typeof context === 'object' ? JSON.stringify(context, null, 2) : context);
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log(' STARTING WAITER VERIFICATION TEST SUITE (END-TO-END FLOW)');
  console.log('===============================================================\n');

  // Step 0: Ensure database has test users & data
  const bcrypt = (await import('bcryptjs')).default;
  const testPassword = await bcrypt.hash('Password123', 10);

  // Main Restaurant
  let restaurant = await prisma.restaurant.findFirst({
    where: { isActive: true },
  });
  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Grand Bella POS Restaurant',
        address: '100 Main St',
        phone: '1234567890',
        isActive: true,
      },
    });
  }

  // Second Restaurant for multi-tenant isolation testing
  let otherRestaurant = await prisma.restaurant.findFirst({
    where: { name: 'Competitor Bistro' },
  });
  if (!otherRestaurant) {
    otherRestaurant = await prisma.restaurant.create({
      data: {
        name: 'Competitor Bistro',
        address: '200 Other St',
        phone: '9876543210',
        isActive: true,
      },
    });
  }

  // Ensure Waiter user
  let waiterUser = await prisma.user.findFirst({
    where: { email: 'waiter.test@pos.com' },
  });
  if (!waiterUser) {
    waiterUser = await prisma.user.create({
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
      where: { id: waiterUser.id },
      data: { password: testPassword, isActive: true, role: 'WAITER', restaurantId: restaurant.id },
    });
  }

  // Ensure Receptionist user
  let receptionistUser = await prisma.user.findFirst({
    where: { email: 'receptionist.test@pos.com' },
  });
  if (!receptionistUser) {
    receptionistUser = await prisma.user.create({
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
      where: { id: receptionistUser.id },
      data: { password: testPassword, isActive: true, role: 'RECEPTIONIST', restaurantId: restaurant.id },
    });
  }

  // Ensure Chef user
  let chefUser = await prisma.user.findFirst({
    where: { email: 'chef.test@pos.com' },
  });
  if (!chefUser) {
    chefUser = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Chef Gordon',
        email: 'chef.test@pos.com',
        password: testPassword,
        role: 'KITCHEN_ADMIN',
        isActive: true,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: chefUser.id },
      data: { password: testPassword, isActive: true, role: 'KITCHEN_ADMIN', restaurantId: restaurant.id },
    });
  }

  // Ensure Test Category & Menu Items
  let category = await prisma.menuCategory.findFirst({
    where: { restaurantId: restaurant.id },
  });
  if (!category) {
    category = await prisma.menuCategory.create({
      data: {
        name: 'Appetizers',
        restaurantId: restaurant.id,
      },
    });
  }

  let menuItem1 = await prisma.menuItem.findFirst({
    where: { restaurantId: restaurant.id, name: 'Garlic Bread' },
  });
  if (!menuItem1) {
    menuItem1 = await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: 'Garlic Bread',
        price: 8.50,
        isAvailable: true,
      },
    });
  }

  let menuItem2 = await prisma.menuItem.findFirst({
    where: { restaurantId: restaurant.id, name: 'Caesar Salad' },
  });
  if (!menuItem2) {
    menuItem2 = await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: 'Caesar Salad',
        price: 12.00,
        isAvailable: true,
      },
    });
  }

  // Ensure inventory items and recipes for the test menu items
  let flourInv = await prisma.inventoryItem.findFirst({
    where: { restaurantId: restaurant.id, name: 'Bread Flour' },
  });
  if (!flourInv) {
    flourInv = await prisma.inventoryItem.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Bread Flour',
        currentStock: 50.0,
        minStockThreshold: 5.0,
        unit: 'KG',
      },
    });
  } else {
    await prisma.inventoryItem.update({
      where: { id: flourInv.id },
      data: { currentStock: 50.0 },
    });
  }

  let saladInv = await prisma.inventoryItem.findFirst({
    where: { restaurantId: restaurant.id, name: 'Salad Greens' },
  });
  if (!saladInv) {
    saladInv = await prisma.inventoryItem.create({
      data: {
        restaurantId: restaurant.id,
        name: 'Salad Greens',
        currentStock: 50.0,
        minStockThreshold: 5.0,
        unit: 'KG',
      },
    });
  } else {
    await prisma.inventoryItem.update({
      where: { id: saladInv.id },
      data: { currentStock: 50.0 },
    });
  }

  let recipe1 = await prisma.recipe.findUnique({
    where: { menuItemId: menuItem1.id },
  });
  if (!recipe1) {
    recipe1 = await prisma.recipe.create({
      data: {
        menuItemId: menuItem1.id,
        instructions: 'Bake with garlic butter',
        prepTime: 10,
        ingredients: {
          create: [{ inventoryItemId: flourInv.id, quantityRequired: 100, unit: 'GRAM' }],
        },
      },
    });
  }

  let recipe2 = await prisma.recipe.findUnique({
    where: { menuItemId: menuItem2.id },
  });
  if (!recipe2) {
    recipe2 = await prisma.recipe.create({
      data: {
        menuItemId: menuItem2.id,
        instructions: 'Toss fresh greens and dressing',
        prepTime: 5,
        ingredients: {
          create: [{ inventoryItemId: saladInv.id, quantityRequired: 100, unit: 'GRAM' }],
        },
      },
    });
  }

  // Ensure Tables
  let table1 = await prisma.table.findFirst({
    where: { restaurantId: restaurant.id, tableNumber: 'T-101' },
  });
  if (!table1) {
    table1 = await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        tableNumber: 'T-101',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
  } else {
    await prisma.order.updateMany({
      where: { tableId: table1.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      data: { status: 'CANCELLED' },
    });
    await prisma.table.update({
      where: { id: table1.id },
      data: { status: 'AVAILABLE' },
    });
  }

  let otherTable = await prisma.table.findFirst({
    where: { restaurantId: otherRestaurant.id, tableNumber: 'BISTRO-99' },
  });
  if (!otherTable) {
    otherTable = await prisma.table.create({
      data: {
        restaurantId: otherRestaurant.id,
        tableNumber: 'BISTRO-99',
        capacity: 2,
        status: 'AVAILABLE',
      },
    });
  }

  // ==========================================
  // SCENARIO 1: Waiter Login & Token Auth
  // ==========================================
  console.log('\n--- SCENARIO 1: Waiter Authentication ---');
  const waiterLoginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'waiter.test@pos.com', password: 'Password123' },
  });
  assert(waiterLoginRes.status === 200, 'Waiter login succeeds with 200 OK', waiterLoginRes);
  const waiterToken = waiterLoginRes.data.data.token;
  assert(Boolean(waiterToken), 'JWT token returned for Waiter');
  assert(waiterLoginRes.data.data.user.role === 'WAITER', 'Logged-in user role is WAITER');

  // Login Receptionist for later billing steps
  const recepLoginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'receptionist.test@pos.com', password: 'Password123' },
  });
  const recepToken = recepLoginRes.data.data.token;

  // Login Chef for kitchen steps
  const chefLoginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'chef.test@pos.com', password: 'Password123' },
  });
  const chefToken = chefLoginRes.data.data.token;

  // ==========================================
  // SCENARIO 2: Strict Authorization (403 Checks)
  // Waiter must NOT have access to staff, inventory, recipes, reports, payment, billing generation, or menu editing
  // ==========================================
  console.log('\n--- SCENARIO 2: Strict Role Access & Forbidden Checks (403) ---');
  const userAccessRes = await request('/users', { token: waiterToken });
  assert(userAccessRes.status === 403, 'Waiter cannot access /users (403 Forbidden)', userAccessRes.status);

  const invAccessRes = await request('/inventory', { token: waiterToken });
  assert(invAccessRes.status === 403, 'Waiter cannot access /inventory (403 Forbidden)', invAccessRes.status);

  const recipeAccessRes = await request('/recipes', { token: waiterToken });
  assert(recipeAccessRes.status === 403, 'Waiter cannot access /recipes (403 Forbidden)', recipeAccessRes.status);

  const reportAccessRes = await request('/reports/sales', { token: waiterToken });
  assert(reportAccessRes.status === 403, 'Waiter cannot access /reports (403 Forbidden)', reportAccessRes.status);

  const paymentAccessRes = await request('/payments', { method: 'POST', token: waiterToken, body: {} });
  assert(paymentAccessRes.status === 403, 'Waiter cannot process payments (403 Forbidden)', paymentAccessRes.status);

  const billGenAccessRes = await request('/billing/generate', { method: 'POST', token: waiterToken, body: {} });
  assert(billGenAccessRes.status === 403, 'Waiter cannot generate bills (403 Forbidden)', billGenAccessRes.status);

  const menuEditAccessRes = await request('/menu/items', { method: 'POST', token: waiterToken, body: { name: 'Hacked Item' } });
  assert(menuEditAccessRes.status === 403, 'Waiter cannot create/edit menu items (403 Forbidden)', menuEditAccessRes.status);

  // ==========================================
  // SCENARIO 3: Waiter Dashboard Endpoint
  // ==========================================
  console.log('\n--- SCENARIO 3: Waiter Dashboard Overview ---');
  const dashRes = await request('/waiter/dashboard', { token: waiterToken });
  assert(dashRes.status === 200, 'Waiter dashboard returns 200 OK', dashRes);
  const dashData = dashRes.data.data;
  assert(dashData.tableOverview !== undefined, 'Dashboard has tableOverview metrics');
  assert(dashData.orderOverview !== undefined, 'Dashboard has orderOverview metrics');
  assert(dashData.billOverview !== undefined, 'Dashboard has billOverview metrics');
  assert(Array.isArray(dashData.tableWiseActiveOrders), 'Dashboard has tableWiseActiveOrders list');
  assert(Array.isArray(dashData.readyOrders), 'Dashboard has readyOrders notifications list');
  assert(Array.isArray(dashData.readyBills), 'Dashboard has readyBills notifications list');

  // ==========================================
  // SCENARIO 4: Table Management
  // ==========================================
  console.log('\n--- SCENARIO 4: Table Management & Status Lookup ---');
  const tablesRes = await request('/tables', { token: waiterToken });
  assert(tablesRes.status === 200, 'Waiter retrieves tables list with 200 OK', tablesRes);
  const foundTable1 = tablesRes.data.data.find(t => t.id === table1.id);
  assert(Boolean(foundTable1), 'Assigned restaurant table found in tables list');
  assert(foundTable1.activeOrders !== undefined, 'Table includes activeOrders relationship');

  // ==========================================
  // SCENARIO 5: Multi-Tenant Isolation
  // ==========================================
  console.log('\n--- SCENARIO 5: Multi-Tenant Isolation ---');
  const otherTableRes = await request(`/tables/${otherTable.id}`, { token: waiterToken });
  assert(otherTableRes.status === 404 || otherTableRes.status === 403, 'Waiter cannot view other restaurant table (404/403)', otherTableRes.status);

  // ==========================================
  // SCENARIO 6: Create New Dine-In Order
  // ==========================================
  console.log('\n--- SCENARIO 6: Create New Dine-In Order ---');
  const createOrderRes = await request('/orders', {
    method: 'POST',
    token: waiterToken,
    body: {
      tableId: table1.id,
      orderType: 'DINE_IN',
      customerCount: 3,
      items: [
        { menuItemId: menuItem1.id, quantity: 2, notes: 'Extra crispy' },
      ],
    },
  });
  assert(createOrderRes.status === 201, 'Order created successfully with 201 Created', createOrderRes);
  const newOrder = createOrderRes.data.data;
  assert(newOrder.tableId === table1.id, 'Order belongs to selected table');
  assert(newOrder.status === 'PENDING', 'Initial order status is PENDING');
  assert(newOrder.items.length === 1, 'Order has 1 initial item line');

  // Verify Table transitioned to OCCUPIED
  const updatedTableRes = await request(`/tables/${table1.id}`, { token: waiterToken });
  assert(updatedTableRes.data.data.status === 'OCCUPIED', 'Table status automatically changed to OCCUPIED');

  // ==========================================
  // SCENARIO 7: Append Items to Open Order
  // ==========================================
  console.log('\n--- SCENARIO 7: Append Additional Items to Active Order ---');
  const appendItemsRes = await request(`/orders/${newOrder.id}/items`, {
    method: 'POST',
    token: waiterToken,
    body: {
      items: [
        { menuItemId: menuItem2.id, quantity: 1, notes: 'Dressing on the side' },
      ],
    },
  });
  assert(appendItemsRes.status === 200 || appendItemsRes.status === 201, 'Items appended to order with 200/201', appendItemsRes);
  const orderWithAppended = appendItemsRes.data.data;
  assert(orderWithAppended.items.length >= 2, 'Order now contains multiple items');

  // ==========================================
  // SCENARIO 8: Send Order to Kitchen
  // ==========================================
  console.log('\n--- SCENARIO 8: Send Order to Kitchen ---');
  const sendKitchenRes = await request(`/orders/${newOrder.id}/send-to-kitchen`, {
    method: 'POST',
    token: waiterToken,
  });
  assert(sendKitchenRes.status === 200, 'Order successfully sent to kitchen with 200 OK', sendKitchenRes);
  const kitchenSentOrder = sendKitchenRes.data.data;
  assert(['IN_KITCHEN', 'CONFIRMED', 'ACCEPTED'].includes(kitchenSentOrder.status), `Order status updated to kitchen state: ${kitchenSentOrder.status}`);

  // ==========================================
  // SCENARIO 9: Kitchen Processing -> READY
  // ==========================================
  console.log('\n--- SCENARIO 9: Kitchen Prepares and Marks Order READY ---');
  // Kitchen marks PREPARING
  const prepRes = await request(`/kitchen/orders/${newOrder.id}/prepare`, {
    method: 'PATCH',
    token: chefToken,
  });
  assert(prepRes.status === 200, 'Kitchen moves order to IN_PREPARATION', prepRes);

  // Kitchen marks READY
  const readyRes = await request(`/kitchen/orders/${newOrder.id}/ready`, {
    method: 'PATCH',
    token: chefToken,
  });
  assert(readyRes.status === 200, 'Kitchen moves order to READY', readyRes);

  // ==========================================
  // SCENARIO 10: Real-time Ready Order Notification in Waiter Dashboard
  // ==========================================
  console.log('\n--- SCENARIO 10: Waiter Dashboard Ready Orders Notification ---');
  const dashReadyRes = await request('/waiter/dashboard', { token: waiterToken });
  const readyOrders = dashReadyRes.data.data.readyOrders;
  const isFoundReady = readyOrders.some(o => o.orderId === newOrder.id || o.id === newOrder.id);
  assert(isFoundReady, 'Order is present in Waiter dashboard readyOrders list');

  // ==========================================
  // SCENARIO 11: Waiter Serves Order
  // ==========================================
  console.log('\n--- SCENARIO 11: Waiter Marks Order as SERVED ---');
  const serveRes = await request(`/orders/${newOrder.id}/serve`, {
    method: 'POST',
    token: waiterToken,
  });
  assert(serveRes.status === 200, 'Waiter marks order as SERVED with 200 OK', serveRes);
  const servedOrder = serveRes.data.data;
  assert(servedOrder.status === 'SERVED', 'Order status is SERVED');
  assert(Boolean(servedOrder.servedAt), 'servedAt timestamp is recorded');
  assert(servedOrder.servedById === waiterUser.id, 'servedById is set to current Waiter user ID');

  // ==========================================
  // SCENARIO 12: Receptionist Generates Bill
  // ==========================================
  console.log('\n--- SCENARIO 12: Receptionist Generates Bill ---');
  const genBillRes = await request('/billing/generate', {
    method: 'POST',
    token: recepToken,
    body: {
      orderId: newOrder.id,
      discount: 0,
      tax: 2.00,
    },
  });
  assert(genBillRes.status === 201 || genBillRes.status === 200, 'Receptionist creates bill with 200/201', genBillRes);
  const bill = genBillRes.data.data;
  assert(bill.isDelivered === false, 'Bill is initially isDelivered: false');

  // Check bill appears in Waiter readyBills notification
  const dashBillRes = await request('/waiter/dashboard', { token: waiterToken });
  const readyBills = dashBillRes.data.data.readyBills;
  const isFoundBill = readyBills.some(b => b.billId === bill.id || b.id === bill.id);
  assert(isFoundBill, 'Bill is present in Waiter dashboard readyBills list');

  // ==========================================
  // SCENARIO 13: Waiter Views Bills
  // ==========================================
  console.log('\n--- SCENARIO 13: Waiter Views Bills List ---');
  const waiterBillsRes = await request('/billing/bills', { token: waiterToken });
  assert(waiterBillsRes.status === 200, 'Waiter can view bills list with 200 OK', waiterBillsRes);
  const foundBill = waiterBillsRes.data.data.find(b => b.id === bill.id);
  assert(Boolean(foundBill), 'Generated bill exists in bills list');

  // ==========================================
  // SCENARIO 14: Waiter Delivers Bill
  // ==========================================
  console.log('\n--- SCENARIO 14: Waiter Delivers Bill to Table ---');
  const deliverRes = await request(`/billing/bills/${bill.id}/deliver`, {
    method: 'POST',
    token: waiterToken,
  });
  assert(deliverRes.status === 200, 'Waiter delivers bill with 200 OK', deliverRes);
  const deliveredBill = deliverRes.data.data;
  assert(deliveredBill.isDelivered === true, 'Bill isDelivered is now true');
  assert(Boolean(deliveredBill.deliveredAt), 'deliveredAt timestamp is recorded');
  assert(deliveredBill.deliveredById === waiterUser.id, 'deliveredById is set to current Waiter user ID');

  // Verify it is no longer in readyBills
  const dashDeliveredRes = await request('/waiter/dashboard', { token: waiterToken });
  const stillInReadyBills = dashDeliveredRes.data.data.readyBills.some(b => b.id === bill.id);
  assert(!stillInReadyBills, 'Delivered bill is removed from readyBills alerts');

  // ==========================================
  // SCENARIO 15: Payment Settlement & Table Release
  // ==========================================
  console.log('\n--- SCENARIO 15: Payment Settlement & Table Release ---');
  const payRes = await request('/payments', {
    method: 'POST',
    token: recepToken,
    body: {
      billId: bill.id,
      amount: bill.finalAmount || bill.totalAmount,
      method: 'CASH',
    },
  });
  assert(payRes.status === 201 || payRes.status === 200, 'Payment recorded by receptionist', payRes);

  // Verify order is COMPLETED and table is AVAILABLE
  const finalOrder = await prisma.order.findUnique({ where: { id: newOrder.id } });
  assert(finalOrder.status === 'COMPLETED', 'Order status is COMPLETED upon settlement');

  const finalTable = await prisma.table.findUnique({ where: { id: table1.id } });
  assert(finalTable.status === 'AVAILABLE', 'Table status returned to AVAILABLE');

  // ==========================================
  // SCENARIO 16: Invalid Status Transition Rejection
  // ==========================================
  console.log('\n--- SCENARIO 16: Invalid Status Transition Rejection ---');
  // Create another order in PENDING status
  const pendingOrderRes = await request('/orders', {
    method: 'POST',
    token: waiterToken,
    body: {
      tableId: table1.id,
      orderType: 'DINE_IN',
      customerCount: 2,
      items: [{ menuItemId: menuItem1.id, quantity: 1 }],
    },
  });
  const pendingOrder = pendingOrderRes.data.data;

  // Try to directly mark SERVED without READY
  const badServeRes = await request(`/orders/${pendingOrder.id}/serve`, {
    method: 'POST',
    token: waiterToken,
  });
  assert(badServeRes.status === 400 || badServeRes.status === 409, 'Direct PENDING -> SERVED rejected with 400/409', badServeRes.status);

  // Clean up the temporary pending order
  await prisma.orderItem.deleteMany({ where: { orderId: pendingOrder.id } });
  await prisma.order.delete({ where: { id: pendingOrder.id } });
  await prisma.table.update({ where: { id: table1.id }, data: { status: 'AVAILABLE' } });

  // ==========================================
  // SCENARIO 17: Read-Only Menu Access
  // ==========================================
  console.log('\n--- SCENARIO 17: Read-Only Menu Browsing ---');
  const menuCatsRes = await request('/menu/categories', { token: waiterToken });
  assert(menuCatsRes.status === 200, 'Waiter can fetch menu categories with 200 OK', menuCatsRes);
  const menuItemsRes = await request('/menu/items', { token: waiterToken });
  assert(menuItemsRes.status === 200, 'Waiter can fetch menu items with 200 OK', menuItemsRes);

  // ==========================================
  // SCENARIO 18: Scoped Settings & Profile
  // ==========================================
  console.log('\n--- SCENARIO 18: Waiter Profile & Settings ---');
  const profileRes = await request('/auth/me', { token: waiterToken });
  assert(profileRes.status === 200, 'Waiter can access own profile with 200 OK', profileRes);
  assert(profileRes.data.data.email === 'waiter.test@pos.com', 'Profile matches logged-in Waiter');

  console.log('\n===============================================================');
  console.log(` ALL WAITER TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
  console.log('===============================================================\n');
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ TEST RUNNER TERMINATED WITH ERROR:', err);
    process.exit(1);
  });
