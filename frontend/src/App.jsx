import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Views
import LoginView from './views/LoginView';
import RegistrationAdminDashboard from './views/RegistrationAdminDashboard';
import FloorMapView from './views/FloorMapView';
import PosTerminalView from './views/PosTerminalView';
import KitchenDisplayView from './views/KitchenDisplayView';
import KitchenDashboardView from './views/KitchenDashboardView';
import KitchenOrdersView from './views/KitchenOrdersView';
import KitchenRecipesView from './views/KitchenRecipesView';
import WaiterDashboardView from './views/WaiterDashboardView';
import WaiterTablesView from './views/WaiterTablesView';
import WaiterOrdersView from './views/WaiterOrdersView';
import WaiterMenuView from './views/WaiterMenuView';
import WaiterBillsView from './views/WaiterBillsView';
import BillingView from './views/BillingView';
import MenuView from './views/MenuView';
import InventoryView from './views/InventoryView';
import PurchasesView from './views/PurchasesView';
import ReportsView from './views/ReportsView';
import StaffView from './views/StaffView';
import SettingsView from './views/SettingsView';
import RestaurantAdminDashboardView from './views/RestaurantAdminDashboardView';

import { UtensilsCrossed, RefreshCw } from 'lucide-react';

function PosDashboard() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTable, setSelectedTable] = useState(null);

  // Set default tab based on role when role changes
  useEffect(() => {
    if (role === 'RESTAURANT_REGISTRATION_ADMIN') {
      setActiveTab('registration');
    } else if (role === 'KITCHEN_ADMIN') {
      setActiveTab('dashboard');
    } else if (role === 'WAITER') {
      setActiveTab('dashboard');
    } else if (role === 'RECEPTIONIST') {
      setActiveTab('billing');
    } else if (role === 'RESTAURANT_OWNER') {
      setActiveTab('dashboard');
    }
  }, [role]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-950/60 animate-pulse">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Starting ApexPOS terminal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginView />
        <Toast />
      </>
    );
  }

  const handleSelectTableForOrder = (table) => {
    setSelectedTable(table);
    setActiveTab('pos');
  };

  const handleNavigateToBilling = (table) => {
    setSelectedTable(table);
    setActiveTab('billing');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto bg-slate-950/60">
          {role === 'RESTAURANT_REGISTRATION_ADMIN' ? (
            <RegistrationAdminDashboard />
          ) : (
            <>
              {activeTab === 'dashboard' && role === 'RESTAURANT_OWNER' && (
                <RestaurantAdminDashboardView setActiveTab={setActiveTab} />
              )}

              {activeTab === 'dashboard' && role === 'KITCHEN_ADMIN' && (
                <KitchenDashboardView setActiveTab={setActiveTab} />
              )}

              {activeTab === 'dashboard' && role === 'WAITER' && (
                <WaiterDashboardView
                  setActiveTab={setActiveTab}
                  onSelectTableForOrder={handleSelectTableForOrder}
                />
              )}

              {activeTab === 'tables' && role === 'WAITER' && (
                <WaiterTablesView
                  onSelectTableForOrder={handleSelectTableForOrder}
                  onNavigateToBills={() => setActiveTab('bills')}
                />
              )}

              {activeTab === 'orders' && role === 'KITCHEN_ADMIN' && (
                <KitchenOrdersView />
              )}

              {activeTab === 'orders' && role === 'WAITER' && (
                <WaiterOrdersView onSelectTableForOrder={handleSelectTableForOrder} />
              )}

              {activeTab === 'recipes' && (role === 'RESTAURANT_OWNER' || role === 'KITCHEN_ADMIN') && (
                <KitchenRecipesView />
              )}

              {activeTab === 'floor' && (role === 'RESTAURANT_OWNER' || role === 'RECEPTIONIST') && (
                <FloorMapView
                  onSelectTableForOrder={handleSelectTableForOrder}
                  onNavigateToBilling={handleNavigateToBilling}
                />
              )}

              {activeTab === 'pos' && (role === 'RESTAURANT_OWNER' || role === 'WAITER' || role === 'RECEPTIONIST') && (
                <PosTerminalView
                  preSelectedTable={selectedTable}
                  onOrderPlaced={() => {
                    setSelectedTable(null);
                    setActiveTab(role === 'WAITER' ? 'tables' : 'floor');
                  }}
                />
              )}

              {activeTab === 'kds' && role === 'RESTAURANT_OWNER' && (
                <KitchenDisplayView />
              )}

              {activeTab === 'billing' && (role === 'RESTAURANT_OWNER' || role === 'RECEPTIONIST') && (
                <BillingView preSelectedTable={selectedTable} />
              )}

              {activeTab === 'bills' && role === 'WAITER' && (
                <WaiterBillsView />
              )}

              {activeTab === 'menu' && role === 'RESTAURANT_OWNER' && (
                <MenuView />
              )}

              {activeTab === 'menu' && role === 'WAITER' && (
                <WaiterMenuView />
              )}

              {activeTab === 'inventory' && (role === 'RESTAURANT_OWNER' || role === 'KITCHEN_ADMIN') && (
                <InventoryView />
              )}

              {activeTab === 'purchases' && role === 'RESTAURANT_OWNER' && (
                <PurchasesView />
              )}

              {activeTab === 'reports' && role === 'RESTAURANT_OWNER' && (
                <ReportsView />
              )}

              {activeTab === 'staff' && role === 'RESTAURANT_OWNER' && (
                <StaffView />
              )}

              {activeTab === 'settings' && (role === 'RESTAURANT_OWNER' || role === 'KITCHEN_ADMIN' || role === 'WAITER') && (
                <SettingsView />
              )}
            </>
          )}
        </main>
      </div>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PosDashboard />
    </AuthProvider>
  );
}
