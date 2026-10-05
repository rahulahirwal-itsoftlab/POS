# Enterprise Restaurant POS Backend - Complete API Documentation

> **Document Version:** 1.0.0  
> **Source of Truth:** Inspected from actual Node.js/Express controllers, services, middleware, routes, and Prisma schema.  
> **Base URL:** `http://localhost:5000/api` (also mounted under `/api/v1`)  
> **Environment Variable:** `{{baseUrl}}` = `http://localhost:5000/api`  

---

## 1. Architectural & Protocol Overview

The backend is built as a modular monolith in Express.js with Prisma ORM connecting to PostgreSQL (Neon).
Every endpoint strictly adheres to a centralized response structure, role-based authorization, and tenant isolation.

### 1.1 Standard Success Envelope
All successful requests return HTTP 200 or 201 with this JSON envelope (defined in `src/utils/response.js`):
```json
{
  "success": true,
  "message": "Operation successful description",
  "data": {}
}
```
For paginated collection queries (defined in `src/utils/pagination.js`), `data` is an array and a top-level `meta` object is included:
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```
*Default pagination:* `page=1`, `limit=20` (maximum limit capped at `100`).

### 1.2 Standard Error Envelope
All error responses adhere to the centralized error middleware format (`src/middleware/error.middleware.js`):
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    "Specific error item or validation failure detail"
  ]
}
```

### 1.3 HTTP Status Codes Produced by the Backend
| Code | Meaning | Backend Source |
| :--- | :--- | :--- |
| **200 OK** | Successful retrieval, update, or state transition | Controller / Service |
| **201 Created** | Successful creation of a new entity | Controller / Service |
| **400 Bad Request** | Request body empty/malformed JSON, validation failure, business violation | Validation / Error Middleware |
| **401 Unauthorized** | Missing, invalid, expired JWT bearer token, deactivated account | `auth.middleware.js` |
| **403 Forbidden** | User role not authorized for the requested resource | `role.middleware.js` |
| **404 Not Found** | Record does not exist, or belongs to another restaurant | Controllers / Services / `app.js` |
| **409 Conflict** | Unique constraint violation (P2002), duplicate record, invalid state transition | Services / Prisma Error Handler |
| **422 Unprocessable** | Invalid UUID parameter, unit mismatch, invalid date range | `resource.validation.js` / `validation.middleware.js` |
| **500 Server Error** | Unexpected unhandled exceptions, database runtime failures | `error.middleware.js` |
| **503 Unavailable** | Neon database connection/initialization failure (P1001/P1000) | `error.middleware.js` |

---

## 2. Authentication & Role-Based Authorization

### 2.1 Authentication Flow
1. Login via `POST /api/auth/login` with email and password.
2. The response returns `data.token` (signed with `JWT_SECRET`, valid for `1d`).
3. Pass the token in the `Authorization` header for all protected endpoints:
   ```http
   Authorization: Bearer {{accessToken}}
   ```

### 2.2 Two-Level Administration Hierarchy & System Roles
The system implements a strict **Two-Level Administration Hierarchy** with 5 distinct roles (Prisma Enum `Role`):

#### Level 1: Platform Administration
- `RESTAURANT_REGISTRATION_ADMIN`: High-level platform onboarding and governance authority.
  - Registers new restaurants and creates their initial Owner accounts.
  - Provisions and resets Owner credentials.
  - Activates or deactivates (suspends) restaurants. Deactivating an establishment immediately cuts off system access (HTTP 403 Forbidden) for all associated users.
  - Does NOT participate in daily restaurant operations (cannot take orders, manage kitchen tickets, or bill tables for individual restaurants).

#### Level 2: Restaurant Operations Administration
- `RESTAURANT_OWNER`: Full administrative and operational command over their isolated restaurant tenant (`restaurantId`).
  - Dynamically provisions staff members (Waiters, Kitchen Admins, Receptionists) without artificial limits.
  - Manages Dining Tables, Floor Layout, Menu Categories, Menu Items, and Recipe BOMs.
  - Controls Inventory, Stock Thresholds, Suppliers, Purchase Orders, and Wastage Spoilage Logs.
  - Reviews complete Financial Statements and chronological Money In vs Money Out cashflow ledgers.

#### Operational Roles
- `KITCHEN_ADMIN`: Live Kitchen Display System (KDS) checkpoint. Cross-checks ordered items against auto-calculated recipe ingredient requirements ($\text{ordered qty} \times \text{recipe ingredient qty}$) with stock sufficiency warnings. Transitions order lifecycles (`PENDING` ➔ `IN_PREPARATION` ➔ `READY` ➔ `SERVED` ➔ `COMPLETED`) and automatically depletes recipe ingredient inventory upon completion.
- `WAITER`: Terminal & floor table order taker. Can **add items multiple times** to an active table session before final billing. Views real-time food readiness and bill settlement status for customer handoff.
- `RECEPTIONIST`: Billing cashier. Generates invoices strictly for kitchen-cleared completed orders, calculates tax and custom discounts, processes multi-method payment settlements (`CASH`, `CARD`, `UPI`, `NET_BANKING`), and automatically releases dining tables to `AVAILABLE`.

### 2.3 Multi-Tenant Restaurant Isolation
- When a user logs in, their JWT payload contains `userId`, `role`, and `restaurantId`.
- Authentication middleware populates `req.user` directly from the database: `{ id, restaurantId, name, email, role, isActive }`.
- Every database query in services filters by `where: { restaurantId: req.user.restaurantId }` or verifies ownership.
- Cross-tenant access attempt: Returns **404 Not Found** (preventing resource enumeration across restaurants).

---

## 3. Complete Module-by-Module API Inventory & Reference

### Module 00: Platform Registration Administration (`/api/registration-admin`)
Guarded by `authorizeRoles('RESTAURANT_REGISTRATION_ADMIN')`. Platform Super Admin only.

#### 1. POST /api/registration-admin/restaurants
- **Description:** Onboards a brand new restaurant tenant and automatically creates the initial Level 2 Restaurant Owner account in an atomic transaction.
- **Authentication:** Bearer Token (`RESTAURANT_REGISTRATION_ADMIN`)
- **Headers:** `Content-Type: application/json`
- **Request Body (supports flat or nested):**
  ```json
  {
    "name": "Bukhara Heritage Dining",
    "address": "ITC Maurya, Diplomatic Enclave, New Delhi",
    "currency": "₹",
    "taxRate": 5.0,
    "owner": {
      "name": "Kunwar Rathore",
      "email": "owner.heritage@pos.com",
      "password": "Password123",
      "phone": "+91 9829012345"
    }
  }
  ```
- **Expected Success Status:** `201 Created`
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Restaurant and owner onboarded successfully",
    "data": {
      "restaurant": {
        "id": "ecbdbcd0-b2ad-42c4-9726-7e4ddc0a63cd",
        "name": "Bukhara Heritage Dining",
        "currency": "₹",
        "taxRate": "5.00",
        "isActive": true
      },
      "owner": {
        "id": "user-uuid",
        "name": "Kunwar Rathore",
        "email": "owner.heritage@pos.com",
        "role": "RESTAURANT_OWNER"
      }
    }
  }
  ```

#### 2. GET /api/registration-admin/restaurants
- **Description:** Retrieves all onboarded restaurants across the platform, with owner profile and counts of staff, dining tables, and menu items.
- **Authentication:** Bearer Token (`RESTAURANT_REGISTRATION_ADMIN`)
- **Query Parameters:** `search` (optional), `isActive` (optional boolean)
- **Expected Success Status:** `200 OK`

#### 3. GET /api/registration-admin/restaurants/:id
- **Description:** Retrieves detailed configuration and owner information for a specific restaurant tenant.
- **Authentication:** Bearer Token (`RESTAURANT_REGISTRATION_ADMIN`)
- **Expected Success Status:** `200 OK`

#### 4. PATCH /api/registration-admin/restaurants/:id/status
- **Description:** Activates or suspends a restaurant tenant. Suspended restaurants immediately block login and API operations with HTTP 403 Forbidden.
- **Authentication:** Bearer Token (`RESTAURANT_REGISTRATION_ADMIN`)
- **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```
- **Expected Success Status:** `200 OK`

#### 5. POST /api/registration-admin/restaurants/:id/owner
- **Description:** Resets or updates login credentials (email and/or password) for a restaurant's owner.
- **Authentication:** Bearer Token (`RESTAURANT_REGISTRATION_ADMIN`)
- **Request Body:**
  ```json
  {
    "newEmail": "new.owner@pos.com",
    "newPassword": "NewSecurePassword123"
  }
  ```
- **Expected Success Status:** `200 OK`

---

### Module 01: Health & System

#### 1. GET /api/health
- **Description:** System health check endpoint. Confirms Express HTTP listener is active.
- **Authentication:** Public (No token required)
- **Role:** Public
- **Headers:** None
- **Query / Path Parameters:** None
- **Request Body:** None
- **Expected Success Status:** `200 OK`
- **Expected Success Response:**
  ```json
  {
    "success": true,
    "message": "Restaurant POS API is running"
  }
  ```
- **Expected Errors:** None

---

### Module 02: Authentication (`/api/auth`)

#### 2. POST /api/auth/register
- **Description:** Onboards a new restaurant owner and automatically creates their restaurant in an atomic database transaction.
- **Authentication:** Public
- **Role:** Public
- **Headers:** `Content-Type: application/json`
- **Validation Schema:** `validateRegisterOwner`
- **Request Body:**
  ```json
  {
    "restaurantName": "Spice Garden POS",
    "name": "Sarah Owner",
    "email": "owner@pos.com",
    "password": "Password123",
    "phone": "+1 555-0101",
    "currency": "USD",
    "taxRate": 5.0
  }
  ```
- **Body Constraints:**
  - `restaurantName` (or `restaurant_name`): Required string, max 150 chars.
  - `name`: Required string, max 120 chars.
  - `email`: Required valid email address, max 254 chars.
  - `password`: Required string, minimum 6 characters.
  - `phone`: Optional string.
  - `currency`: Optional 3-letter currency code (defaults to "USD").
  - `taxRate`: Optional decimal percentage (defaults to 5.0).
- **Prisma Models:** `Restaurant`, `User` (`prisma.$transaction`)
- **Expected Success Status:** `201 Created`
- **Expected Success Response:**
  ```json
  {
    "success": true,
    "message": "Restaurant and owner account registered successfully",
    "data": {
      "user": {
        "id": "c1f7a0e2-...",
        "restaurantId": "d3b8b1e4-...",
        "name": "Sarah Owner",
        "email": "owner@pos.com",
        "role": "RESTAURANT_OWNER",
        "phone": "+1 555-0101",
        "isActive": true,
        "createdAt": "2026-09-29T12:00:00.000Z"
      },
      "restaurant": {
        "id": "d3b8b1e4-...",
        "name": "Spice Garden POS",
        "address": null,
        "phone": "+1 555-0101",
        "email": "owner@pos.com",
        "currency": "USD",
        "taxRate": "5.00",
        "createdAt": "2026-09-29T12:00:00.000Z",
        "updatedAt": "2026-09-29T12:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Expected Errors:**
  - `400 Bad Request`: Missing/invalid fields or empty body.
  - `409 Conflict`: Email is already registered.

#### 3. POST /api/auth/login
- **Description:** Authenticates any registered user (Owner, Chef, Waiter, Receptionist) and returns a signed JWT.
- **Authentication:** Public
- **Role:** Public
- **Headers:** `Content-Type: application/json`
- **Validation Schema:** `validateLogin`
- **Request Body:**
  ```json
  {
    "email": "owner@pos.com",
    "password": "Password123"
  }
  ```
- **Body Constraints:**
  - `email`: Required valid email address.
  - `password`: Required string.
- **Prisma Models:** `User` (`findUnique`)
- **Expected Success Status:** `200 OK`
- **Expected Success Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "c1f7a0e2-...",
        "name": "Sarah Owner",
        "email": "owner@pos.com",
        "role": "RESTAURANT_OWNER",
        "restaurantId": "d3b8b1e4-..."
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Expected Errors:**
  - `400 Bad Request`: Validation failed / malformed JSON.
  - `401 Unauthorized`: Invalid email or password.
  - `403 Forbidden`: User account has been deactivated.

#### 4. GET /api/auth/me
- **Description:** Returns the profile and restaurant details of the currently authenticated user.
- **Authentication:** Required (`Bearer {{accessToken}}`)
- **Role:** All authenticated roles
- **Headers:** `Authorization: Bearer {{accessToken}}`
- **Request Body:** None
- **Prisma Models:** `User` (`findUnique` with `restaurant: true`)
- **Expected Success Status:** `200 OK`
- **Expected Success Response:**
  ```json
  {
    "success": true,
    "message": "Current authenticated user profile retrieved",
    "data": {
      "id": "c1f7a0e2-...",
      "restaurantId": "d3b8b1e4-...",
      "name": "Sarah Owner",
      "email": "owner@pos.com",
      "role": "RESTAURANT_OWNER",
      "phone": "+1 555-0101",
      "isActive": true,
      "createdAt": "2026-09-29T12:00:00.000Z",
      "restaurant": {
        "id": "d3b8b1e4-...",
        "name": "Spice Garden POS",
        "address": "123 Gourmet Street",
        "phone": "+1 555-0199",
        "email": "contact@spicegarden.com",
        "currency": "USD",
        "taxRate": "5.00",
        "createdAt": "2026-09-29T12:00:00.000Z",
        "updatedAt": "2026-09-29T12:00:00.000Z"
      }
    }
  }
  ```
- **Expected Errors:** `401 Unauthorized` (invalid/expired token), `404 Not Found` (account deleted).

---

### Module 03: Restaurant Profile (`/api/restaurants`)

#### 5. GET /api/restaurants
- **Description:** Returns the restaurant profile linked to the authenticated user.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Prisma Models:** `Restaurant` (`findUnique` with counts of tables, menuItems, users, orders)
- **Expected Success Status:** `200 OK`

#### 6. GET /api/restaurants/:id
- **Description:** Returns restaurant profile by ID. Strictly enforces that `:id` matches caller's `restaurantId`.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`
- **Expected Errors:** `404 Not Found` (if `:id` does not match caller's restaurant), `422 Unprocessable` (invalid UUID).

#### 7. PATCH /api/restaurants/:id (and PUT /api/restaurants/:id)
- **Description:** Updates the restaurant details (name, address, phone, email, currency, taxRate).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer {{ownerToken}}`
- **Path Parameters:** `id` (UUID)
- **Request Body:**
  ```json
  {
    "name": "Spice Garden Fine Dining",
    "address": "123 Gourmet Street, Foodville",
    "phone": "+1 555-0199",
    "email": "contact@spicegarden.com",
    "currency": "USD",
    "taxRate": 6.50
  }
  ```
- **Body Constraints:** At least one field required. `currency` must be 3-letter uppercase. `taxRate` between 0 and 100.
- **Expected Success Status:** `200 OK`
- **Expected Errors:** `400 Bad Request`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable`.

#### 8. POST /api/restaurants
- **Description:** Creates a restaurant profile for an authenticated owner not yet linked to one.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Request Body:** Same as restaurant registration.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `409 Conflict` (if owner already has a restaurant).

---

### Module 04: Users & Staff Management (`/api/users`)

#### 9. POST /api/users
- **Description:** Creates a staff member account (Waiter, Kitchen Admin, Receptionist) scoped to owner's restaurant.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Validation Schema:** `validateCreateStaff`
- **Request Body:**
  ```json
  {
    "name": "Alex Waiter",
    "email": "waiter@pos.com",
    "password": "Password123",
    "role": "WAITER",
    "phone": "+1 555-0103"
  }
  ```
- **Body Constraints:**
  - `role`: Must be one of `KITCHEN_ADMIN`, `WAITER`, `RECEPTIONIST`.
  - `password`: Minimum 6 characters.
  - `email`: Unique email address.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `403 Forbidden`, `409 Conflict` (email already exists).

#### 10. GET /api/users
- **Description:** Returns paginated list of staff members in caller's restaurant.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Query Parameters:** `page` (default 1), `limit` (default 20, max 100).
- **Expected Success Status:** `200 OK`

#### 11. GET /api/users/:id
- **Description:** Retrieves details of a specific staff member.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`
- **Expected Errors:** `404 Not Found`, `422 Unprocessable`.

#### 12. PATCH /api/users/:id/status
- **Description:** Activates or deactivates a staff member account.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Path Parameters:** `id` (UUID)
- **Request Body:**
  ```json
  {
    "isActive": false
  }
  ```
- **Expected Success Status:** `200 OK`

#### 13. PATCH /api/users/:id (and PUT /api/users/:id)
- **Description:** Updates staff details (name, role, phone, isActive, password).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Path Parameters:** `id` (UUID)
- **Request Body:**
  ```json
  {
    "name": "Alex Waiter Senior",
    "phone": "+1 555-0199"
  }
  ```
- **Expected Success Status:** `200 OK`

#### 14. DELETE /api/users/:id
- **Description:** Deletes a staff member account from the restaurant.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`

---

### Module 05: Tables (`/api/tables`)

#### 15. POST /api/tables
- **Description:** Creates a dining table with table number, capacity, and initial status.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Validation Schema:** `validateTable`
- **Request Body:**
  ```json
  {
    "tableNumber": "T1",
    "capacity": 4,
    "status": "AVAILABLE"
  }
  ```
- **Body Constraints:**
  - `tableNumber`: Required non-empty string <= 30 chars. Unique per restaurant.
  - `capacity`: Positive integer between 1 and 1000 (default 4).
  - `status`: One of `AVAILABLE`, `OCCUPIED`, `RESERVED`, `OUT_OF_SERVICE` (default `AVAILABLE`).
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `409 Conflict` (tableNumber already exists).

#### 16. GET /api/tables
- **Description:** Lists restaurant dining tables, including their active order summaries.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Query Parameters:** `status` (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `OUT_OF_SERVICE`), `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 17. GET /api/tables/:id
- **Description:** Retrieves detailed table information, including full active order history.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`

#### 18. PATCH /api/tables/:id/status
- **Description:** Quick status transition for a dining table (e.g. marking OCCUPIED or AVAILABLE).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`, `WAITER`, `RECEPTIONIST`
- **Path Parameters:** `id` (UUID)
- **Request Body:**
  ```json
  {
    "status": "OCCUPIED"
  }
  ```
- **Business Rule:** If transitioning to `AVAILABLE` while an active order exists on this table (status not COMPLETED or CANCELLED), returns `409 Conflict` ("A table with an active order cannot be marked available").
- **Expected Success Status:** `200 OK`

#### 19. PATCH /api/tables/:id (and PUT /api/tables/:id)
- **Description:** Updates table configuration (tableNumber, capacity, status).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 20. DELETE /api/tables/:id
- **Description:** Removes a dining table.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

---

### Module 06: Menu & Categories (`/api/menu`)

#### 21. POST /api/menu/categories
- **Description:** Creates a menu category (e.g. Starters, Main Course, Breads, Desserts, Beverages).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Request Body:**
  ```json
  {
    "name": "Breads",
    "description": "Clay oven tandoori flatbreads"
  }
  ```
- **Body Constraints:** `name` required string <= 100 chars, unique per restaurant.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `409 Conflict` (Category name already exists).

#### 22. GET /api/menu/categories
- **Description:** Lists menu categories with count of items in each category.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 23. GET /api/menu/categories/:id
- **Description:** Retrieves category with all its associated menu items.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 24. PATCH /api/menu/categories/:id (and PUT /api/menu/categories/:id)
- **Description:** Updates category name or description.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 25. DELETE /api/menu/categories/:id
- **Description:** Deletes a menu category. (Linked menu items have their `categoryId` set to null).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 26. POST /api/menu/items
- **Description:** Creates a menu item.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Validation Schema:** `validateCreateMenuItem`
- **Request Body:**
  ```json
  {
    "categoryId": "category-uuid",
    "name": "Tandoori Roti",
    "description": "Crisp whole wheat flatbread",
    "price": 2.50,
    "isAvailable": true
  }
  ```
- **Body Constraints:**
  - `name`: Required string, unique per restaurant.
  - `price`: Required non-negative number.
  - `categoryId`: Optional UUID (must belong to caller's restaurant).
  - `isAvailable`: Optional boolean (default true).
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `404 Not Found` (category not found), `409 Conflict` (item name exists).

#### 27. GET /api/menu/items
- **Description:** Lists menu items with category details and recipe ingredient relations.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Query Parameters:** `search` (substring search on name), `categoryId`, `isAvailable` (`true`|`false`), `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 28. GET /api/menu/items/:id
- **Description:** Retrieves single menu item with complete recipe definition and ingredients.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 29. PATCH /api/menu/items/:id/availability
- **Description:** Toggles item in-stock/availability status (useful for kitchen when 86'd).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`, `KITCHEN_ADMIN`
- **Path Parameters:** `id` (UUID)
- **Request Body:**
  ```json
  {
    "isAvailable": false
  }
  ```
- **Expected Success Status:** `200 OK`

#### 30. PATCH /api/menu/items/:id (and PUT /api/menu/items/:id)
- **Description:** Updates menu item details (name, description, price, categoryId, isAvailable).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 31. DELETE /api/menu/items/:id
- **Description:** Deletes a menu item.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Business Rule:** If the item has historical order items, deletion is blocked with `409 Conflict` ("Menu item has order history and cannot be deleted").
- **Expected Success Status:** `200 OK`

---

### Module 07: Recipe Management (`/api/recipes`)

#### 32. POST /api/recipes
- **Description:** Configures or updates the recipe for a menu item with its list of required raw ingredients.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Validation Schema:** `validateRecipeSetup`
- **Request Body:**
  ```json
  {
    "menuItemId": "menu-item-uuid",
    "instructions": "Roll dough thin and bake in clay tandoor until crisp",
    "prepTime": 8,
    "ingredients": [
      {
        "inventoryItemId": "inventory-item-uuid",
        "quantityRequired": 0.05,
        "unit": "KG"
      }
    ]
  }
  ```
- **Body Constraints:**
  - `menuItemId`: Required UUID.
  - `ingredients`: Non-empty array of objects with `inventoryItemId` (UUID), `quantityRequired` (> 0), and `unit` (one of `KG`, `GRAM`, `LITER`, `MILLILITER`, `PIECE`, `PACKET`, `CAN`, `BOTTLE`).
  - **Unit Enforcement:** The ingredient's unit MUST match the inventory item's unit exactly. Otherwise returns `422 Unprocessable`.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `404 Not Found`, `422 Unprocessable` (unit mismatch).

#### 33. GET /api/recipes
- **Description:** Lists all configured recipes in the restaurant with ingredients and inventory item details.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 34. GET /api/recipes/menu-item/:menuItemId
- **Description:** Retrieves the recipe associated with a specific menu item.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Path Parameters:** `menuItemId` (UUID)
- **Expected Success Status:** `200 OK`
- **Expected Errors:** `404 Not Found` (Recipe not found for this menu item).

#### 35. GET /api/recipes/:id
- **Description:** Retrieves recipe by recipe ID.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 36. PATCH /api/recipes/:id
- **Description:** Updates recipe instructions and prep time.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Request Body:** `{ "instructions": "...", "prepTime": 10 }`
- **Expected Success Status:** `200 OK`

#### 37. DELETE /api/recipes/:id
- **Description:** Deletes a recipe and its ingredient definitions.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 38. POST /api/recipes/:recipeId/ingredients (and POST /api/recipes/:id/ingredients)
- **Description:** Adds an additional raw ingredient to an existing recipe.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Request Body:**
  ```json
  {
    "inventoryItemId": "inventory-item-uuid",
    "quantityRequired": 0.02,
    "unit": "KG"
  }
  ```
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `409 Conflict` (Ingredient already exists in recipe; update quantity instead), `422 Unprocessable` (Unit mismatch).

#### 39. PATCH /api/recipes/:recipeId/ingredients/:ingredientId (and PATCH /api/recipes/ingredients/:ingredientId)
- **Description:** Updates required quantity or unit of a recipe ingredient.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 40. DELETE /api/recipes/:recipeId/ingredients/:ingredientId (and DELETE /api/recipes/ingredients/:ingredientId)
- **Description:** Removes an ingredient from a recipe.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

---

### Module 08: Inventory (`/api/inventory`)

#### 41. POST /api/inventory
- **Description:** Creates an inventory raw item/ingredient.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Validation Schema:** `validateCreateInventory`
- **Request Body:**
  ```json
  {
    "name": "Flour (Atta)",
    "sku": "INV-FLOUR-01",
    "currentStock": 50.0,
    "minStockThreshold": 10.0,
    "unit": "KG",
    "costPerUnit": 1.50
  }
  ```
- **Body Constraints:**
  - `name`: Required string, unique per restaurant.
  - `unit`: Required enum (`KG`, `GRAM`, `LITER`, `MILLILITER`, `PIECE`, `PACKET`, `CAN`, `BOTTLE`).
  - `currentStock`, `minStockThreshold`, `costPerUnit`: Non-negative numbers.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `409 Conflict` (Inventory item name already exists).

#### 42. GET /api/inventory
- **Description:** Lists inventory items with current stock, threshold, and cost.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Query Parameters:** `search`, `unit`, `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 43. GET /api/inventory/low-stock
- **Description:** Returns all items where `currentStock <= minStockThreshold` (low stock alert report).
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 44. GET /api/inventory/:id
- **Description:** Retrieves single inventory item details including recipe links.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 45. PATCH /api/inventory/:id/stock
- **Description:** Adjusts stock quantity (either absolute override or relative increment/decrement).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`, `KITCHEN_ADMIN`
- **Request Body Option 1 (Set absolute):** `{ "currentStock": 60.0 }`
- **Request Body Option 2 (Relative adjustment):** `{ "adjustment": -2.5 }`
- **Business Rule:** Stock cannot become negative. Returns `400 Bad Request` or `422 Unprocessable`.
- **Expected Success Status:** `200 OK`

#### 46. PATCH /api/inventory/:id (and PUT /api/inventory/:id)
- **Description:** Updates inventory item details (name, sku, thresholds, cost).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 47. DELETE /api/inventory/:id
- **Description:** Deletes an inventory item.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Business Rule:** If referenced in recipes, purchases, or wastage, returns `409 Conflict` ("Inventory item has recipe, purchase, or wastage history and cannot be deleted").
- **Expected Success Status:** `200 OK`

---

### Module 09: Suppliers (`/api/suppliers`)

#### 48. POST /api/suppliers
- **Description:** Registers a supplier/vendor.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Request Body:**
  ```json
  {
    "name": "Metro Wholesale Grocers",
    "contactPerson": "David Miller",
    "phone": "+1 555-0800",
    "email": "orders@metrowholesale.com",
    "address": "Industrial Area Phase 2"
  }
  ```
- **Expected Success Status:** `201 Created`

#### 49. GET /api/suppliers
- **Description:** Lists all registered suppliers with purchase order counts.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 50. GET /api/suppliers/:id
- **Description:** Retrieves supplier details along with historical purchases.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 51. PATCH /api/suppliers/:id (and PUT /api/suppliers/:id)
- **Description:** Updates supplier details.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 52. DELETE /api/suppliers/:id
- **Description:** Deletes a supplier.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Business Rule:** If supplier has linked purchases, returns `409 Conflict` ("Supplier has purchase history and cannot be deleted").
- **Expected Success Status:** `200 OK`

---

### Module 10: Purchases (`/api/purchases`)

#### 53. POST /api/purchases
- **Description:** Creates a purchase order for restocking ingredients from a supplier.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Validation Schema:** `validatePurchase`
- **Request Body:**
  ```json
  {
    "supplierId": "supplier-uuid",
    "invoiceNumber": "INV-2026-001",
    "items": [
      {
        "inventoryItemId": "inventory-item-uuid",
        "quantity": 20,
        "costPerUnit": 1.50
      }
    ]
  }
  ```
- **Status Upon Creation:** `ORDERED`
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `404 Not Found` (supplier not found).

#### 54. GET /api/purchases
- **Description:** Lists purchase orders with item details.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Query Parameters:** `supplierId`, `status` (`ORDERED`, `RECEIVED`, `CANCELLED`, `PENDING`), `startDate`, `endDate`, `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 55. GET /api/purchases/:id
- **Description:** Retrieves purchase order details by ID.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 56. PATCH /api/purchases/:id/receive
- **Description:** Receives the purchase goods and increments inventory stock for all items transactionally.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Database Operation:** `serializableTransaction` -> verifies status is ORDERED/PENDING, increments `currentStock` in `inventory_items`, updates item `costPerUnit`, marks purchase `RECEIVED`.
- **Business Rule:** Cannot receive a purchase that is already `RECEIVED` or `CANCELLED` (returns `409 Conflict`).
- **Expected Success Status:** `200 OK`

#### 57. PATCH /api/purchases/:id/cancel
- **Description:** Cancels an ordered purchase.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Business Rule:** Cannot cancel a purchase that has already been `RECEIVED` (returns `400 Bad Request`).
- **Expected Success Status:** `200 OK`

#### 58. PATCH /api/purchases/:id
- **Description:** Updates invoice number or modifies purchase items before receipt.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`
- **Expected Errors:** `409 Conflict` (if purchase already RECEIVED or CANCELLED).

---

### Module 11: Orders

#### POST /api/orders/:id/items
- **Description:** Waiter Multi-Item Addition. Allows appending additional menu items to an existing active table order before billing/finalization.
- **Authentication:** Bearer Token (`RESTAURANT_OWNER`, `WAITER`, `RECEPTIONIST`)
- **Request Body:**
  ```json
  {
    "items": [
      {
        "menuItemId": "uuid-here",
        "quantity": 2,
        "specialInstructions": "Extra crisp, less oil"
      }
    ]
  }
  ```
- **Expected Success Status:** `200 OK`
 Lifecycle (`/api/orders`)

#### 59. POST /api/orders
- **Description:** Places an order from a waiter or cashier for a dining table or takeaway customer.
- **Authentication:** Required
- **Role:** `WAITER`, `RESTAURANT_OWNER`, `RECEPTIONIST`
- **Validation Schema:** `validateCreateOrder`
- **Request Body:**
  ```json
  {
    "tableId": "table-uuid",
    "customerName": "Alice Table Guest",
    "notes": "Extra crispy flatbread",
    "items": [
      {
        "menuItemId": "menu-item-uuid",
        "quantity": 2,
        "notes": "Well done"
      }
    ]
  }
  ```
- **Business Logic & Side Effects:**
  1. If `tableId` provided, validates table exists and is in `AVAILABLE` status (throws `409 Conflict` if not AVAILABLE).
  2. Marks table status to `OCCUPIED`.
  3. Validates menu items exist and `isAvailable === true` (throws `400 Bad Request` if 86'd).
  4. Snapshots unit prices into `order_items` at time of order creation.
  5. Generates order number: `ORD-XXXXXX-XXX`.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `404 Not Found`, `409 Conflict` (table not available).

#### 60. GET /api/orders/active
- **Description:** Retrieves active orders in progress (status NOT IN `['COMPLETED', 'CANCELLED']`).
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 61. GET /api/orders
- **Description:** Retrieves all orders with multi-parameter filtering.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Query Parameters:** `status` (`PENDING`, `IN_PREPARATION`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED`), `tableId`, `waiterId`, `startDate`, `endDate`, `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 62. GET /api/orders/:id
- **Description:** Retrieves order details, items, bill, and table relations.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 63. PATCH /api/orders/:id
- **Description:** Updates customer name or notes on an order.
- **Authentication:** Required
- **Role:** `WAITER`, `RESTAURANT_OWNER`
- **Business Rule:** Only orders in `PENDING` status can be edited (throws `409 Conflict` if in preparation or beyond).
- **Expected Success Status:** `200 OK`

#### 64. PATCH /api/orders/:id/cancel
- **Description:** Cancels an order. If table has no other active orders, automatically releases table status back to `AVAILABLE`.
- **Authentication:** Required
- **Role:** `WAITER`, `RESTAURANT_OWNER`
- **Business Rule:** Cannot cancel a `COMPLETED` order (returns `400 Bad Request`).
- **Expected Success Status:** `200 OK`

---

### Module 12: Kitchen Operations (`/api/kitchen`)

#### 65. GET /api/kitchen/orders
- **Description:** Retrieves active kitchen queue: orders with status `PENDING`, `IN_PREPARATION`, or `READY`, sorted chronologically (oldest first).
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 66. GET /api/kitchen/orders/pending
- **Description:** Retrieves only orders waiting to be accepted (`PENDING`).
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`

#### 67. PATCH /api/kitchen/orders/:id/accept (and PATCH /api/kitchen/orders/:id/prepare)
- **Description:** Moves order from `PENDING` -> `IN_PREPARATION`.
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Business Rule:** Can only accept orders from `PENDING` (throws `409 Conflict` otherwise).
- **Expected Success Status:** `200 OK`

#### 68. PATCH /api/kitchen/items/:itemId/status
- **Description:** Updates individual item status in kitchen (`PENDING`, `COOKING`, `READY`, `SERVED`, `CANCELLED`).
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Request Body:** `{ "status": "COOKING" }`
- **Expected Success Status:** `200 OK`

#### 69. PATCH /api/kitchen/orders/:id/ready
- **Description:** Transitions order status from `IN_PREPARATION` -> `READY` for waitstaff pickup.
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Business Rule:** Can only transition from `IN_PREPARATION` (throws `409 Conflict` otherwise).
- **Expected Success Status:** `200 OK`

#### 70. PATCH /api/kitchen/orders/:id/served
- **Description:** Transitions order status from `READY` -> `SERVED` to guest.
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Business Rule:** Can only transition from `READY` (throws `409 Conflict` otherwise).
- **Expected Success Status:** `200 OK`

#### 71. PATCH /api/kitchen/orders/:id/complete
- **Description:** Completes the order AND automatically calculates and deducts recipe ingredient stock from inventory in an atomic `$transaction`.
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Business Rules:**
  1. Order must currently be in `SERVED` status (throws `422 Unprocessable` if not SERVED).
  2. If order is already `COMPLETED`, operation is idempotent and returns current order without double deducting.
  3. Checks inventory stock sufficiency for all recipe ingredients across all items ordered. If any ingredient is insufficient, transaction rolls back and returns `400 Bad Request` ("Insufficient stock for ingredient '<name>'. Available: X, Required: Y").
- **Expected Success Status:** `200 OK`

#### 72. PATCH /api/kitchen/orders/:id/cancel
- **Description:** Cancels an order from kitchen view. Releases table if no other active order exists.
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Expected Success Status:** `200 OK`
- **Expected Errors:** `400 Bad Request` (Cannot cancel completed order).

---

### Module 13: Billing (`/api/billing`)

#### 73. POST /api/billing/generate (and POST /api/billing)
- **Description:** Generates a customer bill with subtotals, restaurant tax calculation, and discounts.
- **Authentication:** Required
- **Role:** `RECEPTIONIST`, `RESTAURANT_OWNER`
- **Validation Schema:** `validateGenerateBill`
- **Request Body:**
  ```json
  {
    "orderId": "order-uuid",
    "discountAmount": 1.00
  }
  ```
- **Business Rules:**
  1. Order must be completed by the kitchen (`status === 'COMPLETED'`). If not completed, throws `422 Unprocessable` ("Order must be completed by the kitchen before a bill can be generated").
  2. If order is cancelled, throws `400 Bad Request`.
  3. If bill already exists for the order, returns existing bill idempotently.
  4. Automatically computes: `subtotal` (sum of item subtotals), `taxAmount` (`subtotal * restaurant.taxRate / 100`), `totalAmount` (`max(0, subtotal + taxAmount - discountAmount)`).
  5. Generates unique bill number: `BILL-XXXXXX-XXX`.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `404 Not Found`, `422 Unprocessable`.

#### 74. GET /api/billing
- **Description:** Lists generated bills.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Query Parameters:** `status` (`UNPAID`, `PAID`, `PARTIALLY_PAID`, `VOID`), `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 75. GET /api/billing/:id
- **Description:** Retrieves bill by bill ID with order and payment details.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 76. GET /api/billing/order/:orderId
- **Description:** Retrieves bill linked to a specific order ID.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 77. PATCH /api/billing/:id
- **Description:** Adjusts discount amount on an unpaid bill.
- **Authentication:** Required
- **Role:** `RECEPTIONIST`, `RESTAURANT_OWNER`
- **Request Body:** `{ "discountAmount": 2.00 }`
- **Business Rules:**
  - If bill is already `PAID`, throws `400 Bad Request` ("Cannot update an already PAID bill").
  - If bill has any recorded payments, throws `409 Conflict` ("A bill with recorded payments cannot be changed").
- **Expected Success Status:** `200 OK`

---

### Module 14: Payments (`/api/payments`)

#### 78. POST /api/payments
- **Description:** Records a payment transaction against a bill.
- **Authentication:** Required
- **Role:** `RECEPTIONIST`, `RESTAURANT_OWNER`
- **Validation Schema:** `validatePayment`
- **Request Body:**
  ```json
  {
    "billId": "bill-uuid",
    "amount": 15.00,
    "method": "CASH",
    "transactionReference": "TXN-2026-001"
  }
  ```
- **Body Constraints:**
  - `billId`: Required UUID.
  - `amount`: Positive number > 0.
  - `method`: One of `CASH`, `CARD`, `UPI`, `NET_BANKING`, `OTHER`.
  - `transactionReference`: Optional string (must be unique per bill).
- **Business Logic & Side Effects:**
  1. Verifies bill exists and is not already `PAID` (throws `400 Bad Request` if already PAID).
  2. Verifies order is `COMPLETED` (throws `422 Unprocessable` if not COMPLETED).
  3. Verifies `transactionReference` is not duplicate for this bill (throws `409 Conflict`).
  4. Verifies total paid does not exceed bill total amount (throws `422 Unprocessable` "Payment exceeds the bill balance").
  5. If total payments >= totalAmount:
     - Updates bill status to `PAID`.
     - Automatically releases table status back to `AVAILABLE` if no other active order uses the table.
  6. Otherwise updates bill status to `PARTIALLY_PAID`.
- **Expected Success Status:** `201 Created`
- **Expected Errors:** `400 Bad Request`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`.

#### 79. GET /api/payments
- **Description:** Lists payment transactions with payment method and date filtering.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Query Parameters:** `method`, `status` (`COMPLETED`, `PENDING`, `FAILED`, `REFUNDED`), `startDate`, `endDate`, `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 80. GET /api/payments/:id
- **Description:** Retrieves payment record by ID.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 81. GET /api/payments/bill/:billId
- **Description:** Lists all payments associated with a specific bill.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

---

### Module 15: Wastage Management (`/api/wastage`)

#### 82. POST /api/wastage
- **Description:** Records inventory item wastage/spoilage and automatically decrements inventory stock.
- **Authentication:** Required
- **Role:** `KITCHEN_ADMIN`, `RESTAURANT_OWNER`
- **Validation Schema:** `validateWastage`
- **Request Body:**
  ```json
  {
    "inventoryItemId": "inventory-item-uuid",
    "quantity": 1.5,
    "unit": "KG",
    "reason": "Burnt during tandoori preparation"
  }
  ```
- **Body Constraints:**
  - `quantity`: Positive number > 0.
  - `reason`: Required string <= 500 chars.
  - `unit`: Must match inventory item's unit (throws `422 Unprocessable` if mismatched).
- **Business Rule:** Cannot record wastage exceeding current stock. Throws `400 Bad Request`.
- **Side Effect:** Decrements `currentStock` in `inventory_items` and calculates `cost = quantity * item.costPerUnit`.
- **Expected Success Status:** `201 Created`

#### 83. GET /api/wastage
- **Description:** Lists recorded wastage logs.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Query Parameters:** `startDate`, `endDate`, `page`, `limit`.
- **Expected Success Status:** `200 OK`

#### 84. GET /api/wastage/:id
- **Description:** Retrieves details of a specific wastage entry.
- **Authentication:** Required
- **Role:** All authenticated roles
- **Expected Success Status:** `200 OK`

#### 85. DELETE /api/wastage/:id
- **Description:** Deletes a wastage record AND restores the decremented stock back to the inventory item in a transaction.
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`

---

### Module 16: Reports

#### GET /api/reports/financials
- **Description:** Owner Financial Intelligence Dashboard. Returns net profit, revenue by payment method (Cash, UPI, Card, Net Banking), expenses breakdown (Supplier purchases and Wastage deductions), and chronological 100-entry Money In vs Money Out ledger.
- **Authentication:** Bearer Token (`RESTAURANT_OWNER`)
- **Expected Success Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Financial report generated successfully",
    "data": {
      "totalRevenue": 4850.00,
      "totalExpenses": 1620.00,
      "netAmount": 3230.00,
      "breakdown": {
        "revenueByMethod": { "CASH": 2100.00, "UPI": 1950.00, "CARD": 800.00 },
        "purchasesExpense": 1400.00,
        "wastageExpense": 220.00
      },
      "ledger": [
        {
          "id": "PAY-uuid",
          "date": "2026-09-29T11:30:00.000Z",
          "type": "SALE",
          "category": "ORDER_PAYMENT",
          "method": "UPI",
          "amount": 750.00,
          "description": "Payment for Bill #INV-1002"
        },
        {
          "id": "PUR-uuid",
          "date": "2026-09-29T09:15:00.000Z",
          "type": "EXPENSE",
          "category": "PURCHASE",
          "method": "INVOICE",
          "amount": -500.00,
          "description": "Purchase: Fresh Dairy & Creamery (Fresh Paneer, Amul Butter)"
        }
      ]
    }
  }
  ```
 & Analytics (`/api/reports`)
*All report endpoints require `RESTAURANT_OWNER` role and accept standard ISO date query filters (`startDate`, `endDate`).*

#### 86. GET /api/reports/sales
- **Description:** Comprehensive sales report aggregating paid bills, total revenue, tax collected, discounts granted, order count, and payment method breakdown (CASH, CARD, UPI).
- **Authentication:** Required
- **Role:** `RESTAURANT_OWNER`
- **Query Parameters:** `startDate`, `endDate`
- **Expected Success Status:** `200 OK`

#### 87. GET /api/reports/orders
- **Description:** Orders breakdown report aggregating total orders and status breakdown (`PENDING`, `IN_PREPARATION`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED`).
- **Expected Success Status:** `200 OK`

#### 88. GET /api/reports/payments
- **Description:** Payments collection report aggregating total collected funds and breakdown by payment method.
- **Expected Success Status:** `200 OK`

#### 89. GET /api/reports/inventory
- **Description:** Inventory valuation report computing total stock valuation (`sum(currentStock * costPerUnit)`) and listing low-stock items.
- **Expected Success Status:** `200 OK`

#### 90. GET /api/reports/wastage
- **Description:** Wastage expense report calculating total financial loss from spoiled/wasted ingredients.
- **Expected Success Status:** `200 OK`

#### 91. GET /api/reports/purchases
- **Description:** Supplier procurement report aggregating total expenditure on supplier purchase orders and status breakdown.
- **Expected Success Status:** `200 OK`

---

### Module 17: Waiter Operations & Service Management (`/api/waiter`, `/api/orders`, `/api/billing`)

#### 92. GET /api/waiter/dashboard
- **Description:** Real-time Waiter operational dashboard. Returns live table counts (total, available, occupied, waiting for service, waiting for billing), live order counts (new, preparing, ready, served), live bill counts (unpaid, ready to deliver, delivered, paid), table-wise active orders matrix, real-time ready-order alerts, and ready-bill alerts.
- **Authentication:** Bearer Token (`WAITER`, `RESTAURANT_OWNER`)
- **Expected Success Status:** `200 OK`
- **Expected Response:**
  ```json
  {
    "success": true,
    "message": "Waiter dashboard data retrieved successfully",
    "data": {
      "tableOverview": {
        "totalTables": 12,
        "availableTables": 8,
        "occupiedTables": 4,
        "tablesWithActiveOrders": 4,
        "tablesWaitingForService": 1,
        "tablesWaitingForBilling": 1
      },
      "orderOverview": {
        "newOrders": 1,
        "preparingOrders": 1,
        "readyOrders": 1,
        "servedOrders": 14
      },
      "billOverview": {
        "pendingBills": 2,
        "readyToDeliverBills": 1,
        "deliveredBills": 12,
        "completedBills": 12
      },
      "tableOrders": [
        {
          "tableId": "uuid",
          "tableNumber": "T-101",
          "capacity": 4,
          "status": "OCCUPIED",
          "activeOrder": {
            "id": "uuid",
            "orderNumber": "ORD-001",
            "status": "READY",
            "itemsCount": 3,
            "totalAmount": 45.00,
            "createdAt": "2026-09-30T12:00:00.000Z",
            "servedAt": null,
            "waiterName": "Sam Waiter",
            "bill": null
          }
        }
      ],
      "readyNotifications": [
        {
          "id": "ready-uuid",
          "orderId": "uuid",
          "orderNumber": "ORD-001",
          "tableNumber": "T-101",
          "itemsCount": 3,
          "readyAt": "2026-09-30T12:10:00.000Z",
          "message": "Order #ORD-001 for Table T-101 is Ready"
        }
      ],
      "billNotifications": [
        {
          "id": "bill-uuid",
          "billId": "uuid",
          "billNumber": "BILL-1001",
          "tableNumber": "T-101",
          "orderNumber": "ORD-001",
          "totalAmount": 45.00,
          "createdAt": "2026-09-30T12:15:00.000Z",
          "message": "Bill for Table T-101 is Ready (BILL-1001)"
        }
      ]
    }
  }
  ```

#### 93. POST /api/orders/:id/send-to-kitchen
- **Description:** Sends an active order to the kitchen. Transitions order status from `PENDING` to `ACCEPTED`, notifying kitchen display systems that the ticket has been acknowledged and is ready for cooking.
- **Authentication:** Bearer Token (`WAITER`, `RESTAURANT_OWNER`, `RECEPTIONIST`)
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`

#### 94. POST /api/orders/:id/serve
- **Description:** Waiter marks a kitchen-ready order (`READY`) as `SERVED` upon physically delivering food to the customer's table. Records `servedAt` timestamp and tags `servedById` with the waiter's user ID. (Also accessible via `PATCH /api/orders/:id/status` with `{ "status": "SERVED" }`).
- **Authentication:** Bearer Token (`WAITER`, `RESTAURANT_OWNER`)
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`
- **Validation Rules:** Order must currently be in `READY` status. Attempting to mark non-ready orders as served returns `409 Conflict`.

#### 95. POST /api/billing/bills/:id/deliver (and PATCH /api/billing/bills/:id/deliver)
- **Description:** Waiter marks a receptionist-generated bill as delivered to the customer table. Sets `isDelivered: true`, records `deliveredAt` timestamp, and sets `deliveredById` to the waiter's user ID.
- **Authentication:** Bearer Token (`WAITER`, `RESTAURANT_OWNER`)
- **Path Parameters:** `id` (UUID)
- **Expected Success Status:** `200 OK`

---

## 4. Module 00B: Authentication & Password Recovery (`/api/auth`)

### 1. POST /api/auth/forgot-password
- **Description:** Requests a 6-digit OTP code to reset password. Protected by account enumeration safeguards: always returns generic success if user does not exist or is deactivated. If user exists, generates cryptographically random 6-digit OTP, stores securely peppered SHA-256 hash with 10-minute expiry, and sends via SMTP.
- **Authentication:** Public (No token required)
- **Rate Limit:** 60-second cooldown between consecutive OTP requests.
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "If the email is registered, a verification code has been sent.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Email missing or invalid format.
  - `429 Too Many Requests`: `Please wait X seconds before requesting a new verification code.`
  - `503 Service Unavailable`: SMTP configuration missing or unconfigured.

### 2. POST /api/auth/resend-reset-otp
- **Description:** Resends a new single-use 6-digit OTP code to registered email, invalidating previous code. Enforces 60-second cooldown and account enumeration protection.
- **Authentication:** Public (No token required)
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "If the email is registered, a new verification code has been sent.",
    "data": {}
  }
  ```
- **Error Responses:**
  - `429 Too Many Requests`: Cooldown active.

### 3. POST /api/auth/verify-reset-otp
- **Description:** Authoritatively verifies the 6-digit OTP. Checks attempt limits (maximum 5 failed attempts; invalidates OTP after 5), expiration (10 min), and matches hash. On success, permanently marks OTP as used and issues a short-lived 15-minute reset authorization token.
- **Authentication:** Public (No token required)
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "otp": "483921"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Verification code verified successfully",
    "data": {
      "resetToken": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Code expired, invalid digits, or attempt limit exceeded.

### 4. POST /api/auth/reset-password
- **Description:** Resets user password using the short-lived reset authorization token. Validates password policy (min 8 chars, 1 uppercase, 1 lowercase, 1 digit), securely hashes password via bcrypt, updates user record, and invalidates all reset states.
- **Authentication:** Public with verified `resetToken`
- **Request Body:**
  ```json
  {
    "resetToken": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "newPassword": "NewSecurePassword1"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password updated successfully",
    "data": {}
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Invalid or expired reset session, or password does not satisfy complexity requirements.

---

## 5. Endpoints NOT Implemented (Clarification)

The following endpoints were mentioned in preliminary designs or might be assumed by frontend developers, but are **NOT IMPLEMENTED** in this backend:

1. `POST /api/orders/:id/complete` — **NOT IMPLEMENTED**  
   *Actual Route:* `PATCH /api/kitchen/orders/:id/complete` (Kitchen module).
2. `POST /api/orders/:id/ready` — **NOT IMPLEMENTED**  
   *Actual Route:* `PATCH /api/kitchen/orders/:id/ready`.
3. `POST /api/tables/:id/reserve` — **NOT IMPLEMENTED**  
   *Actual Route:* `PATCH /api/tables/:id/status` with body `{ "status": "RESERVED" }`.
4. `DELETE /api/orders/:id/items/:itemId` — **NOT IMPLEMENTED**  
   *Actual Route:* Order items are updated via `PATCH /api/kitchen/items/:itemId/status` or pending orders are updated via `PATCH /api/orders/:id`.
5. `POST /api/auth/refresh` — **NOT IMPLEMENTED**  
   *Actual Implementation:* JWT tokens are issued with a 24-hour expiration (`1d`) on login and registration; there is no refresh token endpoint.

