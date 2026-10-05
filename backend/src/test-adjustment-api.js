import { prisma } from './config/env.js';
import { signToken } from './utils/jwt.js';

async function runTests() {
  console.log('=== RUNNING INVENTORY ADJUSTMENT ENDPOINT TESTS ===\n');

  // 1. Get test user and inventory item
  const user = await prisma.user.findFirst({
    where: { email: 'adarsh@pos.com' },
  });
  if (!user) throw new Error('User adarsh@pos.com not found');

  const token = signToken({
    id: user.id,
    userId: user.id,
    restaurantId: user.restaurantId,
    role: user.role,
  });

  const itemId = 'c5509412-b301-4f27-b0e3-61f725ad1b3b'; // panner
  
  // Reset panner to 1 KG initially
  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { currentStock: 1 },
  });

  const baseUrl = 'http://localhost:5000/api/inventory';

  const makeRequest = async (url, method, body, headers = {}) => {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  // TEST 1: Validation - missing quantityAdjustment
  console.log('Test 1: Missing quantityAdjustment');
  const t1 = await makeRequest(`${baseUrl}/${itemId}/adjust`, 'PATCH', {
    reason: 'Purchase Inward Receipt',
  });
  console.log('Status:', t1.status, 'Errors:', t1.data.errors);
  if (t1.status !== 400) throw new Error('Expected 400 for missing quantityAdjustment');

  // TEST 2: Validation - quantityAdjustment = 0
  console.log('\nTest 2: quantityAdjustment = 0');
  const t2 = await makeRequest(`${baseUrl}/${itemId}/adjust`, 'PATCH', {
    quantityAdjustment: 0,
    reason: 'Purchase Inward Receipt',
  });
  console.log('Status:', t2.status, 'Errors:', t2.data.errors);
  if (t2.status !== 400) throw new Error('Expected 400 for zero adjustment');

  // TEST 3: Validation - quantityAdjustment = "abc"
  console.log('\nTest 3: quantityAdjustment = "abc"');
  const t3 = await makeRequest(`${baseUrl}/${itemId}/adjust`, 'PATCH', {
    quantityAdjustment: 'abc',
    reason: 'Purchase Inward Receipt',
  });
  console.log('Status:', t3.status, 'Errors:', t3.data.errors);
  if (t3.status !== 400) throw new Error('Expected 400 for non-numeric adjustment');

  // TEST 4: Validation - missing reason
  console.log('\nTest 4: missing reason');
  const t4 = await makeRequest(`${baseUrl}/${itemId}/adjust`, 'PATCH', {
    quantityAdjustment: 5,
  });
  console.log('Status:', t4.status, 'Errors:', t4.data.errors);
  if (t4.status !== 400) throw new Error('Expected 400 for missing reason');

  // TEST 5: Insufficient stock - quantityAdjustment = -999
  console.log('\nTest 5: Insufficient stock (adjustment = -999 when stock = 1)');
  const t5 = await makeRequest(`${baseUrl}/${itemId}/adjust`, 'PATCH', {
    quantityAdjustment: -999,
    reason: 'Damaged / Broken',
  });
  console.log('Status:', t5.status, 'Message:', t5.data.message);
  if (t5.status !== 400) throw new Error('Expected 400 for negative stock');

  // TEST 6: Positive adjustment (+9 KG): 1 KG + 9 KG = 10 KG
  console.log('\nTest 6: Positive adjustment (+9 KG): 1 KG -> 10 KG');
  const t6 = await makeRequest(`${baseUrl}/${itemId}/adjust`, 'PATCH', {
    quantityAdjustment: 9,
    reason: 'Purchase Inward Receipt',
    auditNotes: 'Test purchase inward stock',
  });
  console.log('Status:', t6.status, 'Data:', t6.data);
  if (t6.status !== 200 || !t6.data.success) throw new Error('Expected 200 for positive adjustment');
  if (Number(t6.data.data.currentStock) !== 10) throw new Error(`Expected currentStock to be 10, got ${t6.data.data.currentStock}`);

  // Check database directly
  const dbItem1 = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  console.log('DB currentStock after +9:', dbItem1.currentStock.toString());
  if (Number(dbItem1.currentStock) !== 10) throw new Error('DB item stock was not updated to 10');

  // Check inventory transaction
  const txRecord1 = await prisma.inventoryTransaction.findFirst({
    where: { inventoryItemId: itemId },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Latest transaction record:', JSON.stringify(txRecord1, null, 2));
  if (!txRecord1 || txRecord1.type !== 'ADJUSTMENT' || Number(txRecord1.quantity) !== 9 || Number(txRecord1.remainingBalance) !== 10) {
    throw new Error('InventoryTransaction record invalid for +9 KG');
  }

  // TEST 7: Negative adjustment (-2 KG): 10 KG - 2 KG = 8 KG
  console.log('\nTest 7: Negative adjustment (-2 KG): 10 KG -> 8 KG');
  const t7 = await makeRequest(`${baseUrl}/${itemId}/adjust`, 'PATCH', {
    quantityAdjustment: -2,
    reason: 'Damaged / Broken',
    auditNotes: 'Damaged during storage',
  });
  console.log('Status:', t7.status, 'Data currentStock:', t7.data.data.currentStock);
  if (t7.status !== 200 || Number(t7.data.data.currentStock) !== 8) throw new Error('Expected 200 and stock = 8');

  const dbItem2 = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  console.log('DB currentStock after -2:', dbItem2.currentStock.toString());
  if (Number(dbItem2.currentStock) !== 8) throw new Error('DB item stock was not updated to 8');

  const txRecord2 = await prisma.inventoryTransaction.findFirst({
    where: { inventoryItemId: itemId },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Latest transaction record after -2:', JSON.stringify(txRecord2, null, 2));
  if (!txRecord2 || txRecord2.type !== 'ADJUSTMENT' || Number(txRecord2.quantity) !== -2 || Number(txRecord2.remainingBalance) !== 8) {
    throw new Error('InventoryTransaction record invalid for -2 KG');
  }

  // Reset panner to 1 KG so the user can test the UI starting from 1 KG
  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: { currentStock: 1 },
  });
  console.log('\nReset panner stock to 1 KG for UI testing.');

  console.log('\nALL ENDPOINT TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
