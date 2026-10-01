# Enterprise Restaurant POS - Postman API Testing Checklist

This checklist tracks complete validation of all backend routes, role protections, database transactions, and business rules in Postman.

---

## 1. System & Server Liveness
- [ ] Server starts cleanly via `npm run dev` / `npm start`
- [ ] Health API (`GET /api/health`) responds with 200 OK
- [ ] Base URL properly points to `http://localhost:5000/api`
- [ ] Database connectivity established with PostgreSQL (Neon)

---

## 2. Authentication & Security
- [ ] Owner Registration (`POST /api/auth/register`) creates restaurant & user atomically
- [ ] Owner Login (`POST /api/auth/login`) generates signed JWT
- [ ] Kitchen Admin Login generates token
- [ ] Waiter Login generates token
- [ ] Receptionist Login generates token
- [ ] Current User Profile (`GET /api/auth/me`) returns user data and restaurant info
- [ ] Protected APIs reject requests missing Bearer tokens with 401 Unauthorized
- [ ] Protected APIs reject invalid / malformed tokens with 401 Unauthorized
- [ ] Protected APIs reject expired tokens with 401 Unauthorized
- [ ] Wrong role rejected with 403 Forbidden (e.g. Waiter trying to access `/api/users`)
- [ ] Deactivated user login rejected with 403 Forbidden ("User account has been deactivated")
- [ ] Non-UUID path parameters rejected with 422 Unprocessable ("... must be a UUID")

---

## 3. Multi-Tenant Restaurant Isolation
- [ ] User from Restaurant A cannot access tables belonging to Restaurant B (Returns 404)
- [ ] User from Restaurant A cannot access menu items belonging to Restaurant B (Returns 404)
- [ ] User from Restaurant A cannot view orders belonging to Restaurant B (Returns 404)
- [ ] User from Restaurant A cannot generate bills for Restaurant B orders (Returns 404)
- [ ] User from Restaurant A cannot access or update Restaurant B profile (Returns 404)

---

## 4. Restaurant Profile CRUD
- [ ] `GET /api/restaurants` returns current restaurant with table/menu/user counts
- [ ] `GET /api/restaurants/:id` returns restaurant by UUID
- [ ] `PATCH /api/restaurants/:id` updates restaurant profile
- [ ] `PUT /api/restaurants/:id` updates restaurant profile
- [ ] `POST /api/restaurants` rejected if owner already has linked restaurant (409 Conflict)

---

## 5. Staff & User Management CRUD (Owner Only)
- [ ] `POST /api/users` creates new Waiter account
- [ ] `POST /api/users` creates new Kitchen Admin account
- [ ] `POST /api/users` creates new Receptionist account
- [ ] `POST /api/users` with duplicate email rejected with 409 Conflict
- [ ] `GET /api/users` lists staff members with pagination
- [ ] `GET /api/users/:id` retrieves specific staff details
- [ ] `PATCH /api/users/:id` updates staff fields
- [ ] `PUT /api/users/:id` updates staff fields
- [ ] `PATCH /api/users/:id/status` deactivates staff member (`isActive: false`)
- [ ] Deactivated staff member cannot perform protected actions
- [ ] `DELETE /api/users/:id` removes staff account

---

## 6. Dining Tables CRUD
- [ ] `POST /api/tables` creates new dining table (e.g. T1, capacity: 4)
- [ ] `POST /api/tables` with duplicate tableNumber rejected with 409 Conflict
- [ ] `GET /api/tables` lists tables with active orders
- [ ] `GET /api/tables?status=AVAILABLE` filters by status
- [ ] `GET /api/tables/:id` retrieves single table with order details
- [ ] `PATCH /api/tables/:id/status` transitions table status to OCCUPIED
- [ ] `PATCH /api/tables/:id/status` transitions table status to AVAILABLE
- [ ] `PATCH /api/tables/:id/status` rejected with 409 if active order exists on table
- [ ] `PATCH /api/tables/:id` updates table capacity and number
- [ ] `PUT /api/tables/:id` updates table details
- [ ] `DELETE /api/tables/:id` removes dining table

---

## 7. Menu Categories CRUD
- [ ] `POST /api/menu/categories` creates category (e.g. "Breads")
- [ ] `POST /api/menu/categories` duplicate category name rejected with 409 Conflict
- [ ] `GET /api/menu/categories` lists categories with item counts
- [ ] `GET /api/menu/categories/:id` retrieves category with its items
- [ ] `PATCH /api/menu/categories/:id` updates category name
- [ ] `PUT /api/menu/categories/:id` updates category details
- [ ] `DELETE /api/menu/categories/:id` deletes category (nulls menuItem foreign keys)

---

## 8. Menu Items CRUD
- [ ] `POST /api/menu/items` creates menu item (e.g. "Tandoori Roti", $2.50)
- [ ] `POST /api/menu/items` with duplicate name rejected with 409 Conflict
- [ ] `POST /api/menu/items` with non-existent categoryId rejected with 404 Not Found
- [ ] `GET /api/menu/items` lists menu items with category and recipe relations
- [ ] `GET /api/menu/items?isAvailable=true` filters available items
- [ ] `GET /api/menu/items?search=Roti` performs case-insensitive name search
- [ ] `GET /api/menu/items/:id` retrieves item with full recipe details
- [ ] `PATCH /api/menu/items/:id/availability` allows Kitchen Admin to 86 item
- [ ] `PATCH /api/menu/items/:id` updates price and description
- [ ] `PUT /api/menu/items/:id` updates menu item
- [ ] `DELETE /api/menu/items/:id` rejected with 409 Conflict if item has order history
- [ ] `DELETE /api/menu/items/:id` succeeds if item has no order history

---

## 9. Inventory Management CRUD
- [ ] `POST /api/inventory` creates raw inventory item (e.g. "Flour (Atta)", 50 KG)
- [ ] `POST /api/inventory` with duplicate name rejected with 409 Conflict
- [ ] `GET /api/inventory` lists inventory items with stock levels
- [ ] `GET /api/inventory/low-stock` returns items below threshold
- [ ] `GET /api/inventory/:id` retrieves inventory item details
- [ ] `PATCH /api/inventory/:id/stock` adjusts stock (relative increment/decrement)
- [ ] `PATCH /api/inventory/:id/stock` sets stock (absolute currentStock)
- [ ] `PATCH /api/inventory/:id/stock` rejected with 400/422 if adjustment makes stock negative
- [ ] `PATCH /api/inventory/:id` updates unit cost and SKU
- [ ] `PUT /api/inventory/:id` updates inventory item
- [ ] `DELETE /api/inventory/:id` rejected with 409 Conflict if used in recipe/purchase/wastage

---

## 10. Recipe Management CRUD
- [ ] `POST /api/recipes` configures recipe linking menu item to raw ingredients
- [ ] `POST /api/recipes` rejected with 422 if ingredient unit does not match inventory unit
- [ ] `GET /api/recipes` lists configured recipes
- [ ] `GET /api/recipes/menu-item/:menuItemId` retrieves recipe for a menu item
- [ ] `GET /api/recipes/:id` retrieves recipe by ID
- [ ] `PATCH /api/recipes/:id` updates instructions and prepTime
- [ ] `POST /api/recipes/:recipeId/ingredients` adds additional ingredient
- [ ] `POST /api/recipes/:recipeId/ingredients` rejected with 409 if ingredient already in recipe
- [ ] `PATCH /api/recipes/:recipeId/ingredients/:ingredientId` updates quantity required
- [ ] `DELETE /api/recipes/:recipeId/ingredients/:ingredientId` removes ingredient
- [ ] `DELETE /api/recipes/:id` deletes entire recipe

---

## 11. Suppliers CRUD (Owner Only)
- [ ] `POST /api/suppliers` creates supplier
- [ ] `GET /api/suppliers` lists suppliers with purchase counts
- [ ] `GET /api/suppliers/:id` retrieves supplier with purchase history
- [ ] `PATCH /api/suppliers/:id` updates contact person / phone
- [ ] `PUT /api/suppliers/:id` updates supplier
- [ ] `DELETE /api/suppliers/:id` rejected with 409 Conflict if supplier has purchases
- [ ] `DELETE /api/suppliers/:id` succeeds if supplier has no purchases

---

## 12. Purchases & Restocking Flow (Owner Only)
- [ ] `POST /api/purchases` creates purchase order in ORDERED status
- [ ] `GET /api/purchases` lists purchases with supplier and item details
- [ ] `GET /api/purchases/:id` retrieves purchase by ID
- [ ] `PATCH /api/purchases/:id` updates items before receipt
- [ ] `PATCH /api/purchases/:id/receive` receives goods and increments inventory stock in transaction
- [ ] `PATCH /api/purchases/:id/receive` rejected with 409 Conflict if received again
- [ ] `PATCH /api/purchases/:id/cancel` cancels purchase
- [ ] `PATCH /api/purchases/:id/cancel` rejected with 400 Bad Request if already RECEIVED

---

## 13. Order Flow (Waiter / Cashier)
- [ ] `POST /api/orders` places dining order with tableId
- [ ] Table status automatically transitions to OCCUPIED
- [ ] Menu item prices are snapshotted in order items
- [ ] Order on already OCCUPIED table rejected with 409 Conflict
- [ ] Order with unavailable item (`isAvailable: false`) rejected with 400 Bad Request
- [ ] Counter/Takeaway order placed without tableId (with customerName)
- [ ] `GET /api/orders/active` lists active orders
- [ ] `GET /api/orders` lists all orders with status/table/date filters
- [ ] `GET /api/orders/:id` retrieves order details
- [ ] `PATCH /api/orders/:id` updates notes while order is PENDING
- [ ] `PATCH /api/orders/:id` rejected with 409 Conflict if order is not PENDING
- [ ] `PATCH /api/orders/:id/cancel` cancels order and releases table to AVAILABLE

---

## 14. Kitchen Operations Flow (Kitchen Admin / Owner)
- [ ] `GET /api/kitchen/orders` displays queue (PENDING, IN_PREPARATION, READY)
- [ ] `GET /api/kitchen/orders/pending` displays only PENDING orders
- [ ] `PATCH /api/kitchen/orders/:id/accept` transitions order to IN_PREPARATION
- [ ] `PATCH /api/kitchen/orders/:id/prepare` transitions order to IN_PREPARATION
- [ ] `PATCH /api/kitchen/items/:itemId/status` updates item status to COOKING/READY
- [ ] `PATCH /api/kitchen/orders/:id/ready` transitions order to READY
- [ ] `PATCH /api/kitchen/orders/:id/served` transitions order to SERVED
- [ ] Invalid transitions rejected with 409 Conflict (e.g. PENDING -> READY)
- [ ] `PATCH /api/kitchen/orders/:id/complete` rejected with 422 if not SERVED
- [ ] `PATCH /api/kitchen/orders/:id/complete` rejected with 400 if inventory stock insufficient
- [ ] `PATCH /api/kitchen/orders/:id/complete` atomically deducts recipe ingredients from stock
- [ ] `PATCH /api/kitchen/orders/:id/complete` is idempotent (does not double-deduct if repeated)

---

## 15. Billing Flow (Receptionist / Owner)
- [ ] `POST /api/billing/generate` rejected with 422 if order is not COMPLETED
- [ ] `POST /api/billing/generate` computes subtotal, tax amount, discount, and total
- [ ] Unique bill number generated (`BILL-XXXXXX-XXX`)
- [ ] Repeated bill generation returns existing bill idempotently
- [ ] `GET /api/billing` lists bills with status filters (UNPAID, PAID)
- [ ] `GET /api/billing/:id` retrieves bill details
- [ ] `GET /api/billing/order/:orderId` retrieves bill by order ID
- [ ] `PATCH /api/billing/:id` updates discount amount on unpaid bill
- [ ] `PATCH /api/billing/:id` rejected with 409 Conflict if payments already recorded
- [ ] `PATCH /api/billing/:id` rejected with 400 Bad Request if bill is already PAID

---

## 16. Payment & Table Release Flow (Receptionist / Owner)
- [ ] `POST /api/payments` processes cash payment
- [ ] `POST /api/payments` processes card payment with transactionReference
- [ ] Duplicate transactionReference on same bill rejected with 409 Conflict
- [ ] Payment exceeding bill balance rejected with 422 Unprocessable
- [ ] Payment on already PAID bill rejected with 400 Bad Request
- [ ] Partial payment transitions bill to PARTIALLY_PAID
- [ ] Full payment transitions bill to PAID
- [ ] Full payment automatically releases table back to AVAILABLE
- [ ] `GET /api/payments` lists payments with method/status filters
- [ ] `GET /api/payments/:id` retrieves payment record
- [ ] `GET /api/payments/bill/:billId` lists all payments for a bill

---

## 17. Wastage Flow (Kitchen Admin / Owner)
- [ ] `POST /api/wastage` records waste and decrements inventory stock
- [ ] `POST /api/wastage` with quantity exceeding current stock rejected with 400 Bad Request
- [ ] `POST /api/wastage` with mismatched unit rejected with 422 Unprocessable
- [ ] `GET /api/wastage` lists wastage entries with recordedBy user
- [ ] `GET /api/wastage/:id` retrieves specific wastage entry
- [ ] `DELETE /api/wastage/:id` (Owner only) deletes entry and restores inventory stock

---

## 18. Reports & Analytics (Owner Only)
- [ ] `GET /api/reports/sales` calculates total revenue, taxes, discounts, and payment methods
- [ ] `GET /api/reports/orders` calculates total orders and status breakdown
- [ ] `GET /api/reports/payments` calculates total funds collected by payment method
- [ ] `GET /api/reports/inventory` calculates stock valuation and lists low-stock items
- [ ] `GET /api/reports/wastage` calculates total financial cost of waste
- [ ] `GET /api/reports/purchases` calculates total spending on suppliers
- [ ] Date filtering with `startDate` and `endDate` operates correctly on all reports
- [ ] All report endpoints reject non-owner roles with 403 Forbidden

---

## 19. Complete End-to-End Workflow Execution
- [ ] Health -> Owner Login -> Table Creation -> Category Creation -> Inventory Creation -> Recipe Creation -> Supplier Creation -> Purchase Restock -> Waiter Order -> Kitchen Complete (Stock Decrement) -> Receptionist Bill -> Payment Received -> Table Released -> Reports Verified.
