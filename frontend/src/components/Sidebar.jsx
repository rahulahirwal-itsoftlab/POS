import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  LayoutDashboard,
  LayoutGrid,
  ShoppingBag,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Boxes,
  Users,
  Settings,
  ClipboardList,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  navigateToSettings,
  collapsed = false,
  setCollapsed,
  toggleSidebar,
  mobileOpen = false,
  setMobileOpen,
}) {
  const { role } = useAuth();

  // Navigation specifically structured per role requirements
  const getNavigationForRole = () => {
    if (role === 'RESTAURANT_REGISTRATION_ADMIN') {
      return [
        {
          id: 'registration',
          label: 'Platform Governance',
          icon: Building2,
          badge: 'Super Admin',
        },
        {
          id: 'settings',
          label: 'Platform Settings',
          icon: Settings,
        },
      ];
    }

    if (role === 'RESTAURANT_OWNER') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: 'Overview',
        },
        {
          id: 'staff',
          label: 'Manage Staff',
          icon: Users,
        },
        {
          id: 'menu',
          label: 'Menu Selection',
          icon: UtensilsCrossed,
        },
        {
          id: 'tables',
          label: 'Table Management',
          icon: LayoutGrid,
        },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Boxes,
        },
        {
          id: 'billing',
          label: 'Billing & Payments',
          icon: Receipt,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
        },
      ];
    }

    if (role === 'WAITER') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
        { id: 'tables', label: 'Tables', icon: LayoutGrid },
        { id: 'orders', label: 'Orders', icon: ClipboardList },
        { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    if (role === 'KITCHEN_ADMIN') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
        { id: 'orders', label: 'Orders', icon: ClipboardList },
        { id: 'inventory', label: 'Inventory', icon: Boxes },
        { id: 'recipes', label: 'Recipes', icon: BookOpen },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    if (role === 'RECEPTIONIST') {
      return [
        { id: 'billing', label: 'Billing & Cashier', icon: Receipt },
        { id: 'floor', label: 'Floor & Tables', icon: LayoutGrid },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    return [];
  };

  const allowedItems = getNavigationForRole();

  const handleItemClick = (id) => {
    if (id === 'settings' && navigateToSettings) {
      navigateToSettings('profile');
    } else {
      setActiveTab(id);
    }
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const renderNavContent = (isMobileDrawer = false) => {
    const isIconOnly = collapsed && !isMobileDrawer;

    return (
      <div className="flex flex-col h-full justify-between select-none bg-white">
        <div className="py-4 px-3 space-y-1">
          {/* Mobile Drawer Close Header */}
          {isMobileDrawer && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E5D8C6] px-2">
              <span className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Navigation Menu</span>
              <button
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className="p-1 rounded-lg text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] cursor-pointer transition-colors"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Section Header */}
          {!isIconOnly && (
            <div className="px-3 pb-2 text-[11px] font-bold text-[#8C7E72] uppercase tracking-wider flex items-center justify-between">
              <span>Operations</span>
            </div>
          )}

          {/* Navigation Items */}
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={isIconOnly ? item.label : undefined}
                className={`w-full flex items-center rounded-xl font-semibold text-sm transition-all duration-200 group cursor-pointer relative ${
                  isIconOnly ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#92400E] text-white shadow-sandstone font-bold'
                    : 'text-[#5B6470] hover:text-[#1F2937] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-[#6B6258] group-hover:text-[#92400E]'
                    }`}
                  />
                  {!isIconOnly && <span className="truncate whitespace-nowrap">{item.label}</span>}
                </div>
                {!isIconOnly && item.badge && (
                  <span
                    className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ml-2 tracking-wider whitespace-nowrap ${
                      isActive
                        ? 'bg-[#78350F] text-[#FDE68A] border border-[#B45309]'
                        : 'bg-[#D97706]/10 text-[#92400E] border border-[#D97706]/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer with Collapse Toggle and System Indicator */}
        <div className="p-3 border-t border-[#E5D8C6] space-y-2 bg-white">
          {/* Desktop Sidebar Collapse Toggle Button */}
          {!isMobileDrawer && (
            <button
              onClick={toggleSidebar}
              className={`w-full flex items-center rounded-xl text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] p-2.5 transition-colors cursor-pointer ${
                isIconOnly ? 'justify-center' : 'justify-between'
              }`}
              title={collapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
            >
              <div className="flex items-center gap-2">
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 text-[#92400E]" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-[#5B6470]" />
                )}
                {!isIconOnly && <span>Collapse Sidebar</span>}
              </div>
              {!isIconOnly && (
                <kbd className="text-[10px] text-[#8C7E72] font-mono bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E5D8C6]">
                  Ctrl+B
                </kbd>
              )}
            </button>
          )}

          {/* System Status Footnote */}
          {!isIconOnly && (
            <div className="px-2 py-1 text-xs text-[#5B6470]">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[#8C7E72]">API Status</span>
                <span className="flex items-center gap-1.5 text-[#16A34A] font-semibold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                  Connected
                </span>
              </div>
              <div className="text-[10px] text-[#8C7E72]">PostgreSQL / Neon Engine</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar Container */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-[#E5D8C6] shrink-0 transition-all duration-300 ease-in-out shadow-[1px_0_3px_0_rgba(41,35,31,0.02)] ${
          collapsed
            ? 'w-20'
            : role === 'RESTAURANT_REGISTRATION_ADMIN'
            ? 'w-72'
            : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Subtle Warm Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />

          {/* Sliding Drawer Container */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white border-r border-[#E5D8C6] shadow-2xl z-50">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
