# POS API Testing Reference

Base URL: `http://localhost:5000/api`  
Send JSON with `Content-Type: application/json`. For protected endpoints send `Authorization: Bearer <token>`.

Use UUIDs returned by your own API. The UUIDs below are illustrative. Most list endpoints accept `page` and `limit` (default 1 and 20; maximum limit 100).

## Authentication

| Method | Endpoint | Auth / role | Body |
|---|---|---|---|
| POST | `/auth/register` | Public | Register an owner and restaurant (example below) |
| POST | `/auth/login` | Public | Login body below |
| GET | `/auth/me` | Any authenticated user | None |

Register:

```json
{
  "restaurantName": "Spice Garden",
  "name": "Sarah Owner",
  "email": "owner@example.com",
  "password": "ChangeThisPassword123",
  "phone": "+1 555 0100",
  "currency": "USD",
  "taxRate": 5
}
```

Login:

```json
{
  "email": "owner@example.com",
  "password": "ChangeThisPassword123"
}
```

Login returns `data.token` and a safe user object. Use the token as `Bearer <token>` for later requests. `POST /restaurants` is for an authenticated owner account that is not already linked to a restaurant; normal onboarding should use `/auth/register`.

## Users — `/users`

All endpoints require `RESTAURANT_OWNER`.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/users` | Create staff body below |
| GET | `/users?page=1&limit=20` | None |
| GET | `/users/:id` | None |
| PATCH / PUT | `/users/:id` | Any of `name`, `role`, `phone`, `isActive`, `password` |
| PATCH | `/users/:id/status` | `{ "isActive": false }` |
| DELETE | `/users/:id` | None |

Create staff:

```json
{
  "name": "Alex Waiter",
  "email": "waiter@example.com",
  "password": "ChangeThisPassword123",
  "role": "WAITER",
  "phone": "+1 555 0101"
}
```

Staff roles can be `KITCHEN_ADMIN`, `WAITER`, or `RECEPTIONIST`.

## Restaurants — `/restaurants`

| Method | Endpoint | Auth / role | Body |
|---|---|---|---|
| POST | `/restaurants` | Owner | Create body below; only an owner without an existing restaurant |
| GET | `/restaurants` | Any authenticated user | None; returns their restaurant |
| GET | `/restaurants/:id` | Any authenticated user | None; ID must be their restaurant |
| PATCH / PUT | `/restaurants/:id` | Owner | Any profile fields shown below |

Create:

```json
{
  "name": "Spice Garden",
  "address": "10 Main Street",
  "phone": "+1 555 0100",
  "email": "contact@example.com",
  "currency": "USD",
  "taxRate": 5
}
```

Update uses the same fields; send only fields to change. Currency is a three-letter uppercase code and tax rate is 0–100.

## Tables — `/tables`

| Method | Endpoint | Auth / role | Body |
|---|---|---|---|
| POST | `/tables` | Owner | Create body below |
| GET | `/tables?status=AVAILABLE&page=1&limit=20` | Any authenticated user | None |
| GET | `/tables/:id` | Any authenticated user | None |
| PATCH / PUT | `/tables/:id` | Owner | Any of `tableNumber`, `capacity`, `status` |
| PATCH | `/tables/:id/status` | Owner, waiter, receptionist | `{ "status": "OCCUPIED" }` |
| DELETE | `/tables/:id` | Owner | None |

```json
{
  "tableNumber": "T1",
  "capacity": 4,
  "status": "AVAILABLE"
}
```

Allowed table statuses: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `OUT_OF_SERVICE`.

## Menu — `/menu`

Category endpoints (owner writes; all authenticated roles may read):

| Method | Endpoint | Body |
|---|---|---|
| POST | `/menu/categories` | `{ "name": "Mains", "description": "Main dishes" }` |
| GET | `/menu/categories?page=1&limit=20` | None |
| GET | `/menu/categories/:id` | None |
| PATCH / PUT | `/menu/categories/:id` | Either or both of `name`, `description` |
| DELETE | `/menu/categories/:id` | None |

Menu item endpoints (owner writes except availability can also be changed by kitchen admin; all authenticated roles may read):

| Method | Endpoint | Body |
|---|---|---|
| POST | `/menu/items` | Create body below |
| GET | `/menu/items?search=roti&categoryId=<UUID>&isAvailable=true&page=1&limit=20` | None |
| GET | `/menu/items/:id` | None |
| PATCH / PUT | `/menu/items/:id` | Any of `name`, `description`, `price`, `categoryId`, `isAvailable` |
| PATCH | `/menu/items/:id/availability` | `{ "isAvailable": false }` |
| DELETE | `/menu/items/:id` | None; items with order history cannot be deleted |

```json
{
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "name": "Tandoori Roti",
  "description": "Whole wheat flatbread",
  "price": 2.5,
  "isAvailable": true
}
```

## Recipes — `/recipes`

Owner writes; any authenticated role may read. Recipe ingredient units must match the inventory item's unit.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/recipes` | Setup body below |
| GET | `/recipes?page=1&limit=20` | None |
| GET | `/recipes/:id` | None |
| GET | `/recipes/menu-item/:menuItemId` | None |
| PATCH | `/recipes/:id` | Any of `instructions`, `prepTime` |
| DELETE | `/recipes/:id` | None |
| POST | `/recipes/:recipeId/ingredients` | Ingredient body below |
| PATCH | `/recipes/:recipeId/ingredients/:ingredientId` | Any of `quantityRequired`, `unit` |
| DELETE | `/recipes/:recipeId/ingredients/:ingredientId` | None |

Create recipe:

```json
{
  "menuItemId": "00000000-0000-4000-8000-000000000002",
  "instructions": "Cook until done",
  "prepTime": 12,
  "ingredients": [
    {
      "inventoryItemId": "00000000-0000-4000-8000-000000000003",
      "quantityRequired": 0.2,
      "unit": "KG"
    }
  ]
}
```

Add ingredient:

```json
{
  "inventoryItemId": "00000000-0000-4000-8000-000000000003",
  "quantityRequired": 0.2,
  "unit": "KG"
}
```

## Inventory — `/inventory`

Owner writes, except stock adjustment is allowed to owner and kitchen admin. Any authenticated role may read.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/inventory` | Create body below |
| GET | `/inventory?search=flour&unit=KG&page=1&limit=20` | None |
| GET | `/inventory/low-stock` | None |
| GET | `/inventory/:id` | None |
| PATCH / PUT | `/inventory/:id` | Any of `name`, `sku`, `currentStock`, `minStockThreshold`, `unit`, `costPerUnit` |
| PATCH | `/inventory/:id/stock` | Set `currentStock` or send an `adjustment` |
| DELETE | `/inventory/:id` | None; referenced items cannot be deleted |

```json
{
  "name": "Flour",
  "sku": "FLOUR-001",
  "currentStock": 25,
  "minStockThreshold": 5,
  "unit": "KG",
  "costPerUnit": 2.4
}
```

Set stock: `{ "currentStock": 30 }`  
Adjust stock: `{ "adjustment": -2.5 }`

Units: `KG`, `GRAM`, `LITER`, `MILLILITER`, `PIECE`, `PACKET`, `CAN`, `BOTTLE`.

## Suppliers — `/suppliers`

Owner only.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/suppliers` | Create body below |
| GET | `/suppliers?page=1&limit=20` | None |
| GET | `/suppliers/:id` | None |
| PATCH / PUT | `/suppliers/:id` | Any of the supplier fields below |
| DELETE | `/suppliers/:id` | None; suppliers with purchases cannot be deleted |

```json
{
  "name": "Metro Wholesale",
  "contactPerson": "Taylor Smith",
  "phone": "+1 555 0110",
  "email": "orders@example.com",
  "address": "20 Industrial Road"
}
```

## Purchases — `/purchases`

Owner only.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/purchases` | Create body below |
| GET | `/purchases?supplierId=<UUID>&status=ORDERED&startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20` | None |
| GET | `/purchases/:id` | None |
| PATCH | `/purchases/:id` | Any of `supplierId`, `invoiceNumber`, `items` |
| PATCH | `/purchases/:id/receive` | None; receives once and increments inventory |
| PATCH | `/purchases/:id/cancel` | None |

```json
{
  "supplierId": "00000000-0000-4000-8000-000000000004",
  "invoiceNumber": "INV-1001",
  "items": [
    {
      "inventoryItemId": "00000000-0000-4000-8000-000000000003",
      "quantity": 10,
      "costPerUnit": 2.4
    }
  ]
}
```

Purchase update accepts the same `items` array and replaces the current items while the purchase is pending/ordered.

## Orders — `/orders`

Creation is allowed to waiter, owner, and receptionist. Reads require authentication. Update and cancellation are allowed to waiter and owner. An order needs a table or customer name and at least one menu item.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/orders` | Create body below |
| GET | `/orders?status=PENDING&tableId=<UUID>&waiterId=<UUID>&startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20` | None |
| GET | `/orders/active?page=1&limit=20` | None |
| GET | `/orders/:id` | None |
| PATCH | `/orders/:id` | Any of `notes`, `customerName`; pending orders only |
| PATCH | `/orders/:id/cancel` | None |

```json
{
  "tableId": "00000000-0000-4000-8000-000000000005",
  "customerName": "Jordan Lee",
  "notes": "No onions",
  "items": [
    {
      "menuItemId": "00000000-0000-4000-8000-000000000002",
      "quantity": 2,
      "notes": "Extra crispy"
    }
  ]
}
```

For a takeaway/counter order, omit `tableId` and provide `customerName`.

## Kitchen — `/kitchen`

Kitchen admin and owner only. Order state actions have no body. Valid flow: pending → accept/prepare → ready → served → complete. Completing deducts recipe ingredients from stock transactionally.

| Method | Endpoint | Body |
|---|---|---|
| GET | `/kitchen/orders?page=1&limit=20` | None |
| GET | `/kitchen/orders/pending?page=1&limit=20` | None |
| PATCH | `/kitchen/orders/:id/accept` | None |
| PATCH | `/kitchen/orders/:id/prepare` | None (same transition as accept) |
| PATCH | `/kitchen/orders/:id/ready` | None |
| PATCH | `/kitchen/orders/:id/served` | None |
| PATCH | `/kitchen/orders/:id/complete` | None |
| PATCH | `/kitchen/orders/:id/cancel` | None |
| PATCH | `/kitchen/items/:itemId/status` | `{ "status": "READY" }` |

Order item statuses: `PENDING`, `COOKING`, `READY`, `SERVED`, `CANCELLED`.

## Billing — `/billing`

Reads require authentication. Create/update is restricted to receptionist and owner.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/billing` or `/billing/generate` | `{ "orderId": "<UUID>", "discountAmount": 0 }` |
| GET | `/billing?status=UNPAID&page=1&limit=20` | None |
| GET | `/billing/:id` | None |
| GET | `/billing/order/:orderId` | None |
| PATCH | `/billing/:id` | `{ "discountAmount": 5 }`; only before payments are recorded |

The kitchen must complete the order before the bill can be generated.

## Payments — `/payments`

Reads require authentication. Creation is restricted to receptionist and owner.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/payments` | Payment body below |
| GET | `/payments?method=CASH&status=COMPLETED&startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20` | None |
| GET | `/payments/:id` | None |
| GET | `/payments/bill/:billId` | None |

```json
{
  "billId": "00000000-0000-4000-8000-000000000006",
  "amount": 25.5,
  "method": "CASH",
  "transactionReference": "POS-CASH-1001"
}
```

Methods: `CASH`, `CARD`, `UPI`, `NET_BANKING`, `OTHER`. Amount must be positive and cannot exceed the remaining balance. A reference may be omitted for cash.

## Wastage — `/wastage`

Read requires authentication; create is owner/kitchen admin; delete is owner only. Unit must match the inventory item's unit.

| Method | Endpoint | Body |
|---|---|---|
| POST | `/wastage` | Body below |
| GET | `/wastage?startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20` | None |
| GET | `/wastage/:id` | None |
| DELETE | `/wastage/:id` | None; restores the recorded stock |

```json
{
  "inventoryItemId": "00000000-0000-4000-8000-000000000003",
  "quantity": 1.25,
  "unit": "KG",
  "reason": "Spoiled during storage"
}
```

## Reports — `/reports`

Owner only; all are GET requests with no body. Date filters use `startDate` and `endDate`; lists can use `page` and `limit`.

| Endpoint | Additional query filters |
|---|---|
| `/reports/sales` | `startDate`, `endDate` |
| `/reports/orders` | `startDate`, `endDate`, `status` |
| `/reports/payments` | `startDate`, `endDate`, `method` |
| `/reports/inventory` | None |
| `/reports/wastage` | `startDate`, `endDate` |
| `/reports/purchases` | `startDate`, `endDate` |

Health check: `GET /api/health` is public and has no body.

## Common error cases

- Missing, expired, or invalid bearer token: `401`.
- Authenticated user with the wrong role: `403`.
- Invalid body, UUID, query, or date: `422`.
- Resource outside the caller's restaurant or not found: `404`.
- Duplicate records, invalid state transition, or repeat receive: `409`.
- Stock shortage while completing an order or recording wastage: request rejected; transactional stock changes roll back.

Successful responses use `{ "success": true, "message": "...", "data": ... }`; list responses also include `meta`. Errors use `{ "success": false, "message": "...", "errors": [] }`.
