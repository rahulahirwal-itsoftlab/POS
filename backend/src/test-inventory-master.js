import { prisma } from './config/env.js';
import { signToken } from './utils/jwt.js';

async function runComprehensiveTests() {
  console.log('====================================================');
  console.log('POS INVENTORY END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Get test restaurant and owner
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

  const baseUrl = 'http://localhost:5000/api/inventory';

  const makeRequest = async (url, method, body) => {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  // Clean up any pre-existing Rice test item
  const existingRice = await prisma.inventoryItem.findFirst({
    where: { restaurantId: user.restaurantId, name: 'Rice' },
  });
  if (existingRice) {
    await prisma.inventoryTransaction.deleteMany({ where: { inventoryItemId: existingRice.id } });
    await prisma.inventoryItem.delete({ where: { id: existingRice.id } });
  }

  // TEST 1: Invalid unit rejection test (before fix demonstration)
  console.log('--- TEST 1: INVALID UNIT VALIDATION REJECTION ---');
  const invalidUnitPayload = {
    name: 'Rice',
    sku: 'ING-RICE-001',
    unit: 'kg (Kilogram)', // The exact old bug
    currentStock: 25,
    minStockThreshold: 5,
    costPerUnit: 60,
  };
  const invalidRes = await makeRequest(baseUrl, 'POST', invalidUnitPayload);
  console.log('Sent unit: "kg (Kilogram)"');
  console.log('Response Status:', invalidRes.status);
  console.log('Validation Errors:', invalidRes.data.errors);
  if (invalidRes.status !== 400 || !invalidRes.data.errors?.[0]?.includes('unit must be one of: KG, GRAM, LITER, MILLILITER, PIECE, PACKET, CAN, BOTTLE')) {
    throw new Error('Expected 400 rejection for human-readable unit');
  }
  console.log('✓ Invalid unit correctly rejected by backend validation.\n');

  // TEST 2: Add Rice with Canonical Unit "KG"
  console.log('--- TEST 2: CREATE INVENTORY ITEM (RICE / KG) ---');
  const ricePayload = {
    name: 'Rice',
    sku: 'ING-RICE-001',
    unit: 'KG',
    currentStock: 25,
    minStockThreshold: 5,
    costPerUnit: 60,
  };
  console.log('Payload sent:', JSON.stringify(ricePayload, null, 2));
  const riceRes = await makeRequest(baseUrl, 'POST', ricePayload);
  console.log('Response Status:', riceRes.status);
  console.log('Created Item:', riceRes.data.data);

  if (riceRes.status !== 201 || !riceRes.data.success) {
    throw new Error(`Failed to create Rice: ${JSON.stringify(riceRes.data)}`);
  }
  const riceId = riceRes.data.data.id;

  // Verify in Neon PostgreSQL database
  const dbRice = await prisma.inventoryItem.findUnique({ where: { id: riceId } });
  console.log('Database Record:', {
    id: dbRice.id,
    name: dbRice.name,
    sku: dbRice.sku,
    unit: dbRice.unit,
    currentStock: dbRice.currentStock.toString(),
    minStockThreshold: dbRice.minStockThreshold.toString(),
    costPerUnit: dbRice.costPerUnit.toString(),
  });

  if (dbRice.unit !== 'KG' || Number(dbRice.currentStock) !== 25 || Number(dbRice.minStockThreshold) !== 5 || Number(dbRice.costPerUnit) !== 60) {
    throw new Error('Database record does not match expected values for Rice');
  }
  console.log('✓ Rice successfully saved to database with unit KG, stock 25, min 5, cost 60.\n');

  // TEST 3: Stock Adjustment +10 KG (25 -> 35 KG)
  console.log('--- TEST 3: STOCK ADJUSTMENT (+10 KG) ---');
  const adj1Res = await makeRequest(`${baseUrl}/${riceId}/adjust`, 'PATCH', {
    quantityAdjustment: 10,
    reason: 'Purchase Inward Receipt',
    auditNotes: 'Procured 10 KG bulk rice batch',
  });
  console.log('Status:', adj1Res.status);
  console.log('New Stock in response:', adj1Res.data.data?.currentStock);
  if (adj1Res.status !== 200 || Number(adj1Res.data.data?.currentStock) !== 35) {
    throw new Error(`Expected currentStock to be 35, got ${adj1Res.data.data?.currentStock}`);
  }

  const dbRiceAdj1 = await prisma.inventoryItem.findUnique({ where: { id: riceId } });
  if (Number(dbRiceAdj1.currentStock) !== 35) throw new Error('Database currentStock not 35');

  const tx1 = await prisma.inventoryTransaction.findFirst({
    where: { inventoryItemId: riceId },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Audit Transaction (+10):', {
    type: tx1.type,
    quantity: tx1.quantity.toString(),
    unit: tx1.unit,
    previousBalance: tx1.previousBalance.toString(),
    remainingBalance: tx1.remainingBalance.toString(),
    reason: tx1.reason,
    reference: tx1.reference,
  });
  if (Number(tx1.quantity) !== 10 || Number(tx1.previousBalance) !== 25 || Number(tx1.remainingBalance) !== 35) {
    throw new Error('Transaction record invalid for +10 KG');
  }
  console.log('✓ Stock successfully incremented: 25 KG + 10 KG = 35 KG.\n');

  // TEST 4: Stock Adjustment -5 KG (35 -> 30 KG)
  console.log('--- TEST 4: STOCK ADJUSTMENT (-5 KG) ---');
  const adj2Res = await makeRequest(`${baseUrl}/${riceId}/adjust`, 'PATCH', {
    quantityAdjustment: -5,
    reason: 'Manual Correction',
    auditNotes: 'Correction audit count',
  });
  console.log('Status:', adj2Res.status);
  console.log('New Stock in response:', adj2Res.data.data?.currentStock);
  if (adj2Res.status !== 200 || Number(adj2Res.data.data?.currentStock) !== 30) {
    throw new Error(`Expected currentStock to be 30, got ${adj2Res.data.data?.currentStock}`);
  }

  const dbRiceAdj2 = await prisma.inventoryItem.findUnique({ where: { id: riceId } });
  if (Number(dbRiceAdj2.currentStock) !== 30) throw new Error('Database currentStock not 30');

  const tx2 = await prisma.inventoryTransaction.findFirst({
    where: { inventoryItemId: riceId },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Audit Transaction (-5):', {
    type: tx2.type,
    quantity: tx2.quantity.toString(),
    unit: tx2.unit,
    previousBalance: tx2.previousBalance.toString(),
    remainingBalance: tx2.remainingBalance.toString(),
    reason: tx2.reason,
    reference: tx2.reference,
  });
  if (Number(tx2.quantity) !== -5 || Number(tx2.previousBalance) !== 35 || Number(tx2.remainingBalance) !== 30) {
    throw new Error('Transaction record invalid for -5 KG');
  }
  console.log('✓ Stock successfully decremented: 35 KG - 5 KG = 30 KG.\n');

  // TEST 5: Low-Stock Logic Verification
  console.log('--- TEST 5: LOW STOCK VERIFICATION ---');
  // At currentStock = 30 and minStockThreshold = 5, Rice is NOT low stock
  const lowStockRes1 = await makeRequest(`${baseUrl}/low-stock`, 'GET');
  const isRiceInLowStock1 = lowStockRes1.data.data?.some((i) => i.id === riceId);
  console.log('Is Rice in low stock list when stock is 30 KG (min 5)?', isRiceInLowStock1);
  if (isRiceInLowStock1) throw new Error('Rice should not be marked as low stock at 30 KG');

  // Adjust Rice down to 4 KG (below 5 KG min threshold)
  await makeRequest(`${baseUrl}/${riceId}/adjust`, 'PATCH', {
    quantityAdjustment: -26,
    reason: 'Kitchen Bulk Transfer',
    auditNotes: 'Transfer 26 KG to central store',
  });
  const dbRiceLow = await prisma.inventoryItem.findUnique({ where: { id: riceId } });
  console.log('Stock after -26 KG adjustment:', dbRiceLow.currentStock.toString(), dbRiceLow.unit);

  const lowStockRes2 = await makeRequest(`${baseUrl}/low-stock`, 'GET');
  const isRiceInLowStock2 = lowStockRes2.data.data?.some((i) => i.id === riceId);
  console.log('Is Rice in low stock list when stock is 4 KG (min 5)?', isRiceInLowStock2);
  if (!isRiceInLowStock2) throw new Error('Rice MUST be identified as low stock when stock is 4 KG <= min 5 KG');
  console.log('✓ Low-stock detection verified accurately.\n');

  // Reset Rice to 25 KG for clear display
  await makeRequest(`${baseUrl}/${riceId}/adjust`, 'PATCH', {
    quantityAdjustment: 21,
    reason: 'Purchase Inward Receipt',
    auditNotes: 'Reset Rice to 25 KG',
  });

  // TEST 6: Test ALL 8 Backend Supported Units
  console.log('--- TEST 6: TEST ALL 8 UNITS (KG, GRAM, LITER, MILLILITER, PIECE, PACKET, CAN, BOTTLE) ---');
  const testUnits = [
    { unit: 'KG', name: 'Basmati Rice Special', sku: 'SKU-KG-01', stock: 50, min: 10, cost: 85 },
    { unit: 'GRAM', name: 'Saffron Threads', sku: 'SKU-GRAM-02', stock: 250, min: 20, cost: 150 },
    { unit: 'LITER', name: 'Cold Pressed Mustard Oil', sku: 'SKU-LITER-03', stock: 40, min: 8, cost: 220 },
    { unit: 'MILLILITER', name: 'Almond Essence', sku: 'SKU-ML-04', stock: 500, min: 100, cost: 95 },
    { unit: 'PIECE', name: 'Brioche Burger Buns', sku: 'SKU-PIECE-05', stock: 120, min: 30, cost: 12 },
    { unit: 'PACKET', name: 'Yeast Packet', sku: 'SKU-PACKET-06', stock: 35, min: 5, cost: 25 },
    { unit: 'CAN', name: 'Coconut Milk Can', sku: 'SKU-CAN-07', stock: 24, min: 6, cost: 75 },
    { unit: 'BOTTLE', name: 'Dark Soya Sauce', sku: 'SKU-BOTTLE-08', stock: 16, min: 4, cost: 110 },
  ];

  const createdIds = [];

  for (const item of testUnits) {
    // Clean up if already exists
    const existing = await prisma.inventoryItem.findFirst({
      where: { restaurantId: user.restaurantId, name: item.name },
    });
    if (existing) {
      await prisma.inventoryTransaction.deleteMany({ where: { inventoryItemId: existing.id } });
      await prisma.inventoryItem.delete({ where: { id: existing.id } });
    }

    const payload = {
      name: item.name,
      sku: item.sku,
      unit: item.unit,
      currentStock: item.stock,
      minStockThreshold: item.min,
      costPerUnit: item.cost,
    };

    const res = await makeRequest(baseUrl, 'POST', payload);
    if (res.status !== 201 || !res.data.success) {
      throw new Error(`Failed to create unit ${item.unit}: ${JSON.stringify(res.data)}`);
    }

    const created = res.data.data;
    createdIds.push(created.id);

    // Verify DB
    const dbItem = await prisma.inventoryItem.findUnique({ where: { id: created.id } });
    if (dbItem.unit !== item.unit) {
      throw new Error(`Unit mismatch in DB for ${item.name}: expected ${item.unit}, got ${dbItem.unit}`);
    }

    // Verify Adjustment works on each unit
    const adjRes = await makeRequest(`${baseUrl}/${created.id}/adjust`, 'PATCH', {
      quantityAdjustment: 5,
      reason: 'Purchase Inward Receipt',
      auditNotes: `Add 5 ${item.unit}`,
    });
    if (adjRes.status !== 200 || Number(adjRes.data.data?.currentStock) !== item.stock + 5) {
      throw new Error(`Adjustment failed for unit ${item.unit}`);
    }

    console.log(`✓ Unit ${item.unit.padEnd(10)}: Item '${item.name}' created & adjusted (+5 ${item.unit} -> ${item.stock + 5} ${item.unit}) successfully.`);
  }

  // TEST 7: Search and Filter verification
  console.log('\n--- TEST 7: SEARCH & FILTER ---');
  const searchByName = await makeRequest(`${baseUrl}?search=Rice`, 'GET');
  const foundByName = searchByName.data.data?.some((i) => i.name === 'Rice');
  console.log('HTTP Search by Name "Rice":', foundByName);
  if (!foundByName) throw new Error('HTTP Search failed for Rice');

  // Verify direct service layer search by SKU
  const { getInventoryItems } = await import('./services/inventory.service.js');
  const serviceSearch = await getInventoryItems(user.restaurantId, { search: 'ING-RICE-001' });
  const foundBySkuService = (serviceSearch.items || serviceSearch.data || []).some((i) => i.sku === 'ING-RICE-001');
  console.log('Backend Service Search by SKU "ING-RICE-001":', foundBySkuService);
  if (!foundBySkuService) throw new Error('Service search by SKU failed for ING-RICE-001');

  // Verify frontend filter logic
  const allItemsRes = await makeRequest(baseUrl, 'GET');
  const allItems = allItemsRes.data.data || [];
  const query = 'ING-RICE-001';
  const frontendFiltered = allItems.filter(
    (it) => it.name.toLowerCase().includes(query.toLowerCase()) || (it.sku && it.sku.toLowerCase().includes(query.toLowerCase()))
  );
  console.log('Frontend Filter for "ING-RICE-001":', frontendFiltered.length > 0 && frontendFiltered[0].name === 'Rice');
  if (!frontendFiltered.length || frontendFiltered[0].name !== 'Rice') throw new Error('Frontend filter failed for ING-RICE-001');
  console.log('✓ Search and filter verified across HTTP, service, and frontend.');

  // Clean up the 8 extra test items created in test 6 (keep Rice for user testing)
  for (const id of createdIds) {
    await prisma.inventoryTransaction.deleteMany({ where: { inventoryItemId: id } });
    await prisma.inventoryItem.delete({ where: { id } }).catch(() => {});
  }

  console.log('\n====================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
  process.exit(0);
}

runComprehensiveTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
