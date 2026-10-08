import {
  ROLES,
  normalizeRole,
  ROLE_CONFIG,
  resolveRoute,
  getDefaultPathForRole,
  getDefaultTabForRole,
  getPathForTab,
} from '../frontend/src/config/navigation.js';

console.log('===========================================================');
console.log(' RUNNING COMPLETE AUTH & RBAC VERIFICATION SUITE');
console.log('===========================================================\n');

let allPassed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    allPassed = false;
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

// -------------------------------------------------------------
// TEST 1: Role Normalization (Strings & Objects & Formats)
// -------------------------------------------------------------
console.log('\n[TEST 1] Role Normalization:');
assert(normalizeRole('RECEPTIONIST') === ROLES.RECEPTIONIST, 'Standard receptionist string');
assert(normalizeRole('receptionist') === ROLES.RECEPTIONIST, 'Lowercase receptionist string');
assert(normalizeRole({ role: 'RECEPTIONIST' }) === ROLES.RECEPTIONIST, 'Role object with role key');
assert(normalizeRole({ name: 'RECEPTIONIST' }) === ROLES.RECEPTIONIST, 'Role object with name key');
assert(normalizeRole('WAITER') === ROLES.WAITER, 'Waiter standard string');
assert(normalizeRole('waiter') === ROLES.WAITER, 'Waiter lowercase string');
assert(normalizeRole('KITCHEN_ADMIN') === ROLES.KITCHEN_ADMIN, 'Kitchen admin standard');
assert(normalizeRole('CHEF') === ROLES.KITCHEN_ADMIN, 'Chef alias normalization');
assert(normalizeRole('RESTAURANT_OWNER') === ROLES.RESTAURANT_OWNER, 'Owner standard');
assert(normalizeRole('OWNER') === ROLES.RESTAURANT_OWNER, 'Owner alias');
assert(normalizeRole('SUPER_ADMIN') === ROLES.RESTAURANT_REGISTRATION_ADMIN, 'Super admin alias');
assert(normalizeRole(null) === 'GUEST', 'Null role safety');
assert(normalizeRole(undefined) === 'GUEST', 'Undefined role safety');

// -------------------------------------------------------------
// TEST 2: Role -> Dashboard Mapping
// -------------------------------------------------------------
console.log('\n[TEST 2] Role to Dashboard Mapping:');
assert(getDefaultPathForRole(ROLES.RESTAURANT_REGISTRATION_ADMIN) === '/super-admin-dashboard', 'Admin default path');
assert(getDefaultPathForRole(ROLES.RESTAURANT_OWNER) === '/restaurant-dashboard', 'Owner default path');
assert(getDefaultPathForRole(ROLES.KITCHEN_ADMIN) === '/kitchen-dashboard', 'Kitchen default path');
assert(getDefaultPathForRole(ROLES.WAITER) === '/waiter-dashboard', 'Waiter default path');
assert(getDefaultPathForRole(ROLES.RECEPTIONIST) === '/receptionist-dashboard', 'Receptionist default path');

assert(getDefaultTabForRole(ROLES.RESTAURANT_REGISTRATION_ADMIN) === 'registration', 'Admin default tab');
assert(getDefaultTabForRole(ROLES.RESTAURANT_OWNER) === 'dashboard', 'Owner default tab');
assert(getDefaultTabForRole(ROLES.KITCHEN_ADMIN) === 'dashboard', 'Kitchen default tab');
assert(getDefaultTabForRole(ROLES.WAITER) === 'dashboard', 'Waiter default tab');
assert(getDefaultTabForRole(ROLES.RECEPTIONIST) === 'billing', 'Receptionist default tab');

// -------------------------------------------------------------
// TEST 3: Login Route Resolution (No Warning, Correct Route)
// -------------------------------------------------------------
console.log('\n[TEST 3] Normal Login Resolution:');
for (const [roleName, expectedPath, expectedTab] of [
  [ROLES.RESTAURANT_REGISTRATION_ADMIN, '/super-admin-dashboard', 'registration'],
  [ROLES.RESTAURANT_OWNER, '/restaurant-dashboard', 'dashboard'],
  [ROLES.KITCHEN_ADMIN, '/kitchen-dashboard', 'dashboard'],
  [ROLES.WAITER, '/waiter-dashboard', 'dashboard'],
  [ROLES.RECEPTIONIST, '/receptionist-dashboard', 'billing'],
]) {
  const fromLogin = resolveRoute('/login', roleName);
  assert(
    fromLogin.isAuthorized === true && fromLogin.path === expectedPath && fromLogin.tab === expectedTab && !fromLogin.warning,
    `${roleName} login from /login: authorized, path=${fromLogin.path}, no warning`
  );

  const fromRoot = resolveRoute('/', roleName);
  assert(
    fromRoot.isAuthorized === true && fromRoot.path === expectedPath && fromRoot.tab === expectedTab && !fromRoot.warning,
    `${roleName} login from /: authorized, path=${fromRoot.path}, no warning`
  );

  const transitionRes = resolveRoute('/login', roleName, { isLoginTransition: true });
  assert(
    transitionRes.isAuthorized === true && transitionRes.path === expectedPath && !transitionRes.warning,
    `${roleName} with isLoginTransition: path=${transitionRes.path}, authorized=true`
  );
}

// -------------------------------------------------------------
// TEST 4: Negative RBAC Tests (Must Reject Unauthorized Access)
// -------------------------------------------------------------
console.log('\n[TEST 4] Negative RBAC Tests:');
// 4.1 Waiter accessing receptionist dashboard
const waiterToRecep = resolveRoute('/receptionist-dashboard', ROLES.WAITER);
assert(
  waiterToRecep.isAuthorized === false &&
  waiterToRecep.path === '/waiter-dashboard' &&
  waiterToRecep.warning.includes('not authorized'),
  'Waiter accessing /receptionist-dashboard -> REJECTED & redirected to /waiter-dashboard'
);

// 4.2 Receptionist accessing kitchen dashboard
const recepToKitchen = resolveRoute('/kitchen-dashboard', ROLES.RECEPTIONIST);
assert(
  recepToKitchen.isAuthorized === false &&
  recepToKitchen.path === '/receptionist-dashboard' &&
  recepToKitchen.warning.includes('not authorized'),
  'Receptionist accessing /kitchen-dashboard -> REJECTED & redirected to /receptionist-dashboard'
);

// 4.3 Kitchen admin accessing super admin dashboard
const kitchenToSuper = resolveRoute('/super-admin-dashboard', ROLES.KITCHEN_ADMIN);
assert(
  kitchenToSuper.isAuthorized === false &&
  kitchenToSuper.path === '/kitchen-dashboard' &&
  kitchenToSuper.warning.includes('not authorized'),
  'Kitchen admin accessing /super-admin-dashboard -> REJECTED & redirected to /kitchen-dashboard'
);

// 4.4 Restaurant owner accessing super admin dashboard
const ownerToSuper = resolveRoute('/super-admin-dashboard', ROLES.RESTAURANT_OWNER);
assert(
  ownerToSuper.isAuthorized === false &&
  ownerToSuper.path === '/restaurant-dashboard' &&
  ownerToSuper.warning.includes('not authorized'),
  'Restaurant owner accessing /super-admin-dashboard -> REJECTED & redirected to /restaurant-dashboard'
);

// 4.5 Waiter accessing /governance
const waiterToGov = resolveRoute('/governance', ROLES.WAITER);
assert(
  waiterToGov.isAuthorized === false &&
  waiterToGov.path === '/waiter-dashboard' &&
  waiterToGov.warning.includes('not authorized'),
  'Waiter accessing /governance -> REJECTED & redirected to /waiter-dashboard'
);

// -------------------------------------------------------------
// TEST 5: Authorized Sub-Station Direct Access (Refresh / Direct Link)
// -------------------------------------------------------------
console.log('\n[TEST 5] Authorized Station Deep Links:');
const waiterTables = resolveRoute('/tables', ROLES.WAITER);
assert(waiterTables.isAuthorized === true && waiterTables.tab === 'tables', 'Waiter visiting /tables is authorized');

const waiterPos = resolveRoute('/pos', ROLES.WAITER);
assert(waiterPos.isAuthorized === true && waiterPos.tab === 'pos', 'Waiter visiting /pos is authorized');

const recepFloor = resolveRoute('/floor', ROLES.RECEPTIONIST);
assert(recepFloor.isAuthorized === true && recepFloor.tab === 'floor', 'Receptionist visiting /floor is authorized');

const recepPos = resolveRoute('/pos', ROLES.RECEPTIONIST);
assert(recepPos.isAuthorized === true && recepPos.tab === 'pos', 'Receptionist visiting /pos is authorized');

const ownerReports = resolveRoute('/reports', ROLES.RESTAURANT_OWNER);
assert(ownerReports.isAuthorized === true && ownerReports.tab === 'reports', 'Owner visiting /reports is authorized');

const kitchenRecipes = resolveRoute('/recipes', ROLES.KITCHEN_ADMIN);
assert(kitchenRecipes.isAuthorized === true && kitchenRecipes.tab === 'recipes', 'Kitchen visiting /recipes is authorized');

const profileRoute = resolveRoute('/profile', ROLES.WAITER);
assert(profileRoute.isAuthorized === true && profileRoute.tab === 'settings' && profileRoute.subTab === 'profile', 'Profile route is authorized for Waiter');

console.log('\n===========================================================');
if (allPassed) {
  console.log(' ALL VERIFICATION CHECKS PASSED WITH 100% ACCURACY! ');
} else {
  console.error(' SOME VERIFICATION CHECKS FAILED! ');
}
console.log('===========================================================');
