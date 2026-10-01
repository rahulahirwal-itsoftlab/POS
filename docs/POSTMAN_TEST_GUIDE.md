# Enterprise Restaurant POS - Postman Step-by-Step Testing Guide

This guide is designed for QA Engineers and Backend Developers to systematically test EVERY API endpoint implemented in the Restaurant POS Backend using Postman.

---

## 1. Quick Setup & Postman Configuration

### 1.1 Import Files into Postman
1. Open Postman.
2. Click **Import** (top left).
3. Drag & drop or select the two files generated in your workspace:
   - `Restaurant-POS-API.postman_collection.json`
   - `Restaurant-POS-Local.postman_environment.json`
4. In the top-right corner of Postman, select the environment: **"Restaurant POS - Local Environment"**.

### 1.2 Base URL Verification
The environment variable `{{baseUrl}}` is preconfigured to:
```
http://localhost:5000/api
```
*(If your server runs on another port, edit `baseUrl` in the Postman environment).*

---

## 2. Authentication Test Flow & Token Extraction

Authentication uses JWT Bearer Tokens. The Postman collection contains automated test scripts on login endpoints that capture tokens and save them to your environment.

### 2.1 Role Credentials (Development / Seed)
| Role | Email | Password | Environment Variable Stored |
| :--- | :--- | :--- | :--- |
| **RESTAURANT_OWNER** | `owner@pos.com` | `Password123` | `{{ownerToken}}` and `{{accessToken}}` |
| **KITCHEN_ADMIN** | `chef@pos.com` | `Password123` | `{{kitchenToken}}` |
| **WAITER** | `waiter@pos.com` | `Password123` | `{{waiterToken}}` |
| **RECEPTIONIST** | `receptionist@pos.com` | `Password123` | `{{receptionistToken}}` |

### 2.2 How Tokens Are Passed
All protected requests include:
```http
Authorization: Bearer {{accessToken}}
```
Or specifically:
```http
Authorization: Bearer {{ownerToken}}
Authorization: Bearer {{kitchenToken}}
Authorization: Bearer {{waiterToken}}
Authorization: Bearer {{receptionistToken}}
```

### 2.3 Postman Extraction Script (Login)
```javascript
pm.test("Login successful & token captured", function () {
    pm.response.to.have.status(200);
    var json = pm.response.json();
    pm.expect(json.success).to.be.true;
    pm.expect(json.data.token).to.be.a('string');
    pm.environment.set("accessToken", json.data.token);
    pm.environment.set("ownerToken", json.data.token);
    if (json.data.user && json.data.user.restaurantId) {
        pm.environment.set("restaurantId", json.data.user.restaurantId);
    }
});
```

---

## 3. Role-Based Permission Matrix

The table below reflects the **actual code enforcement** across all controllers and routes via `authorizeRoles(...)` middleware:

| Module / Endpoint | RESTAURANT_OWNER | KITCHEN_ADMIN | WAITER | RECEPTIONIST | Public |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `GET /api/health` |  |  |  |  |  |
| `POST /api/auth/register` |  |  |  |  |  |
| `POST /api/auth/login` |  |  |  |  |  |
| `GET /api/auth/me` |  |  |  |  | ❌ |
| `CRUD /api/users` |  | ❌ | ❌ | ❌ | ❌ |
| `GET /api/restaurants` |  |  |  |  | ❌ |
| `PATCH/PUT /api/restaurants/:id` |  | ❌ | ❌ | ❌ | ❌ |
| `GET /api/tables` |  |  |  |  | ❌ |
| `POST/DELETE /api/tables` |  | ❌ | ❌ | ❌ | ❌ |
| `PATCH /api/tables/:id/status` |  | ❌ |  |  | ❌ |
| `GET /api/menu/categories` |  |  |  |  | ❌ |
| `POST/PATCH/DELETE /api/menu/categories` |  | ❌ | ❌ | ❌ | ❌ |
| `GET /api/menu/items` |  |  |  |  | ❌ |
| `POST/PUT/DELETE /api/menu/items` |  | ❌ | ❌ | ❌ | ❌ |
| `PATCH /api/menu/items/:id/availability` |  |  | ❌ | ❌ | ❌ |
| `GET /api/recipes` |  |  |  |  | ❌ |
| `POST/PATCH/DELETE /api/recipes` |  | ❌ | ❌ | ❌ | ❌ |
| `GET /api/inventory` |  |  |  |  | ❌ |
| `POST/DELETE /api/inventory` |  | ❌ | ❌ | ❌ | ❌ |
| `PATCH /api/inventory/:id/stock` |  |  | ❌ | ❌ | ❌ |
| `CRUD /api/suppliers` |  | ❌ | ❌ | ❌ | ❌ |
| `CRUD /api/purchases` |  | ❌ | ❌ | ❌ | ❌ |
| `POST /api/orders` |  | ❌ |  |  | ❌ |
| `GET /api/orders` |  |  |  |  | ❌ |
| `PATCH /api/orders/:id` (pending update) |  | ❌ |  | ❌ | ❌ |
| `PATCH /api/orders/:id/cancel` |  | ❌ |  | ❌ | ❌ |
| `ALL /api/kitchen/...` |  |  | ❌ | ❌ | ❌ |
| `GET /api/billing` |  |  |  |  | ❌ |
| `POST/PATCH /api/billing` |  | ❌ | ❌ |  | ❌ |
| `GET /api/payments` |  |  |  |  | ❌ |
| `POST /api/payments` |  | ❌ | ❌ |  | ❌ |
| `GET /api/wastage` |  |  |  |  | ❌ |
| `POST /api/wastage` |  |  | ❌ | ❌ | ❌ |
| `DELETE /api/wastage/:id` |  | ❌ | ❌ | ❌ | ❌ |
| `GET /api/reports/...` (All Reports) |  | ❌ | ❌ | ❌ | ❌ |

---

## 4. Resource ID Dynamic Flow

Do NOT hardcode UUIDs. The Postman collection automatically chains IDs from creation responses to subsequent requests:

```
1. Register Owner / Login
   └── Captures: accessToken, ownerToken, restaurantId

2. Create Staff Members (Waiter, Chef, Receptionist)
   ├── Captures: userId
   └── Login as each to capture: waiterToken, kitchenToken, receptionistToken

3. Create Table
   └── Captures: tableId

4. Create Category & Menu Item
   ├── Captures: categoryId
   └── Captures: menuItemId

5. Create Inventory Item
   └── Captures: inventoryItemId

6. Create Recipe (linking menuItemId + inventoryItemId)
   ├── Captures: recipeId
   └── Captures: ingredientId

7. Create Supplier & Purchase
   ├── Captures: supplierId
   └── Captures: purchaseId

8. Waiter Places Order
   ├── Captures: orderId
   └── Captures: orderItemId

9. Receptionist Generates Bill
   └── Captures: billId

10. Receptionist Processes Payment
    └── Captures: paymentId

11. Kitchen Logs Wastage
    └── Captures: wastageId
```

---

## 5. Dependency-Aware 17-Phase Testing Order

Follow this exact order when testing:

### PHASE 1: Server Health
- **Endpoint:** `GET {{baseUrl}}/health`
- **Expected:** 200 OK, `{ success: true, message: "Restaurant POS API is running" }`.

### PHASE 2: Authentication
- **Step 2.1:** `POST {{baseUrl}}/auth/register` (if fresh DB) OR `POST {{baseUrl}}/auth/login` with `owner@pos.com` / `Password123`.
- **Step 2.2:** `POST {{baseUrl}}/auth/login` for Chef Marco (`chef@pos.com`) -> saves `kitchenToken`.
- **Step 2.3:** `POST {{baseUrl}}/auth/login` for Alex Waiter (`waiter@pos.com`) -> saves `waiterToken`.
- **Step 2.4:** `POST {{baseUrl}}/auth/login` for Emily Receptionist (`receptionist@pos.com`) -> saves `receptionistToken`.
- **Step 2.5:** `GET {{baseUrl}}/auth/me` -> verifies user and restaurant profile.

### PHASE 3: Restaurant Profile
- **Step 3.1:** `GET {{baseUrl}}/restaurants` -> returns restaurant profile with table and menu counts.
- **Step 3.2:** `GET {{baseUrl}}/restaurants/{{restaurantId}}` -> returns specific restaurant.
- **Step 3.3:** `PATCH {{baseUrl}}/restaurants/{{restaurantId}}` -> updates restaurant details.

### PHASE 4: Staff Users
- **Step 4.1:** `POST {{baseUrl}}/users` -> create additional staff account.
- **Step 4.2:** `GET {{baseUrl}}/users?page=1&limit=20` -> list staff.
- **Step 4.3:** `GET {{baseUrl}}/users/{{userId}}` -> get specific staff details.
- **Step 4.4:** `PATCH {{baseUrl}}/users/{{userId}}` -> update staff phone or name.
- **Step 4.5:** `PATCH {{baseUrl}}/users/{{userId}}/status` -> toggle `isActive: false`.

### PHASE 5: Dining Tables
- **Step 5.1:** `POST {{baseUrl}}/tables` -> create table `T1` (capacity 4).
- **Step 5.2:** `GET {{baseUrl}}/tables` -> list tables.
- **Step 5.3:** `GET {{baseUrl}}/tables/{{tableId}}` -> get table details.
- **Step 5.4:** `PATCH {{baseUrl}}/tables/{{tableId}}/status` -> set status to `AVAILABLE`.

### PHASE 6: Menu Categories
- **Step 6.1:** `POST {{baseUrl}}/menu/categories` -> create category "Breads".
- **Step 6.2:** `GET {{baseUrl}}/menu/categories` -> list categories.
- **Step 6.3:** `GET {{baseUrl}}/menu/categories/{{categoryId}}` -> get category.

### PHASE 7: Inventory Items
- **Step 7.1:** `POST {{baseUrl}}/inventory` -> create "Flour (Atta)" (stock: 50.0 KG, cost: 1.50).
- **Step 7.2:** `GET {{baseUrl}}/inventory` -> list inventory items.
- **Step 7.3:** `GET {{baseUrl}}/inventory/low-stock` -> verify low-stock filter.
- **Step 7.4:** `PATCH {{baseUrl}}/inventory/{{inventoryItemId}}/stock` -> test stock adjustment (`{ "adjustment": 10 }`).

### PHASE 8: Menu Items
- **Step 8.1:** `POST {{baseUrl}}/menu/items` -> create "Tandoori Roti" ($2.50, categoryId: `{{categoryId}}`).
- **Step 8.2:** `GET {{baseUrl}}/menu/items` -> list menu items.
- **Step 8.3:** `GET {{baseUrl}}/menu/items/{{menuItemId}}` -> get menu item details.
- **Step 8.4:** `PATCH {{baseUrl}}/menu/items/{{menuItemId}}/availability` -> toggle availability.

### PHASE 9: Recipes
- **Step 9.1:** `POST {{baseUrl}}/recipes` -> link "Tandoori Roti" to 0.05 KG of "Flour (Atta)".
- **Step 9.2:** `GET {{baseUrl}}/recipes/menu-item/{{menuItemId}}` -> get recipe for menu item.
- **Step 9.3:** `GET {{baseUrl}}/recipes/{{recipeId}}` -> get recipe by ID.
- **Step 9.4:** `POST {{baseUrl}}/recipes/{{recipeId}}/ingredients` -> add optional second ingredient.

### PHASE 10: Suppliers
- **Step 10.1:** `POST {{baseUrl}}/suppliers` -> create "Metro Wholesale Grocers".
- **Step 10.2:** `GET {{baseUrl}}/suppliers` -> list suppliers.
- **Step 10.3:** `GET {{baseUrl}}/suppliers/{{supplierId}}` -> get supplier details.

### PHASE 11: Purchases (Restocking Flow)
- **Step 11.1:** `POST {{baseUrl}}/purchases` -> order 20 KG of Flour from Metro Wholesale.
- **Step 11.2:** `GET {{baseUrl}}/purchases/{{purchaseId}}` -> verify status is `ORDERED`.
- **Step 11.3:** `PATCH {{baseUrl}}/purchases/{{purchaseId}}/receive` -> receives purchase, increments Flour stock by 20 KG.
- **Step 11.4:** `GET {{baseUrl}}/inventory/{{inventoryItemId}}` -> verify stock increased to 80 KG.

### PHASE 12: Orders (Waiter Flow)
- **Step 12.1:** Switch to `waiterToken`.
- **Step 12.2:** `POST {{baseUrl}}/orders` -> order 2 Tandoori Roti on table `{{tableId}}`.
- **Step 12.3:** `GET {{baseUrl}}/tables/{{tableId}}` -> verify table status is now `OCCUPIED`.
- **Step 12.4:** `GET {{baseUrl}}/orders/active` -> verify order appears in active queue.
- **Step 12.5:** `PATCH {{baseUrl}}/orders/{{orderId}}` -> update notes while in `PENDING` status.

### PHASE 13: Kitchen Lifecycle
- **Step 13.1:** Switch to `kitchenToken`.
- **Step 13.2:** `GET {{baseUrl}}/kitchen/orders` -> view incoming order in kitchen queue.
- **Step 13.3:** `PATCH {{baseUrl}}/kitchen/orders/{{orderId}}/accept` -> transitions to `IN_PREPARATION`.
- **Step 13.4:** `PATCH {{baseUrl}}/kitchen/items/{{orderItemId}}/status` -> set status to `COOKING`.
- **Step 13.5:** `PATCH {{baseUrl}}/kitchen/orders/{{orderId}}/ready` -> transitions to `READY`.
- **Step 13.6:** `PATCH {{baseUrl}}/kitchen/orders/{{orderId}}/served` -> transitions to `SERVED`.
- **Step 13.7:** `PATCH {{baseUrl}}/kitchen/orders/{{orderId}}/complete` -> completes order and atomically decrements 0.10 KG (2 * 0.05 KG) of Flour from inventory!
- **Step 13.8:** `GET {{baseUrl}}/inventory/{{inventoryItemId}}` -> verify stock was decremented.

### PHASE 14: Billing (Receptionist Flow)
- **Step 14.1:** Switch to `receptionistToken`.
- **Step 14.2:** `POST {{baseUrl}}/billing/generate` with `orderId: {{orderId}}` and `discountAmount: 0.50`.
- **Step 14.3:** Verify calculations in response:
  - Subtotal = 2 items * $2.50 = $5.00
  - Tax (5%) = $0.25
  - Discount = $0.50
  - Total = $4.75
  - Status = `UNPAID`
- **Step 14.4:** `GET {{baseUrl}}/billing/{{billId}}` -> get bill details.
- **Step 14.5:** `GET {{baseUrl}}/billing/order/{{orderId}}` -> verify order link.

### PHASE 15: Payments (Checkout Flow)
- **Step 15.1:** `POST {{baseUrl}}/payments` with `billId: {{billId}}`, `amount: 4.75`, `method: "CASH"`.
- **Step 15.2:** Verify in response:
  - Bill `status` is now `PAID`.
  - `isFullyPaid` is `true`.
  - `remainingBalance` is `0`.
- **Step 15.3:** `GET {{baseUrl}}/tables/{{tableId}}` -> verify table status is automatically restored to `AVAILABLE`!
- **Step 15.4:** `GET {{baseUrl}}/payments/bill/{{billId}}` -> list payments for bill.

### PHASE 16: Wastage
- **Step 16.1:** Switch to `kitchenToken`.
- **Step 16.2:** `POST {{baseUrl}}/wastage` -> record 1.0 KG of Flour burnt during prep.
- **Step 16.3:** `GET {{baseUrl}}/wastage` -> view wastage log.
- **Step 16.4:** Switch to `ownerToken` -> `DELETE {{baseUrl}}/wastage/{{wastageId}}` -> verify stock is restored.

### PHASE 17: Reports & Analytics
- **Step 17.1:** `GET {{baseUrl}}/reports/sales` -> verify paid bills and cash revenue.
- **Step 17.2:** `GET {{baseUrl}}/reports/orders` -> verify order counts and status breakdown.
- **Step 17.3:** `GET {{baseUrl}}/reports/payments` -> verify payment methods and total collected.
- **Step 17.4:** `GET {{baseUrl}}/reports/inventory` -> verify inventory valuation and low-stock count.
- **Step 17.5:** `GET {{baseUrl}}/reports/wastage` -> verify wastage financial loss.
- **Step 17.6:** `GET {{baseUrl}}/reports/purchases` -> verify supplier spending.

---

## 6. Business Rules & Negative Testing Cases

Test these real business constraints to verify error handling:

| # | Test Scenario | Request Details | Expected HTTP Status | Expected Error / Message |
|---|---|---|:---:|---|
| 1 | **Duplicate User Email** | `POST /api/users` with existing email | **409 Conflict** | "A user with this email address already exists" |
| 2 | **Duplicate Table Number** | `POST /api/tables` with existing `tableNumber` | **409 Conflict** | "Table 'T1' already exists in this restaurant" |
| 3 | **Order on Occupied Table** | `POST /api/orders` on table already `OCCUPIED` | **409 Conflict** | "Table is not available (current status: 'OCCUPIED')" |
| 4 | **Order Unavailable Menu Item** | `POST /api/orders` with item where `isAvailable=false` | **400 Bad Request** | "Menu item '...' is currently unavailable" |
| 5 | **Negative Item Price** | `POST /api/menu/items` with `price: -5.00` | **400 Bad Request** | "Price must be a valid non-negative number" |
| 6 | **Recipe Unit Mismatch** | `POST /api/recipes` with unit `LITER` for a `KG` inventory item | **422 Unprocessable** | "Recipe ingredient unit must match its inventory item unit" |
| 7 | **Complete Order Without Serving** | `PATCH /api/kitchen/orders/:id/complete` on order in `IN_PREPARATION` | **422 Unprocessable** | "Order can only be completed after it is served. Current status: 'IN_PREPARATION'" |
| 8 | **Insufficient Stock on Complete** | `PATCH /api/kitchen/orders/:id/complete` when recipe needs more stock than in inventory | **400 Bad Request** | "Insufficient stock for ingredient '...'. Available: X, Required: Y" |
| 9 | **Generate Bill Before Kitchen Completes** | `POST /api/billing/generate` on order in `PENDING` or `IN_PREPARATION` | **422 Unprocessable** | "Order must be completed by the kitchen before a bill can be generated" |
| 10 | **Payment Exceeding Balance** | `POST /api/payments` with amount higher than remaining balance | **422 Unprocessable** | "Payment exceeds the bill balance" |
| 11 | **Payment on Paid Bill** | `POST /api/payments` on a bill with status `PAID` | **400 Bad Request** | "Bill is already fully paid" |
| 12 | **Duplicate Payment Reference** | `POST /api/payments` with duplicate `transactionReference` on same bill | **409 Conflict** | "This transaction reference has already been recorded for the bill" |
| 13 | **Receive Purchase Twice** | `PATCH /api/purchases/:id/receive` on already `RECEIVED` purchase | **409 Conflict** | "Cannot receive a purchase with status 'RECEIVED'" |
| 14 | **Cancel Completed Order** | `PATCH /api/orders/:id/cancel` on order with status `COMPLETED` | **400 Bad Request** | "Cannot cancel a completed order" |
| 15 | **Delete Item with Order History** | `DELETE /api/menu/items/:id` on item that has past order items | **409 Conflict** | "Menu item has order history and cannot be deleted" |
| 16 | **Delete Supplier with Purchases** | `DELETE /api/suppliers/:id` on supplier with purchase history | **409 Conflict** | "Supplier has purchase history and cannot be deleted" |
| 17 | **Reset Table to AVAILABLE with Active Order** | `PATCH /api/tables/:id/status` with `AVAILABLE` while order active | **409 Conflict** | "A table with an active order cannot be marked available" |
| 18 | **Inactive User Login** | `POST /api/auth/login` with deactivated user credentials | **403 Forbidden** | "User account has been deactivated" |
| 19 | **Invalid Non-UUID Path Param** | `GET /api/tables/not-a-uuid` | **422 Unprocessable** | "id must be a UUID" |
| 20 | **Missing Authorization Token** | `GET /api/users` with no auth header | **401 Unauthorized** | "Authentication token missing or invalid" |
| 21 | **Wrong Role Access** | `POST /api/users` called with `waiterToken` | **403 Forbidden** | "Access forbidden: Role 'WAITER' is not authorized to access this resource" |
| 22 | **Cross-Restaurant Data Isolation** | User from Restaurant A requests `GET /api/tables/:id` belonging to Restaurant B | **404 Not Found** | "Table not found" |
