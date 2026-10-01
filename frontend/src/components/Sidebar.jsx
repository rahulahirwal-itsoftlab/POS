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
  HelpCircle,
  ClipboardList,
  BookOpen
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
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
        { id: 'bills', label: 'Bills', icon: Receipt },
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
      ];
    }

    return [];
  };

  const allowedItems = getNavigationForRole();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Operations
        </div>
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footnote */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-500">API Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </span>
        </div>
        <div className="text-[11px] text-slate-500">PostgreSQL / Neon Engine</div>
      </div>
    </aside>
  );
}
