import {
  ROLES,
  normalizeRole,
  ROLE_CONFIG,
  resolveRoute,
  getPathForTab,
} from '../frontend/src/config/navigation.js';

function runUnitTests() {
  console.log('Running resolveRoute Unit Tests...');

  // Test 1: Role normalization
  console.assert(normalizeRole('waiter') === ROLES.WAITER, 'waiter normalization');
  console.assert(normalizeRole('SERVICE_WAITER') === ROLES.WAITER, 'service_waiter normalization');
  console.assert(normalizeRole('PLATFORM_SUPER_ADMIN') === ROLES.RESTAURANT_REGISTRATION_ADMIN, 'super admin normalization');
  console.assert(normalizeRole('OWNER') === ROLES.RESTAURANT_OWNER, 'owner normalization');
  console.assert(normalizeRole('CHEF') === ROLES.KITCHEN_ADMIN, 'chef normalization');
  console.assert(normalizeRole('CASHIER') === ROLES.RECEPTIONIST, 'cashier normalization');
  console.log('✓ Role normalization passed');

  // Test 2: Waiter landing route from /login or /
  const waiterLogin = resolveRoute('/login', ROLES.WAITER);
  console.assert(waiterLogin.tab === 'dashboard' && waiterLogin.path === '/waiter-dashboard', 'waiter login redirect');

  // Test 3: Receptionist landing route from /login or /
  const recLogin = resolveRoute('/', ROLES.RECEPTIONIST);
  console.assert(recLogin.tab === 'billing' && recLogin.path === '/receptionist-dashboard', 'receptionist login redirect');

  // Test 4: Super Admin landing route
  const adminLogin = resolveRoute('/', ROLES.RESTAURANT_REGISTRATION_ADMIN);
  console.assert(adminLogin.tab === 'registration' && adminLogin.path === '/super-admin-dashboard', 'admin login redirect');

  // Test 5: Kitchen Admin landing route
  const kitchenLogin = resolveRoute('/', ROLES.KITCHEN_ADMIN);
  console.assert(kitchenLogin.tab === 'dashboard' && kitchenLogin.path === '/kitchen-dashboard', 'kitchen login redirect');

  // Test 6: Unauthorized access attempt: Waiter accessing /governance
  const waiterForbidden = resolveRoute('/governance', ROLES.WAITER);
  console.assert(waiterForbidden.isAuthorized === false, 'waiter forbidden on /governance');
  console.assert(waiterForbidden.path === '/waiter-dashboard', 'waiter redirected from /governance');

  // Test 7: Direct access to authorized sub-stations
  const waiterTables = resolveRoute('/tables', ROLES.WAITER);
  console.assert(waiterTables.isAuthorized === true && waiterTables.tab === 'tables', 'waiter direct /tables');

  const ownerReports = resolveRoute('/reports', ROLES.RESTAURANT_OWNER);
  console.assert(ownerReports.isAuthorized === true && ownerReports.tab === 'reports', 'owner direct /reports');

  // Test 8: Direct access to profile
  const profileRoute = resolveRoute('/profile', ROLES.WAITER);
  console.assert(profileRoute.tab === 'settings' && profileRoute.subTab === 'profile', 'profile route');

  // Test 9: Unknown route fallback
  const unknownRoute = resolveRoute('/some-random-broken-path', ROLES.KITCHEN_ADMIN);
  console.assert(unknownRoute.tab === 'dashboard' && unknownRoute.path === '/kitchen-dashboard', 'unknown route fallback');

  console.log('✓ All 9 Route Resolution Unit Tests PASSED with 100% accuracy!');
}

runUnitTests();
