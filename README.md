# Enterprise Restaurant POS & Management System

Complete Full-Stack Point of Sale (POS) and Restaurant Operations Platform with Node.js/Express backend and modern React/Vite/Tailwind frontend.

---

## 📁 Repository Structure

```
POS/
├── backend/                             # Express.js REST API & Neon PostgreSQL ORM
│   ├── prisma/
│   │   ├── schema.prisma                # Full database schema
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/                 # 16 Business controllers
│   │   ├── routes/                      # 16 Modular REST routes (103 endpoints)
│   │   ├── services/                    # Database query and atomic transactions
│   │   ├── middleware/                  # JWT auth, RBAC guards, error handler
│   │   └── server.js                    # Express app server (port 5000)
│   └── package.json
│
├── frontend/                            # Vite + React + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, Toast, ReceiptModal
│   │   ├── context/                     # AuthContext with 1-click Role Switcher
│   │   ├── services/                    # API client & POS service methods
│   │   ├── views/                       # FloorMap, PosTerminal, KDS, Billing,
│   │   │                                # Menu, Inventory, Purchases, Reports,
│   │   │                                # Staff, Settings, Login
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js                   # Proxy configuration (/api -> :5000)
│   └── package.json
│
├── docs/                                # Complete QA & API testing documentation
│   ├── API_DOCUMENTATION.md
│   ├── POSTMAN_TEST_GUIDE.md
│   ├── API_TEST_CHECKLIST.md
│   └── API_COVERAGE_REPORT.md
│
├── Restaurant-POS-API.postman_collection.json    # 103 API Postman collection
└── Restaurant-POS-Local.postman_environment.json # Postman environment
```

---

## ⚡ Quick Start

### 1. Start the Backend
```bash
cd backend
npm run dev
```
*Runs on `http://localhost:5000`*

### 2. Start the Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```
*Runs on `http://localhost:5173`*

### 3. Open in Browser
Visit **`http://localhost:5173`** and use the **1-Click Demo Buttons** on the login screen:
- **Owner / Admin**: `owner@pos.com` / `Password@123`
- **Kitchen Chef**: `chef@pos.com` / `Password@123`
- **Waiter Staff**: `waiter@pos.com` / `Password@123`
- **Reception / Cashier**: `reception@pos.com` / `Password@123`
