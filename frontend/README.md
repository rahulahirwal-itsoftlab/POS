# POS — Enterprise Restaurant Point of Sale Frontend

Modern, high-performance, dark-themed Restaurant POS and Operations Web Application built with **React**, **Vite**, **Tailwind CSS**, and **Lucide Icons**, designed to consume all 103 endpoints and business flows of the Enterprise Restaurant POS Express/Prisma/PostgreSQL backend.

---

## 🌟 Key Features & Workflow Integration

### 1. Two-Level Administration Hierarchy & Multi-Role Authentication
- **Level 1: Platform Super Admin** (`admin@pos.com` / `Password123`):
  - Dedicated **Registration & Tenant Governance Dashboard** (`RegistrationAdminDashboard.jsx`).
  - High-level platform onboarding: registers restaurants, provisions Owner accounts & credentials, activates/suspends restaurants (with immediate HTTP 403 enforcement).
  - Isolated from daily restaurant operations (no order taking, kitchen tickets, or billing).
- **Level 2: Restaurant Owner** (`owner.new@pos.com` / `Password123`):
  - Dedicated **Owner Command Center & Analytics**.
  - Complete control over isolated restaurant tenant: dynamically manages staff (Waiters, Kitchen Admins, Receptionists) without artificial limits, tables, menu, recipe BOMs, inventory, suppliers, purchases, and settings.
  - Dedicated **Financial Statement & Cashflow Ledger** (Money In vs Money Out ledger).
- **Kitchen Chef (KDS)** (`chef.marco@pos.com` / `Password123`):
  - Dedicated **Kitchen Display System** view.
  - Recipe BOM checkpoint showing auto-calculated required ingredients ($$\text{ordered quantity} \times \text{recipe ingredient quantity}$$) with live stock sufficiency indicators.
  - Sequential ticket progression: `PENDING` ➔ `IN_PREPARATION` ➔ `READY` ➔ `SERVED` ➔ `COMPLETED` (auto stock depletion).
- **Service Waiter** (`alex.waiter@pos.com` / `Password123`):
  - Dedicated **Floor Map & POS Terminal**.
  - **Multi-Item Order Addition**: Can add items multiple times to an active table session before final billing.
  - Real-time order status tracking, ready food notification, and customer handoff.
- **Receptionist / Cashier** (`emily.receptionist@pos.com` / `Password123`):
  - Dedicated **Billing & Cashier Dashboard**.
  - Strict kitchen clearance checkpoint: invoices only generated for completed food orders.
  - Multi-method settlements (`CASH`, `CARD`, `UPI`, `NET_BANKING`), tax & custom discounts, and automatic table release to `AVAILABLE`.
- **1-Click Quick Persona Switcher**: Instant switching between all 5 live database roles directly from the top navigation bar.

### 2. Dining Floor & Table Plan (`/api/tables`)
- Real-time visual cards for every table with seating capacity and floor sector.
- Real-time status indicators: `AVAILABLE` (emerald), `OCCUPIED` (rose), `RESERVED` (amber), `OUT_OF_SERVICE` (slate).
- Direct actions: "New Order", "Add Items", "Checkout", status dropdown changes, and table provisioning.

### 3. POS Waiter Terminal (`/api/orders`, `/api/menu`)
- Live category pills filter and instant search bar.
- Veg / Non-Veg dietary badges, dish description, and out-of-stock badges.
- Right-side order cart ticket with table selector, dine-in/takeaway/delivery options, item-level kitchen notes, and "Fire to Kitchen" action.
- Automatic table occupancy sync: placing an order immediately sets the table status to `OCCUPIED`.

### 4. Kitchen Display System (KDS) (`/api/kitchen`)
- Live auto-refreshing ticket queue with elapsed preparation stopwatch timers.
- Sequential stage progression:
  1. `PENDING` ➔ **Start Cooking** (`PATCH /api/kitchen/orders/:id/accept`)
  2. `IN_PREPARATION` ➔ **Mark Food Ready** (`PATCH /api/kitchen/orders/:id/ready`)
  3. `READY` ➔ **Mark Served to Table** (`PATCH /api/kitchen/orders/:id/served`)
  4. `SERVED` ➔ **Complete & Deduct Stock** (`PATCH /api/kitchen/orders/:id/complete`)
- **Automated Recipe Depletion**: Atomic decrement of warehouse ingredient stock based on dish recipes upon completion.

### 5. Billing, Invoicing & Settlements (`/api/billing`, `/api/payments`)
- Unbilled completed orders table with instant "Generate Bill" action.
- Configurable discount percentage/fixed amount and tax computation.
- **Multi-Method Settlement Modal**: Cash, Credit/Debit Card, UPI / QR, and Net Banking.
- **Automatic Table Release**: Settling payment marks the bill `PAID` and automatically returns the dining table to `AVAILABLE`.
- **Thermal Invoice / Receipt Preview**: Ready for 80mm ESC/POS thermal printing with 1-click browser print integration.

### 6. Menu Engineering & Recipe BOM (`/api/menu`, `/api/recipes`)
- Manage dish categories and menu items with image, price, prep time, and dietary tags.
- **Instant 86 Toggle**: One-click switch to mark any dish unavailable / out of stock across the entire POS.
- **Recipe Bill of Materials (BOM)**: Link raw inventory ingredients to dishes for automated stock control.

### 7. Inventory, Stock & Wastage Control (`/api/inventory`, `/api/wastage`)
- Real-time raw material balances, minimum safety thresholds, and cost prices.
- **Low Stock Warning Alert Banner**: Highlights ingredients falling below safety thresholds.
- **Stock Adjustment**: Positive/negative reconciliation audits with reasons.
- **Food Spoilage & Wastage Logger**: Track loss by reason (spoilage, expiration, prep error) with automatic stock deduction.

### 8. Procurement & Supplier Relations (`/api/suppliers`, `/api/purchases`)
- Vendor directory with contact details and tax registration.
- Inward goods receipts (Purchase Orders) that automatically replenish warehouse stocks.

### 9. Executive Intelligence & Analytics (`/api/reports`)
- Gross sales revenue, total tickets handled, inventory valuation, and wastage leakage metrics.
- Top selling dishes ranking and payment method breakdown.

### 10. Staff Management & Profile Settings (`/api/users`, `/api/restaurants`)
- Employee roster management with role assignment.
- Restaurant branding, GSTIN, currency symbol, default tax rate, and service charge configuration.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v24)
- Running Express backend on `http://localhost:5000`

### Installation & Run
```bash
# 1. Navigate into frontend directory
cd frontend

# 2. Start Vite development server
npm run dev
```

The application will run on **`http://localhost:5173`**.
All API calls to `/api/*` are automatically proxied to `http://localhost:5000`.

### Production Build
```bash
npm run build
npm run preview
```
