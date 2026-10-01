# Backend API Coverage & Traceability Report

> **Target Application:** Enterprise Restaurant POS Backend (Modular Monolith)  
> **Runtime Environment:** Node.js v24, Express.js 4.21, Prisma ORM 6.4, PostgreSQL (Neon)  
> **Inspection Date:** 2026-09-29  
> **Base URL:** `http://localhost:5000/api` (with `/api/v1` compatibility mounts)  

---

## 1. Executive Summary & Metric Totals

```
TOTAL REGISTERED ROUTES (PRIMARY /api) : 103
CANONICAL FUNCTIONAL OPERATIONS        : 88
IMPLEMENTED                            : 103 (100% of defined routes are fully connected)
INCOMPLETE                             : 0
BROKEN                                 : 0
MISSING PLANNED ROUTES                 : 6 (Documented in Section 5)
PUBLIC ENDPOINTS                       : 3
PROTECTED ENDPOINTS                    : 100
ROLE-PROTECTED ENDPOINTS               : 82
```

### Route Breakdown by Module (/api Prefix)
| Module | Total Routes | Public | Authenticated (Any Role) | Role-Restricted | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **01 Health** | 1 | 1 | 0 | 0 | IMPLEMENTED |
| **02 Auth** | 3 | 2 | 1 | 0 | IMPLEMENTED |
| **03 Restaurant** | 5 | 0 | 2 | 3 (Owner) | IMPLEMENTED |
| **04 Users** | 7 | 0 | 0 | 7 (Owner) | IMPLEMENTED |
| **05 Tables** | 7 | 0 | 2 | 5 (Owner/Waiter/Rec) | IMPLEMENTED |
| **06 Menu** | 13 | 0 | 4 | 9 (Owner/Kitchen) | IMPLEMENTED |
| **07 Recipes** | 12 | 0 | 4 | 8 (Owner) | IMPLEMENTED |
| **08 Inventory** | 8 | 0 | 3 | 5 (Owner/Kitchen) | IMPLEMENTED |
| **09 Suppliers** | 6 | 0 | 0 | 6 (Owner) | IMPLEMENTED |
| **10 Purchases** | 6 | 0 | 0 | 6 (Owner) | IMPLEMENTED |
| **11 Orders** | 6 | 0 | 3 | 3 (Waiter/Owner/Rec) | IMPLEMENTED |
| **12 Kitchen** | 9 | 0 | 0 | 9 (Kitchen/Owner) | IMPLEMENTED |
| **13 Billing** | 6 | 0 | 3 | 3 (Receptionist/Owner) | IMPLEMENTED |
| **14 Payments** | 4 | 0 | 3 | 1 (Receptionist/Owner) | IMPLEMENTED |
| **15 Wastage** | 4 | 0 | 2 | 2 (Kitchen/Owner) | IMPLEMENTED |
| **16 Reports** | 6 | 0 | 0 | 6 (Owner) | IMPLEMENTED |
| **Total** | **103** | **3** | **24** | **76** | **100% Implemented** |

*(Note: In addition to the 103 primary `/api` routes, Express mounts 102 corresponding alias routes under `/api/v1`, totaling 205 registered route handlers in `src/app.js`)*

---

## 2. Comprehensive Route-by-Route Traceability Matrix

Every single route was verified by tracing its source code from Express Router -> Middleware Stack -> Controller Handler -> Business Service -> Prisma ORM Model -> Neon Database Table.

| # | Endpoint | Method | Route Exists | Controller | Service | Validation Schema | Auth Required | Authorized Roles | Prisma Models | Status |
|---|---|:---:|:---:|---|---|---|:---:|---|---|:---:|
| 1 | `/api/health` | GET | YES | Inline Handler | N/A | None | NO | Public | None | IMPLEMENTED |
| 2 | `/api/auth/register` | POST | YES | `registerOwner` | `authService.registerOwner` | `validateRegisterOwner` | NO | Public | User, Restaurant | IMPLEMENTED |
| 3 | `/api/auth/login` | POST | YES | `login` | `authService.login` | `validateLogin` | NO | Public | User | IMPLEMENTED |
| 4 | `/api/auth/me` | GET | YES | `getCurrentUser` | `authService.getProfile` | None | YES | All Roles | User, Restaurant | IMPLEMENTED |
| 5 | `/api/users` | POST | YES | `createUser` | `userService.createStaff` | `validateCreateStaff` | YES | RESTAURANT_OWNER | User | IMPLEMENTED |
| 6 | `/api/users` | GET | YES | `getUsers` | `userService.getStaffList` | `validateQuery` | YES | RESTAURANT_OWNER | User | IMPLEMENTED |
| 7 | `/api/users/:id` | GET | YES | `getUserById` | `userService.getStaffById` | UUID Param | YES | RESTAURANT_OWNER | User | IMPLEMENTED |
| 8 | `/api/users/:id/status` | PATCH | YES | `updateUserStatus` | `userService.updateStaffStatus` | `validateStatusUpdate` | YES | RESTAURANT_OWNER | User | IMPLEMENTED |
| 9 | `/api/users/:id` | PATCH | YES | `updateUser` | `userService.updateStaff` | `validateUpdateStaff` | YES | RESTAURANT_OWNER | User | IMPLEMENTED |
| 10 | `/api/users/:id` | PUT | YES | `updateUser` | `userService.updateStaff` | `validateUpdateStaff` | YES | RESTAURANT_OWNER | User | IMPLEMENTED |
| 11 | `/api/users/:id` | DELETE | YES | `deleteUser` | `userService.deleteStaff` | UUID Param | YES | RESTAURANT_OWNER | User | IMPLEMENTED |
| 12 | `/api/restaurants` | POST | YES | `createRestaurant` | `restaurantService.createRestaurant` | `validateRestaurantProfile` | YES | RESTAURANT_OWNER | Restaurant, User | IMPLEMENTED |
| 13 | `/api/restaurants` | GET | YES | `getRestaurant` | `restaurantService.getRestaurantById` | None | YES | All Roles | Restaurant | IMPLEMENTED |
| 14 | `/api/restaurants/:id` | GET | YES | `getRestaurantById` | `restaurantService.getRestaurantById` | UUID Param | YES | All Roles (Own Rest.) | Restaurant | IMPLEMENTED |
| 15 | `/api/restaurants/:id` | PATCH | YES | `updateRestaurant` | `restaurantService.updateRestaurantProfile`| `validateRestaurantProfile` | YES | RESTAURANT_OWNER | Restaurant | IMPLEMENTED |
| 16 | `/api/restaurants/:id` | PUT | YES | `updateRestaurant` | `restaurantService.updateRestaurantProfile`| `validateRestaurantProfile` | YES | RESTAURANT_OWNER | Restaurant | IMPLEMENTED |
| 17 | `/api/tables` | GET | YES | `getTables` | `tableService.getTables` | `validateQuery` | YES | All Roles | Table, Order | IMPLEMENTED |
| 18 | `/api/tables/:id` | GET | YES | `getTableById` | `tableService.getTableById` | UUID Param | YES | All Roles | Table, Order, MenuItem | IMPLEMENTED |
| 19 | `/api/tables` | POST | YES | `createTable` | `tableService.createTable` | `validateTable` | YES | RESTAURANT_OWNER | Table | IMPLEMENTED |
| 20 | `/api/tables/:id/status` | PATCH | YES | `updateTableStatus`| `tableService.updateTableStatus` | `validateTableStatus` | YES | OWNER, WAITER, REC | Table, Order | IMPLEMENTED |
| 21 | `/api/tables/:id` | PATCH | YES | `updateTable` | `tableService.updateTable` | `validateTable` | YES | RESTAURANT_OWNER | Table | IMPLEMENTED |
| 22 | `/api/tables/:id` | PUT | YES | `updateTable` | `tableService.updateTable` | `validateTable` | YES | RESTAURANT_OWNER | Table | IMPLEMENTED |
| 23 | `/api/tables/:id` | DELETE | YES | `deleteTable` | `tableService.deleteTable` | UUID Param | YES | RESTAURANT_OWNER | Table | IMPLEMENTED |
| 24 | `/api/menu/categories` | GET | YES | `getCategories` | `menuService.getCategories` | `validateQuery` | YES | All Roles | MenuCategory | IMPLEMENTED |
| 25 | `/api/menu/categories/:id`| GET | YES | `getCategoryById` | `menuService.getCategoryById` | UUID Param | YES | All Roles | MenuCategory, MenuItem | IMPLEMENTED |
| 26 | `/api/menu/categories` | POST | YES | `createCategory` | `menuService.createCategory` | `validateCreateCategory` | YES | RESTAURANT_OWNER | MenuCategory | IMPLEMENTED |
| 27 | `/api/menu/categories/:id`| PATCH | YES | `updateCategory` | `menuService.updateCategory` | `validateUpdateCategory` | YES | RESTAURANT_OWNER | MenuCategory | IMPLEMENTED |
| 28 | `/api/menu/categories/:id`| PUT | YES | `updateCategory` | `menuService.updateCategory` | `validateUpdateCategory` | YES | RESTAURANT_OWNER | MenuCategory | IMPLEMENTED |
| 29 | `/api/menu/categories/:id`| DELETE | YES | `deleteCategory` | `menuService.deleteCategory` | UUID Param | YES | RESTAURANT_OWNER | MenuCategory | IMPLEMENTED |
| 30 | `/api/menu/items` | GET | YES | `getMenuItems` | `menuService.getMenuItems` | `validateQuery` | YES | All Roles | MenuItem, Recipe | IMPLEMENTED |
| 31 | `/api/menu/items/:id` | GET | YES | `getMenuItemById` | `menuService.getMenuItemById` | UUID Param | YES | All Roles | MenuItem, Recipe | IMPLEMENTED |
| 32 | `/api/menu/items` | POST | YES | `createMenuItem` | `menuService.createMenuItem` | `validateCreateMenuItem` | YES | RESTAURANT_OWNER | MenuItem, MenuCategory | IMPLEMENTED |
| 33 | `/api/menu/items/:id/availability`| PATCH | YES | `updateMenuItemAvailability` | `menuService.updateMenuItemAvailability`| `validateAvailability` | YES | OWNER, KITCHEN_ADMIN | MenuItem | IMPLEMENTED |
| 34 | `/api/menu/items/:id` | PATCH | YES | `updateMenuItem` | `menuService.updateMenuItem` | `validateUpdateMenuItem` | YES | RESTAURANT_OWNER | MenuItem | IMPLEMENTED |
| 35 | `/api/menu/items/:id` | PUT | YES | `updateMenuItem` | `menuService.updateMenuItem` | `validateUpdateMenuItem` | YES | RESTAURANT_OWNER | MenuItem | IMPLEMENTED |
| 36 | `/api/menu/items/:id` | DELETE | YES | `deleteMenuItem` | `menuService.deleteMenuItem` | UUID Param | YES | RESTAURANT_OWNER | MenuItem, OrderItem | IMPLEMENTED |
| 37 | `/api/recipes/menu-item/:menuItemId`| GET | YES | `getRecipeByMenuItem` | `recipeService.getRecipeByMenuItem`| UUID Param | YES | All Roles | Recipe, InventoryItem | IMPLEMENTED |
| 38 | `/api/recipes/:id` | GET | YES | `getRecipeById` | `recipeService.getRecipeById` | UUID Param | YES | All Roles | Recipe, InventoryItem | IMPLEMENTED |
| 39 | `/api/recipes` | GET | YES | `getRecipes` | `recipeService.getRecipes` | `validateQuery` | YES | All Roles | Recipe, InventoryItem | IMPLEMENTED |
| 40 | `/api/recipes` | POST | YES | `createRecipe` | `recipeService.createOrUpdateRecipe`| `validateRecipeSetup` | YES | RESTAURANT_OWNER | Recipe, RecipeIng, Inv | IMPLEMENTED |
| 41 | `/api/recipes/:id` | PATCH | YES | `updateRecipe` | `recipeService.updateRecipe` | `validateRecipeUpdate` | YES | RESTAURANT_OWNER | Recipe | IMPLEMENTED |
| 42 | `/api/recipes/:id` | DELETE | YES | `deleteRecipe` | `recipeService.deleteRecipe` | UUID Param | YES | RESTAURANT_OWNER | Recipe | IMPLEMENTED |
| 43 | `/api/recipes/:recipeId/ingredients`| POST | YES | `addRecipeIngredient`| `recipeService.addRecipeIngredient`| `validateAddIngredient` | YES | RESTAURANT_OWNER | Recipe, RecipeIng, Inv | IMPLEMENTED |
| 44 | `/api/recipes/:id/ingredients`| POST | YES | `addRecipeIngredient`| `recipeService.addRecipeIngredient`| `validateAddIngredient` | YES | RESTAURANT_OWNER | Recipe, RecipeIng, Inv | IMPLEMENTED |
| 45 | `/api/recipes/:recipeId/ingredients/:ingredientId`| PATCH | YES | `updateRecipeIngredient` | `recipeService.updateRecipeIngredient`| `validateRecipeIngredientUpdate`| YES | RESTAURANT_OWNER | RecipeIngredient | IMPLEMENTED |
| 46 | `/api/recipes/ingredients/:ingredientId`| PATCH | YES | `updateRecipeIngredient` | `recipeService.updateRecipeIngredient`| `validateRecipeIngredientUpdate`| YES | RESTAURANT_OWNER | RecipeIngredient | IMPLEMENTED |
| 47 | `/api/recipes/:recipeId/ingredients/:ingredientId`| DELETE | YES | `removeRecipeIngredient`| `recipeService.removeRecipeIngredient`| UUID Param | YES | RESTAURANT_OWNER | RecipeIngredient | IMPLEMENTED |
| 48 | `/api/recipes/ingredients/:ingredientId`| DELETE | YES | `removeRecipeIngredient`| `recipeService.removeRecipeIngredient`| UUID Param | YES | RESTAURANT_OWNER | RecipeIngredient | IMPLEMENTED |
| 49 | `/api/inventory/low-stock`| GET | YES | `getLowStockItems` | `inventoryService.getLowStockItems` | None | YES | All Roles | InventoryItem | IMPLEMENTED |
| 50 | `/api/inventory` | GET | YES | `getInventoryItems`| `inventoryService.getInventoryItems` | `validateQuery` | YES | All Roles | InventoryItem | IMPLEMENTED |
| 51 | `/api/inventory/:id` | GET | YES | `getInventoryItemById`| `inventoryService.getInventoryItemById`| UUID Param | YES | All Roles | InventoryItem, Recipe | IMPLEMENTED |
| 52 | `/api/inventory` | POST | YES | `createInventoryItem`| `inventoryService.createInventoryItem`| `validateCreateInventory` | YES | RESTAURANT_OWNER | InventoryItem | IMPLEMENTED |
| 53 | `/api/inventory/:id/stock`| PATCH | YES | `updateStock` | `inventoryService.updateStock` | `validateStockUpdate` | YES | OWNER, KITCHEN_ADMIN | InventoryItem | IMPLEMENTED |
| 54 | `/api/inventory/:id` | PATCH | YES | `updateInventoryItem`| `inventoryService.updateInventoryItem`| `validateInventoryUpdate`| YES | RESTAURANT_OWNER | InventoryItem | IMPLEMENTED |
| 55 | `/api/inventory/:id` | PUT | YES | `updateInventoryItem`| `inventoryService.updateInventoryItem`| `validateInventoryUpdate`| YES | RESTAURANT_OWNER | InventoryItem | IMPLEMENTED |
| 56 | `/api/inventory/:id` | DELETE | YES | `deleteInventoryItem`| `inventoryService.deleteInventoryItem`| UUID Param | YES | RESTAURANT_OWNER | InventoryItem | IMPLEMENTED |
| 57 | `/api/suppliers` | GET | YES | `getSuppliers` | `supplierService.getSuppliers` | `validateQuery` | YES | RESTAURANT_OWNER | Supplier, Purchase | IMPLEMENTED |
| 58 | `/api/suppliers/:id` | GET | YES | `getSupplierById` | `supplierService.getSupplierById` | UUID Param | YES | RESTAURANT_OWNER | Supplier, Purchase | IMPLEMENTED |
| 59 | `/api/suppliers` | POST | YES | `createSupplier` | `supplierService.createSupplier` | `validateSupplier` | YES | RESTAURANT_OWNER | Supplier | IMPLEMENTED |
| 60 | `/api/suppliers/:id` | PATCH | YES | `updateSupplier` | `supplierService.updateSupplier` | `validateSupplier` | YES | RESTAURANT_OWNER | Supplier | IMPLEMENTED |
| 61 | `/api/suppliers/:id` | PUT | YES | `updateSupplier` | `supplierService.updateSupplier` | `validateSupplier` | YES | RESTAURANT_OWNER | Supplier | IMPLEMENTED |
| 62 | `/api/suppliers/:id` | DELETE | YES | `deleteSupplier` | `supplierService.deleteSupplier` | UUID Param | YES | RESTAURANT_OWNER | Supplier, Purchase | IMPLEMENTED |
| 63 | `/api/purchases` | GET | YES | `getPurchases` | `purchaseService.getPurchases` | `validateQuery` | YES | RESTAURANT_OWNER | Purchase, Supplier | IMPLEMENTED |
| 64 | `/api/purchases/:id` | GET | YES | `getPurchaseById` | `purchaseService.getPurchaseById` | UUID Param | YES | RESTAURANT_OWNER | Purchase, PurchaseItem | IMPLEMENTED |
| 65 | `/api/purchases` | POST | YES | `createPurchase` | `purchaseService.createPurchase` | `validatePurchase` | YES | RESTAURANT_OWNER | Purchase, PurchaseItem | IMPLEMENTED |
| 66 | `/api/purchases/:id/receive`| PATCH | YES | `receivePurchase` | `purchaseService.receivePurchase` | None | YES | RESTAURANT_OWNER | Purchase, InventoryItem | IMPLEMENTED |
| 67 | `/api/purchases/:id/cancel` | PATCH | YES | `cancelPurchase` | `purchaseService.cancelPurchase` | None | YES | RESTAURANT_OWNER | Purchase | IMPLEMENTED |
| 68 | `/api/purchases/:id` | PATCH | YES | `updatePurchase` | `purchaseService.updatePurchase` | `validatePurchase` | YES | RESTAURANT_OWNER | Purchase, PurchaseItem | IMPLEMENTED |
| 69 | `/api/orders/active` | GET | YES | `getActiveOrders` | `orderService.getActiveOrders` | `validateQuery` | YES | All Roles | Order, Table, MenuItem | IMPLEMENTED |
| 70 | `/api/orders` | GET | YES | `getOrders` | `orderService.getOrders` | `validateQuery` | YES | All Roles | Order, Table, MenuItem | IMPLEMENTED |
| 71 | `/api/orders/:id` | GET | YES | `getOrderById` | `orderService.getOrderById` | UUID Param | YES | All Roles | Order, OrderItem, Bill | IMPLEMENTED |
| 72 | `/api/orders` | POST | YES | `createOrder` | `orderService.createOrder` | `validateCreateOrder` | YES | WAITER, OWNER, REC | Order, Table, MenuItem | IMPLEMENTED |
| 73 | `/api/orders/:id/cancel` | PATCH | YES | `cancelOrder` | `orderService.cancelOrder` | None | YES | WAITER, OWNER | Order, Table | IMPLEMENTED |
| 74 | `/api/orders/:id` | PATCH | YES | `updateOrder` | `orderService.updateOrder` | `validateOrderUpdate` | YES | WAITER, OWNER | Order | IMPLEMENTED |
| 75 | `/api/kitchen/orders/pending`| GET | YES | `getPendingOrders` | `kitchenService.getPendingOrders` | `validateQuery` | YES | KITCHEN_ADMIN, OWNER | Order, Table, Item | IMPLEMENTED |
| 76 | `/api/kitchen/orders` | GET | YES | `getKitchenOrders` | `kitchenService.getKitchenOrders` | `validateQuery` | YES | KITCHEN_ADMIN, OWNER | Order, Table, Item | IMPLEMENTED |
| 77 | `/api/kitchen/orders/:id/accept`| PATCH | YES | `acceptOrder` | `kitchenService.acceptOrder` | None | YES | KITCHEN_ADMIN, OWNER | Order | IMPLEMENTED |
| 78 | `/api/kitchen/orders/:id/prepare`| PATCH | YES | `startPreparation` | `kitchenService.startPreparation` | None | YES | KITCHEN_ADMIN, OWNER | Order | IMPLEMENTED |
| 79 | `/api/kitchen/orders/:id/ready`| PATCH | YES | `markOrderReady` | `kitchenService.markOrderReady` | None | YES | KITCHEN_ADMIN, OWNER | Order | IMPLEMENTED |
| 80 | `/api/kitchen/orders/:id/served`| PATCH | YES | `markOrderServed` | `kitchenService.markOrderServed` | None | YES | KITCHEN_ADMIN, OWNER | Order | IMPLEMENTED |
| 81 | `/api/kitchen/orders/:id/complete`| PATCH | YES | `completeOrder` | `kitchenService.completeOrder` | None | YES | KITCHEN_ADMIN, OWNER | Order, Recipe, Inv | IMPLEMENTED |
| 82 | `/api/kitchen/orders/:id/cancel`| PATCH | YES | `cancelKitchenOrder`| `kitchenService.cancelKitchenOrder`| None | YES | KITCHEN_ADMIN, OWNER | Order, Table | IMPLEMENTED |
| 83 | `/api/kitchen/items/:itemId/status`| PATCH | YES | `updateItemStatus` | `kitchenService.updateItemStatus` | `validateOrderItemStatus`| YES | KITCHEN_ADMIN, OWNER | OrderItem | IMPLEMENTED |
| 84 | `/api/billing/order/:orderId`| GET | YES | `getBillByOrderId` | `billingService.getBillByOrderId` | UUID Param | YES | All Roles | Bill, Order, Payment | IMPLEMENTED |
| 85 | `/api/billing/:id` | GET | YES | `getBillById` | `billingService.getBillById` | UUID Param | YES | All Roles | Bill, Order, Payment | IMPLEMENTED |
| 86 | `/api/billing` | GET | YES | `getBills` | `billingService.getBills` | `validateQuery` | YES | All Roles | Bill, Order, Payment | IMPLEMENTED |
| 87 | `/api/billing/generate` | POST | YES | `createBill` | `billingService.generateBill` | `validateGenerateBill` | YES | RECEPTIONIST, OWNER | Bill, Order, Rest | IMPLEMENTED |
| 88 | `/api/billing` | POST | YES | `createBill` | `billingService.generateBill` | `validateGenerateBill` | YES | RECEPTIONIST, OWNER | Bill, Order, Rest | IMPLEMENTED |
| 89 | `/api/billing/:id` | PATCH | YES | `updateBill` | `billingService.updateBill` | `validateBillUpdate` | YES | RECEPTIONIST, OWNER | Bill | IMPLEMENTED |
| 90 | `/api/payments/bill/:billId`| GET | YES | `getPaymentsByBill` | `paymentService.getPaymentsByBill`| UUID Param | YES | All Roles | Payment, Bill | IMPLEMENTED |
| 91 | `/api/payments/:id` | GET | YES | `getPaymentById` | `paymentService.getPaymentById` | UUID Param | YES | All Roles | Payment, Bill | IMPLEMENTED |
| 92 | `/api/payments` | GET | YES | `getPayments` | `paymentService.getPayments` | `validateQuery` | YES | All Roles | Payment, Bill | IMPLEMENTED |
| 93 | `/api/payments` | POST | YES | `createPayment` | `paymentService.processPayment` | `validatePayment` | YES | RECEPTIONIST, OWNER | Payment, Bill, Table | IMPLEMENTED |
| 94 | `/api/wastage/:id` | GET | YES | `getWastageById` | `wastageService.getWastageById` | UUID Param | YES | All Roles | Wastage, InventoryItem | IMPLEMENTED |
| 95 | `/api/wastage` | GET | YES | `getWastages` | `wastageService.getWastageList` | `validateQuery` | YES | All Roles | Wastage, InventoryItem | IMPLEMENTED |
| 96 | `/api/wastage` | POST | YES | `createWastage` | `wastageService.recordWastage` | `validateWastage` | YES | KITCHEN_ADMIN, OWNER | Wastage, InventoryItem | IMPLEMENTED |
| 97 | `/api/wastage/:id` | DELETE | YES | `deleteWastage` | `wastageService.deleteWastage` | UUID Param | YES | RESTAURANT_OWNER | Wastage, InventoryItem | IMPLEMENTED |
| 98 | `/api/reports/sales` | GET | YES | `getSalesReport` | `reportService.getSalesReport` | `validateQuery` | YES | RESTAURANT_OWNER | Bill, Payment, Order | IMPLEMENTED |
| 99 | `/api/reports/orders` | GET | YES | `getOrdersReport` | `reportService.getOrdersReport` | `validateQuery` | YES | RESTAURANT_OWNER | Order | IMPLEMENTED |
| 100 | `/api/reports/payments` | GET | YES | `getPaymentsReport` | `reportService.getPaymentsReport` | `validateQuery` | YES | RESTAURANT_OWNER | Payment, Bill | IMPLEMENTED |
| 101 | `/api/reports/inventory`| GET | YES | `getInventoryReport`| `reportService.getInventoryReport`| None | YES | RESTAURANT_OWNER | InventoryItem | IMPLEMENTED |
| 102 | `/api/reports/wastage` | GET | YES | `getWastageReport` | `reportService.getWastageReport` | `validateQuery` | YES | RESTAURANT_OWNER | Wastage, InventoryItem | IMPLEMENTED |
| 103 | `/api/reports/purchases`| GET | YES | `getPurchaseReport` | `reportService.getPurchaseReport` | `validateQuery` | YES | RESTAURANT_OWNER | Purchase, Supplier | IMPLEMENTED |

---

## 3. Error Response Analysis & 500 Root Cause Trace

The application routes all unexpected exceptions and validation failures through `src/middleware/error.middleware.js`.

### 3.1 Status Code Mapping in `error.middleware.js`
1. **400 Bad Request:**
   - Body syntax errors (malformed JSON): `SyntaxError` caught by Express JSON parser.
   - Prisma P2003 (Foreign Key Constraint Violation): "A referenced record does not exist".
   - Prisma P2000, P2006, P2011 (Value out of range or null constraint violation).
   - Empty or missing JSON body caught by `validateRequest`.
   - Business validations: negative quantities, negative stock, cancelling completed orders, insufficient stock.
2. **401 Unauthorized:**
   - Missing or malformed `Authorization: Bearer <token>` header.
   - JWT signature verification failed or token expired (`TokenExpiredError`).
   - Account deactivated (`isActive: false`) or user record deleted from database.
3. **403 Forbidden:**
   - User authenticated but lacking the required role in `authorizeRoles(...)`.
4. **404 Not Found:**
   - Route path not found (`app.js` catch-all).
   - Record not found in database or belongs to another restaurant (enforcing multi-tenant isolation).
   - Prisma P2025 (Record not found during update/delete).
5. **409 Conflict:**
   - Prisma P2002 (Unique constraint violation, e.g. duplicate email, table number, category name, inventory SKU).
   - Prisma P2034 (Concurrent modification / retryable transaction conflict).
   - Business state conflicts: transitioning orders out of sequence, receiving an already received purchase, deleting items/suppliers with active history.
6. **422 Unprocessable Entity:**
   - Parameter not a valid UUID (intercepted by `validateUuidParams` on router params).
   - Unit mismatch between recipe ingredient and inventory item.
   - Invalid date range or unsupported filter enum values in query strings (`validateQuery`).
   - Payment exceeding total balance or bill generation on unserved/incomplete order.
7. **503 Service Unavailable:**
   - Prisma initialization error (`PrismaClientInitializationError`) or database unreachable (P1001, P1000).

### 3.2 Where Can a 500 Internal Server Error Occur?
In `src/middleware/error.middleware.js`:
```javascript
const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
```
A 500 Internal Server Error only occurs if an error is thrown without a specified `statusCode`. The primary triggers in this backend are:
1. **Unconfigured JWT Secret in Production:** In `src/utils/jwt.js`, if `NODE_ENV === 'production'` and `JWT_SECRET` is less than 32 characters, `getJwtSecret()` throws an unhandled error, yielding 500.
2. **Unexpected Database Constraint / Unmapped Prisma Error:** Any Prisma error code not explicitly handled in `error.middleware.js` (such as table lock timeout or migration divergence) falls through to 500.
3. **Unexpected Null Reference in Service:** If an internal property accessor fails unexpectedly during complex calculations.

---

## 4. APIs Used by Frontend

A full recursive search was executed across the workspace root (`c:\Users\domin\Desktop\POS`) for frontend API clients (`fetch`, `axios`, `api.`, `localhost`, `http://`).

```
Result: NO FRONTEND DIRECTORY EXISTS IN THE CURRENT WORKSPACE.
The workspace contains ONLY the backend service.
```

**Frontend Integration Status:**
- Existing Frontend APIs in Workspace: **0 (None)**
- Broken Frontend Integrations: **0**
- Any future frontend connecting to this backend should consume the 88 canonical endpoints documented in `API_DOCUMENTATION.md`.

---

## 5. Planned vs Implemented Endpoints Discrepancies

| Planned / Presumed Endpoint | Status | Actual Backend Route | Reason / Architectural Detail |
| :--- | :---: | :--- | :--- |
| `POST /api/orders/:id/complete` | **NOT IMPLEMENTED** | `PATCH /api/kitchen/orders/:id/complete` | Order completion belongs to the Kitchen lifecycle and requires recipe stock deduction. |
| `POST /api/orders/:id/ready` | **NOT IMPLEMENTED** | `PATCH /api/kitchen/orders/:id/ready` | Managed under `/api/kitchen` with Kitchen Admin authorization. |
| `POST /api/tables/:id/reserve` | **NOT IMPLEMENTED** | `PATCH /api/tables/:id/status` with `{"status": "RESERVED"}` | Handled generically via table status transitions. |
| `POST /api/auth/refresh` | **NOT IMPLEMENTED** | Standard Login (`POST /api/auth/login`) | JWT tokens carry a 24-hour expiration; no token refresh mechanism is implemented. |
| `POST /api/auth/forgot-password` | **NOT IMPLEMENTED** | N/A | Password recovery requires external email service integration (not implemented). |
| `DELETE /api/orders/:id/items/:itemId` | **NOT IMPLEMENTED** | `PATCH /api/kitchen/items/:itemId/status` | Item status is updated to CANCELLED rather than deleting records from the order. |
