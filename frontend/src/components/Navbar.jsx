import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Clock, LogOut, Building2, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, restaurant, logout, role } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const roleBadges = {
    RESTAURANT_REGISTRATION_ADMIN: { label: 'Platform Super Admin', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    RESTAURANT_OWNER: { label: 'Restaurant Admin', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    KITCHEN_ADMIN: { label: 'Kitchen Chef', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    WAITER: { label: 'Service Waiter', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    RECEPTIONIST: { label: 'Reception / Cashier', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  };

  const currentBadge = roleBadges[role] || { label: role, color: 'bg-slate-700 text-slate-300 border-slate-600' };
  const planName = restaurant?.subscription?.plan?.name;

  return (
    <header className="h-16 bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Brand & Restaurant Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
          <UtensilsCrossed className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-lg tracking-tight">ApexPOS</span>
            {role === 'RESTAURANT_REGISTRATION_ADMIN' ? (
              <span className="text-[11px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/40">
                Platform SaaS
              </span>
            ) : planName ? (
              <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{planName}</span>
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
            {role === 'RESTAURANT_REGISTRATION_ADMIN'
              ? 'Multi-Tenant Governance & Plan Control'
              : restaurant?.name || 'Restaurant Management System'}
          </p>
        </div>
      </div>

      {/* Right User & Live Clock */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-2 text-slate-300 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{time}</span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-white leading-tight">{user?.name || 'Staff User'}</div>
            <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-block mt-0.5 ${currentBadge.color}`}>
              {currentBadge.label}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-sm shadow-inner shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-900/50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
