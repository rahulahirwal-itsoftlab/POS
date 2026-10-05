import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Views
import LoginView from './views/LoginView';
import ForgotPasswordView from './views/ForgotPasswordView';
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
  const [settingsSubTab, setSettingsSubTab] = useState('profile');
  const [selectedTable, setSelectedTable] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('apexpos_sidebar_collapsed') === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Standalone auth routing (/login, /forgot-password, /verify-otp, /reset-password)
  const [authRoute, setAuthRoute] = useState(() => {
    const p = window.location.pathname;
    if (p.includes('/forgot-password') || p.includes('/verify-otp') || p.includes('/reset-password')) {
      return p;
    }
    return '/login';
  });

  const navigateAuth = (path) => {
    setAuthRoute(path);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p.includes('/forgot-password') || p.includes('/verify-otp') || p.includes('/reset-password')) {
        setAuthRoute(p);
      } else {
        setAuthRoute('/login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('apexpos_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navigateToSettings = (subTab = 'profile') => {
    setSettingsSubTab(subTab);
    setActiveTab('settings');
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <div className="h-screen w-screen bg-[#FAF7F2] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#92400E] to-[#D97706] flex items-center justify-center shadow-xl shadow-[#92400E]/20 animate-pulse">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2 text-[#5B6470] text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-[#92400E]" />
          <span>Starting ApexPOS terminal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    const isForgotFlow =
      authRoute.includes('/forgot-password') ||
      authRoute.includes('/verify-otp') ||
      authRoute.includes('/reset-password');

    return (
      <>
        {isForgotFlow ? (
          <ForgotPasswordView
            onNavigateToLogin={() => navigateAuth('/login')}
            onNavigate={navigateAuth}
          />
        ) : (
          <LoginView onNavigateToForgotPassword={() => navigateAuth('/forgot-password')} />
        )}
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
    <div className="h-screen w-screen flex flex-col bg-[#FAF7F2] text-[#1F2937] overflow-hidden font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navigateToSettings={navigateToSettings}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          navigateToSettings={navigateToSettings}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto bg-[#FAF7F2] min-w-0">
          {activeTab === 'settings' ? (
            <SettingsView initialTab={settingsSubTab} onTabChange={setSettingsSubTab} />
          ) : role === 'RESTAURANT_REGISTRATION_ADMIN' ? (
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
