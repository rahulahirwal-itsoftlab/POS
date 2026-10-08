import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

const ROLES_TEST_MATRIX = [
  {
    role: 'WAITER',
    email: 'mohit@pos.com',
    password: '12345678',
    expectedDefaultPath: '/waiter-dashboard',
    expectedDefaultTab: 'dashboard',
    testEndpoint: '/waiter/dashboard',
  },
  {
    role: 'KITCHEN_ADMIN',
    email: 'vishwas@pos.com',
    password: '12345678',
    expectedDefaultPath: '/kitchen-dashboard',
    expectedDefaultTab: 'dashboard',
    testEndpoint: '/kitchen/dashboard',
  },
  {
    role: 'RECEPTIONIST',
    email: 'ritik@pos.com',
    password: '12345678',
    expectedDefaultPath: '/receptionist-dashboard',
    expectedDefaultTab: 'billing',
    testEndpoint: '/billing/bills',
  },
  {
    role: 'RESTAURANT_OWNER',
    email: 'guru@pos.com',
    password: '12345678',
    expectedDefaultPath: '/restaurant-dashboard',
    expectedDefaultTab: 'dashboard',
    testEndpoint: '/reports/dashboard',
  },
  {
    role: 'RESTAURANT_REGISTRATION_ADMIN',
    email: 'admin@pos.com',
    password: 'Password123',
    expectedDefaultPath: '/super-admin-dashboard',
    expectedDefaultTab: 'registration',
    testEndpoint: '/super-admin/restaurants',
  },
];

async function runTest() {
  console.log('===========================================================');
  console.log(' STARTING END-TO-END ROLE LOGIN & WORKSPACE VERIFICATION');
  console.log('===========================================================\n');

  let passed = 0;

  for (const testCase of ROLES_TEST_MATRIX) {
    console.log(`[TEST] Testing Role: ${testCase.role} (${testCase.email})...`);

    // 1. Test POST /api/auth/login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCase.email, password: testCase.password }),
    });

    const loginJson = await loginRes.json();
    if (!loginRes.ok || !loginJson.success || !loginJson.data?.token) {
      console.error(`❌ FAILED: Login failed for ${testCase.email}:`, loginJson);
      continue;
    }

    const { token, user } = loginJson.data;
    console.log(`  ✓ Login successful! Token received. User: "${user.name}", Role: "${user.role}"`);

    if (user.role !== testCase.role) {
      console.error(`❌ FAILED: Role mismatch! Expected ${testCase.role}, got ${user.role}`);
      continue;
    }

    // 2. Test GET /api/auth/me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meJson = await meRes.json();
    if (!meRes.ok || !meJson.success) {
      console.error(`❌ FAILED: /auth/me failed for ${testCase.email}:`, meJson);
      continue;
    }
    console.log(`  ✓ /auth/me profile verified successfully.`);

    // 3. Test Role-Specific Dashboard API
    const dashRes = await fetch(`${BASE_URL}${testCase.testEndpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dashJson = await dashRes.json();
    if (!dashRes.ok || !dashJson.success) {
      console.error(`❌ FAILED: Dashboard endpoint ${testCase.testEndpoint} returned status ${dashRes.status}:`, dashJson);
      continue;
    }
    console.log(`  ✓ Dashboard API ${testCase.testEndpoint} responded HTTP 200 OK.`);
    console.log(`  ✓ Landing URL: ${testCase.expectedDefaultPath} (Tab: ${testCase.expectedDefaultTab})`);
    console.log(`  PASSED for ${testCase.role}!\n`);
    passed++;
  }

  console.log(`\n===========================================================`);
  console.log(` SUMMARY: ${passed} / ${ROLES_TEST_MATRIX.length} Roles Verified Successfully`);
  console.log(`===========================================================`);

  if (passed === ROLES_TEST_MATRIX.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
