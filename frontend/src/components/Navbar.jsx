import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Clock,
  LogOut,
  Sparkles,
  Settings,
  User,
  Shield,
  Sliders,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  navigateToSettings,
  sidebarCollapsed,
  toggleSidebar,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  const { user, restaurant, logout, role } = useAuth();
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const roleBadges = {
    RESTAURANT_REGISTRATION_ADMIN: {
      label: 'Platform Super Admin',
      color: 'bg-[#92400E]/10 text-[#92400E] border-[#92400E]/25',
      settingsLabel: 'Platform Settings',
      settingsSubTab: 'platform',
    },
    RESTAURANT_OWNER: {
      label: 'Restaurant Admin',
      color: 'bg-[#D97706]/10 text-[#92400E] border-[#D97706]/25',
      settingsLabel: 'Restaurant Settings',
      settingsSubTab: 'restaurant',
    },
    KITCHEN_ADMIN: {
      label: 'Kitchen Chef',
      color: 'bg-[#D97706]/10 text-[#B45309] border-[#D97706]/25',
      settingsLabel: 'Kitchen Preferences',
      settingsSubTab: 'kitchen_view',
    },
    WAITER: {
      label: 'Service Waiter',
      color: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/25',
      settingsLabel: 'Service Station Settings',
      settingsSubTab: 'waiter_view',
    },
    RECEPTIONIST: {
      label: 'Reception / Cashier',
      color: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25',
      settingsLabel: 'Cashier Terminal Settings',
      settingsSubTab: 'cashier_view',
    },
  };

  const currentBadge = roleBadges[role] || {
    label: role,
    color: 'bg-[#FAF7F2] text-[#5B6470] border-[#E5D8C6]',
    settingsLabel: 'Preferences',
    settingsSubTab: 'preferences',
  };
  const planName = restaurant?.subscription?.plan?.name;

  const handleNavigate = (subTab = 'profile') => {
    if (navigateToSettings) {
      navigateToSettings(subTab);
    } else if (setActiveTab) {
      setActiveTab('settings');
    }
    setDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-[#E5D8C6] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(41,35,31,0.04)]">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={() => setMobileSidebarOpen && setMobileSidebarOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6] transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-xl text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6] transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[#92400E]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-[#5B6470]" />
          )}
        </button>

        {/* Brand Icon & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#92400E] to-[#D97706] flex items-center justify-center shadow-md shadow-[#92400E]/20 shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-bold text-[#1F2937] text-lg tracking-tight shrink-0">POS</span>
            {role === 'RESTAURANT_REGISTRATION_ADMIN' ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#E5D8C6] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#5B6470] truncate max-w-[120px] sm:max-w-none">
                  Platform Super Admin
                </span>
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#92400E]/10 text-[#92400E] border border-[#92400E]/25 shrink-0 shadow-xs">
                  SUPER ADMIN
                </span>
              </div>
            ) : (
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2">
                  {restaurant?.name && (
                    <span className="text-xs sm:text-sm font-semibold text-[#5B6470] truncate max-w-[140px] sm:max-w-xs">
                      {restaurant.name}
                    </span>
                  )}
                  {planName && (
                    <span className="text-[10px] sm:text-[11px] bg-[#D97706]/10 text-[#92400E] font-bold px-2 py-0.5 rounded-full border border-[#D97706]/25 flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-[#D97706]" />
                      <span>{planName}</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: User, Quick Settings & Live Clock */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-2 text-[#1F2937] text-xs font-mono bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E5D8C6] shadow-sm">
          <Clock className="w-3.5 h-3.5 text-[#92400E]" />
          <span className="font-semibold">{time}</span>
        </div>

        {/* Quick Settings Action Button */}
        <button
          onClick={() => handleNavigate('profile')}
          title="Open Settings & Preferences"
          className={`p-2 rounded-xl transition-all duration-200 border cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#92400E] text-white border-[#92400E] shadow-sm'
              : 'text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border-[#E5D8C6]'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Card with Interactive Profile Dropdown */}
        <div className="relative pl-2 sm:pl-3 border-l border-[#E5D8C6] shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 sm:gap-2.5 p-1.5 rounded-xl hover:bg-[#F1E8DB] transition-colors cursor-pointer text-left shrink-0"
            title="Account Menu"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-[#1F2937] leading-tight truncate max-w-[130px] lg:max-w-none">{user?.name || 'Staff User'}</div>
              <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${currentBadge.color}`}>
                {currentBadge.label}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#E7DCCB] border border-[#E5D8C6] flex items-center justify-center font-bold text-[#92400E] text-sm shadow-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#5B6470] hidden sm:block shrink-0" />
          </button>

          {/* Floating Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5D8C6] rounded-2xl shadow-xl p-2 z-50 animate-scale-in">
              {/* User Identity Header */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E5D8C6] mb-2">
                <div className="font-semibold text-[#1F2937] text-sm truncate">{user?.name || 'Staff User'}</div>
                <div className="text-xs text-[#5B6470] truncate">{user?.email || 'user@pos.com'}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${currentBadge.color}`}>
                    {currentBadge.label}
                  </span>
                  {restaurant?.name && (
                    <span className="text-[10px] text-[#5B6470] font-medium truncate max-w-[120px]">
                      {restaurant.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Items: Exactly 2 role-independent items */}
              <div className="space-y-1">
                {/* 1. My Profile & Account */}
                <button
                  onClick={() => handleNavigate('profile')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1F2937] hover:bg-[#F1E8DB] transition-colors text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#92400E]" />
                  <span>My Profile & Account</span>
                </button>

                <div className="h-px bg-[#E5D8C6] my-1" />

                {/* 2. Sign Out */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
