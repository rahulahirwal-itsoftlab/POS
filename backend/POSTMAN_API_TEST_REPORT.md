# Postman API Test Execution Report

> **Date:** 2026-09-29  
> **Environment:** Restaurant POS - Local Environment (`Restaurant-POS-Local.postman_environment.json`)  
> **Base URL:** `http://localhost:5000/api`  
> **Execution Engine:** Postman / Newman Automated Suite  

---

## 1. Test Summary

| Metric | Count | Percentage |
| :--- | :---: | :---: |
| **Total APIs Tested** | **103** | 100% |
| **Passed (Verified Live)** | **103** | 100% |
| **Failed** | **0** | 0% |
| **Blocked** | **0** | 0% |
| **Not Implemented (Omitted from Collection)** | **6** | Documented |

---

## 2. Granular Execution Test Results Table

| # | Method | Endpoint | Test Objective | Expected Status | Actual Status | Result |
|---|:---:|---|---|:---:|:---:|:---:|
| 1 | GET | `/api/health` | Verify server health check response | 200 | 200 | PASS |
| 2 | POST | `/api/auth/register` | Register restaurant & owner, capture ownerToken & restaurantId | 201 | 201 | PASS |
| 3 | POST | `/api/auth/login` | Authenticate Owner and return JWT | 200 | 200 | PASS |
| 4 | POST | `/api/auth/login` | Authenticate Kitchen Admin (Chef) and return JWT | 200 | 200 | PASS |
| 5 | POST | `/api/auth/login` | Authenticate Waiter and return JWT | 200 | 200 | PASS |
| 6 | POST | `/api/auth/login` | Authenticate Receptionist and return JWT | 200 | 200 | PASS |
| 7 | GET | `/api/auth/me` | Retrieve authenticated profile with restaurant info | 200 | 200 | PASS |
| 8 | GET | `/api/restaurants` | Retrieve caller's restaurant profile with entity counts | 200 | 200 | PASS |
| 9 | GET | `/api/restaurants/:id` | Retrieve restaurant by matching UUID | 200 | 200 | PASS |
| 10 | PATCH | `/api/restaurants/:id` | Update restaurant taxRate and phone | 200 | 200 | PASS |
| 11 | PUT | `/api/restaurants/:id` | Full update restaurant profile | 200 | 200 | PASS |
| 12 | POST | `/api/restaurants` | Reject creating 2nd restaurant for linked owner (409) | 409 | 409 | PASS |
| 13 | POST | `/api/users` | Create staff member with WAITER role | 201 | 201 | PASS |
| 14 | POST | `/api/users` | Reject duplicate email with 409 Conflict | 409 | 409 | PASS |
| 15 | GET | `/api/users` | Paginated list of staff members | 200 | 200 | PASS |
| 16 | GET | `/api/users/:id` | Retrieve staff member by UUID | 200 | 200 | PASS |
| 17 | PATCH | `/api/users/:id` | Update staff phone number | 200 | 200 | PASS |
| 18 | PUT | `/api/users/:id` | Full update staff details | 200 | 200 | PASS |
| 19 | PATCH | `/api/users/:id/status` | Deactivate staff account (isActive: false) | 200 | 200 | PASS |
| 20 | POST | `/api/auth/login` | Verify deactivated staff login is blocked with 403 | 403 | 403 | PASS |
| 21 | PATCH | `/api/users/:id/status` | Reactivate staff account (isActive: true) | 200 | 200 | PASS |
| 22 | POST | `/api/tables` | Create dining table T1 (capacity: 4) | 201 | 201 | PASS |
| 23 | POST | `/api/tables` | Reject duplicate tableNumber with 409 Conflict | 409 | 409 | PASS |
| 24 | GET | `/api/tables` | List dining tables with active orders | 200 | 200 | PASS |
| 25 | GET | `/api/tables?status=AVAILABLE` | Filter tables by AVAILABLE status | 200 | 200 | PASS |
| 26 | GET | `/api/tables/:id` | Retrieve single table by UUID | 200 | 200 | PASS |
| 27 | PATCH | `/api/tables/:id/status` | Transition table to OCCUPIED | 200 | 200 | PASS |
| 28 | PATCH | `/api/tables/:id/status` | Transition table to AVAILABLE | 200 | 200 | PASS |
| 29 | PATCH | `/api/tables/:id` | Update table capacity to 6 | 200 | 200 | PASS |
| 30 | PUT | `/api/tables/:id` | Full update table details | 200 | 200 | PASS |
| 31 | POST | `/api/menu/categories` | Create category "Breads" | 201 | 201 | PASS |
| 32 | POST | `/api/menu/categories` | Reject duplicate category name with 409 Conflict | 409 | 409 | PASS |
| 33 | GET | `/api/menu/categories` | List categories with item count | 200 | 200 | PASS |
| 34 | GET | `/api/menu/categories/:id` | Retrieve category with items | 200 | 200 | PASS |
| 35 | PATCH | `/api/menu/categories/:id` | Update category description | 200 | 200 | PASS |
| 36 | PUT | `/api/menu/categories/:id` | Full update category details | 200 | 200 | PASS |
| 37 | POST | `/api/inventory` | Create inventory item "Flour (Atta)" | 201 | 201 | PASS |
| 38 | POST | `/api/inventory` | Reject duplicate item name with 409 Conflict | 409 | 409 | PASS |
| 39 | GET | `/api/inventory` | List inventory items | 200 | 200 | PASS |
| 40 | GET | `/api/inventory/low-stock` | Check low stock query | 200 | 200 | PASS |
| 41 | GET | `/api/inventory/:id` | Retrieve inventory item details | 200 | 200 | PASS |
| 42 | PATCH | `/api/inventory/:id/stock` | Increment stock via adjustment (+10) | 200 | 200 | PASS |
| 43 | PATCH | `/api/inventory/:id/stock` | Reject stock adjustment exceeding current stock with 400 | 400 | 400 | PASS |
| 44 | PATCH | `/api/inventory/:id` | Update inventory costPerUnit | 200 | 200 | PASS |
| 45 | PUT | `/api/inventory/:id` | Full update inventory details | 200 | 200 | PASS |
| 46 | POST | `/api/menu/items` | Create menu item "Tandoori Roti" | 201 | 201 | PASS |
| 47 | POST | `/api/menu/items` | Reject duplicate item name with 409 Conflict | 409 | 409 | PASS |
| 48 | GET | `/api/menu/items` | List menu items | 200 | 200 | PASS |
| 49 | GET | `/api/menu/items/:id` | Retrieve menu item details | 200 | 200 | PASS |
| 50 | PATCH | `/api/menu/items/:id/availability` | Kitchen Admin toggles availability | 200 | 200 | PASS |
| 51 | PATCH | `/api/menu/items/:id` | Update menu item price | 200 | 200 | PASS |
| 52 | PUT | `/api/menu/items/:id` | Full update menu item details | 200 | 200 | PASS |
| 53 | POST | `/api/recipes` | Configure recipe with Flour (0.05 KG) | 201 | 201 | PASS |
| 54 | POST | `/api/recipes` | Reject unit mismatch (e.g. LITER for KG) with 422 | 422 | 422 | PASS |
| 55 | GET | `/api/recipes` | List recipes | 200 | 200 | PASS |
| 56 | GET | `/api/recipes/menu-item/:menuItemId`| Retrieve recipe by menuItemId | 200 | 200 | PASS |
| 57 | GET | `/api/recipes/:id` | Retrieve recipe by recipeId | 200 | 200 | PASS |
| 58 | PATCH | `/api/recipes/:id` | Update recipe instructions | 200 | 200 | PASS |
| 59 | POST | `/api/recipes/:recipeId/ingredients`| Add ingredient to recipe | 201 | 201 | PASS |
| 60 | PATCH | `/api/recipes/:recipeId/ingredients/:ingredientId`| Update ingredient quantity | 200 | 200 | PASS |
| 61 | POST | `/api/suppliers` | Create supplier "Metro Wholesale Grocers" | 201 | 201 | PASS |
| 62 | GET | `/api/suppliers` | List suppliers | 200 | 200 | PASS |
| 63 | GET | `/api/suppliers/:id` | Retrieve supplier details | 200 | 200 | PASS |
| 64 | PATCH | `/api/suppliers/:id` | Update supplier contact person | 200 | 200 | PASS |
| 65 | PUT | `/api/suppliers/:id` | Full update supplier details | 200 | 200 | PASS |
| 66 | POST | `/api/purchases` | Create purchase order (20 KG Flour) | 201 | 201 | PASS |
| 67 | GET | `/api/purchases` | List purchases | 200 | 200 | PASS |
| 68 | GET | `/api/purchases/:id` | Retrieve purchase by ID | 200 | 200 | PASS |
| 69 | PATCH | `/api/purchases/:id` | Update purchase invoice number | 200 | 200 | PASS |
| 70 | PATCH | `/api/purchases/:id/receive` | Receive purchase & restock inventory atomically | 200 | 200 | PASS |
| 71 | PATCH | `/api/purchases/:id/receive` | Reject repeat receive on RECEIVED purchase with 409 | 409 | 409 | PASS |
| 72 | PATCH | `/api/purchases/:id/cancel` | Reject cancelling RECEIVED purchase with 400 | 400 | 400 | PASS |
| 73 | POST | `/api/orders` | Waiter places dining order (table marked OCCUPIED) | 201 | 201 | PASS |
| 74 | POST | `/api/orders` | Reject order on already OCCUPIED table with 409 | 409 | 409 | PASS |
| 75 | GET | `/api/orders/active` | List active orders queue | 200 | 200 | PASS |
| 76 | GET | `/api/orders` | List all orders with filters | 200 | 200 | PASS |
| 77 | GET | `/api/orders/:id` | Retrieve order by ID | 200 | 200 | PASS |
| 78 | PATCH | `/api/orders/:id` | Update customer notes while PENDING | 200 | 200 | PASS |
| 79 | GET | `/api/kitchen/orders` | Kitchen views incoming queue | 200 | 200 | PASS |
| 80 | GET | `/api/kitchen/orders/pending`| Kitchen views pending orders | 200 | 200 | PASS |
| 81 | PATCH | `/api/kitchen/orders/:id/accept`| Kitchen accepts order (IN_PREPARATION) | 200 | 200 | PASS |
| 82 | PATCH | `/api/kitchen/orders/:id/prepare`| Kitchen startPreparation alias | 200 | 200 | PASS |
| 83 | PATCH | `/api/kitchen/items/:itemId/status`| Update individual item status to COOKING | 200 | 200 | PASS |
| 84 | PATCH | `/api/kitchen/orders/:id/ready`| Kitchen marks order READY | 200 | 200 | PASS |
| 85 | PATCH | `/api/kitchen/orders/:id/served`| Kitchen marks order SERVED | 200 | 200 | PASS |
| 86 | PATCH | `/api/kitchen/orders/:id/complete`| Complete order & deduct recipe stock from inventory | 200 | 200 | PASS |
| 87 | POST | `/api/billing/generate` | Receptionist generates bill with discount | 201 | 201 | PASS |
| 88 | POST | `/api/billing` | Alias for bill generation returns existing bill | 200 | 200 | PASS |
| 89 | GET | `/api/billing` | List bills | 200 | 200 | PASS |
| 90 | GET | `/api/billing/:id` | Retrieve bill details | 200 | 200 | PASS |
| 91 | GET | `/api/billing/order/:orderId`| Retrieve bill by orderId | 200 | 200 | PASS |
| 92 | PATCH | `/api/billing/:id` | Update bill discount | 200 | 200 | PASS |
| 93 | POST | `/api/payments` | Record cash payment (bill marked PAID, table released) | 201 | 201 | PASS |
| 94 | POST | `/api/payments` | Reject payment on already PAID bill with 400 | 400 | 400 | PASS |
| 95 | GET | `/api/payments` | List payments | 200 | 200 | PASS |
| 96 | GET | `/api/payments/:id` | Retrieve payment by ID | 200 | 200 | PASS |
| 97 | GET | `/api/payments/bill/:billId`| List payments for bill | 200 | 200 | PASS |
| 98 | POST | `/api/wastage` | Kitchen records wastage (stock decremented) | 201 | 201 | PASS |
| 99 | GET | `/api/wastage` | List wastage entries | 200 | 200 | PASS |
| 100 | GET | `/api/reports/sales` | Verify sales report calculations | 200 | 200 | PASS |
| 101 | GET | `/api/reports/orders` | Verify orders report status breakdown | 200 | 200 | PASS |
| 102 | GET | `/api/reports/payments` | Verify payments collection breakdown | 200 | 200 | PASS |
| 103 | GET | `/api/reports/inventory`| Verify stock valuation report | 200 | 200 | PASS |
