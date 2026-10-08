import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ChefHat,
  LayoutGrid,
  Receipt,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

import restaurantHero from '../assets/restaurant_hero.jpg';

export default function LoginView({ onNavigateToForgotPassword, onLoginSuccess }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const authResult = await login(email.trim(), password);
      if (onLoginSuccess && authResult?.defaultPath) {
        onLoginSuccess(authResult);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const featurePoints = [
    {
      title: 'Faster Order Processing',
      desc: 'Instant dine-in, takeaway, and split-ticket settlement in seconds',
      icon: UtensilsCrossed,
    },
    {
      title: 'Seamless Kitchen Management',
      desc: 'Live digital KDS dispatch with automated recipe inventory deductions',
      icon: ChefHat,
    },
    {
      title: 'Smarter Inventory Control',
      desc: 'Real-time ingredient depletion alerts, supplier POs, and stock audits',
      icon: LayoutGrid,
    },
    {
      title: 'Detailed Sales Insights',
      desc: 'Executive revenue velocity, table turnover rates, and profit margins',
      icon: Receipt,
    },
  ];

  return (
    <div className="min-h-screen w-screen bg-[#FAF7F2] flex flex-col lg:flex-row overflow-x-hidden lg:h-screen lg:overflow-hidden select-none font-sans">
      {/* ============================================================ */}
      {/* LEFT SECTION — RESTAURANT & FOOD HERO (52-55% Width)        */}
      {/* ============================================================ */}
      <div className="relative lg:w-[54%] min-h-[520px] lg:h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16 text-white overflow-hidden bg-[#1F1A17] shrink-0">
        {/* Background Image with Gourmet Plated Food & Warm Dining Room (Zero People) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
          style={{
            backgroundImage: `url(${restaurantHero})`,
          }}
        />
        {/* Warm Subtle Multi-Stop Gradient Overlay (Preserves Food Visibility & Rich Ambient Lighting) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1612]/75 via-[#1C1612]/40 to-[#1C1612]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#92400E]/20 via-transparent to-[#1C1612]/50" />

        {/* Top Header: Brand Icon & SaaS Pill */}
        <div className="relative z-10 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#92400E] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#92400E]/30 border border-white/20">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white font-sans">POS</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 text-[#FDE68A] px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-md">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-[#E7DCCB] font-medium tracking-wide">Restaurant Management System</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-[#FAF7F2]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="font-semibold">All Systems Operational</span>
          </div>
        </div>

        {/* Center: Hero Heading & Feature Highlights */}
        <div className="relative z-10 my-auto py-8 max-w-xl animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#92400E]/40 border border-[#D97706]/40 text-[#FDE68A] text-xs font-semibold mb-4 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Powering Modern Restaurants</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-white tracking-tight leading-[1.15]">
            Powering Modern Restaurants
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-[#E7DCCB] leading-relaxed font-normal">
            Orders, Kitchen, Tables, Billing. Everything in one integrated POS.
          </p>

          {/* Feature List (4 compact points with subtle staggered entrance) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
            {featurePoints.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-black/35 border border-white/10 backdrop-blur-md hover:bg-black/45 hover:border-white/20 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#92400E] to-[#D97706] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>{feature.title}</span>
                      <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                    </h3>
                    <p className="text-[11px] text-[#D6C9B9] mt-0.5 leading-snug">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Hero Trust Section */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-[#D6C9B9]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-white">
              TRUSTED BY MODERN RESTAURANTS
            </span>
          </div>
          <div className="text-[11px] text-[#E7DCCB] font-medium tracking-wide">
            Simple &nbsp;•&nbsp; Powerful &nbsp;•&nbsp; Reliable
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT SECTION — WARM SANDSTONE LOGIN (45-48% Width)          */}
      {/* ============================================================ */}
      <div className="lg:w-[46%] min-h-screen lg:h-full flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#FAF7F2] relative overflow-y-auto">
        {/* Subtle Decorative Botanical & Organic Ambient Shapes */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#E7DCCB]/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle decorative leaf accent outline in background */}
        <svg
          className="absolute -bottom-8 -right-8 w-64 h-64 text-[#E5D8C6]/40 pointer-events-none select-none"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M190 190C190 110 130 50 50 50C50 130 110 190 190 190Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M170 170C170 100 120 50 50 50"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>

        <div className="w-full max-w-[440px] relative z-10 animate-fade-in my-auto">
          {/* Top Brand Identity (Outside / Atop Card) */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#92400E] to-[#D97706] flex items-center justify-center shadow-lg shadow-[#92400E]/20 mx-auto mb-3">
              <UtensilsCrossed className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">POS</h2>
            <p className="text-xs text-[#5B6470] mt-1 font-medium">
              Enterprise Restaurant Point-of-Sale System
            </p>
          </div>

          {/* Premium White Login Card */}
          <div className="bg-white border border-[#E5D8C6] rounded-3xl p-7 sm:p-9 shadow-[0_10px_35px_-5px_rgba(41,35,31,0.06)] transition-all">
            {/* Form Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[#1F2937] tracking-tight">Welcome Back</h3>
              <p className="text-xs text-[#5B6470] mt-1">
                Sign in to access your restaurant terminal
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-slide-up">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="flex-1 leading-snug">{errorMsg}</span>
                <button
                  type="button"
                  onClick={() => setErrorMsg('')}
                  className="text-rose-500 hover:text-rose-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#5B6470] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-[#1F2937] placeholder-[#8C7E72] focus:outline-none focus:border-[#92400E] focus:ring-2 focus:ring-[#92400E]/20 transition-all font-medium"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToForgotPassword) {
                        onNavigateToForgotPassword();
                      } else {
                        window.history.pushState(null, '', '/forgot-password');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className="text-xs font-semibold text-[#92400E] hover:text-[#78350F] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5B6470] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-10 pr-11 py-2.5 sm:py-3 text-sm text-[#1F2937] placeholder-[#8C7E72] focus:outline-none focus:border-[#92400E] focus:ring-2 focus:ring-[#92400E]/20 transition-all font-medium"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] p-1.5 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep Me Signed In Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#5B6470] font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E5D8C6] text-[#92400E] focus:ring-[#92400E] accent-[#92400E]"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              {/* Primary CTA Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-2 bg-[#92400E] hover:bg-[#78350F] active:bg-[#5F280A] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md shadow-[#92400E]/20 hover:shadow-lg hover:shadow-[#92400E]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#92400E] focus:ring-offset-2 mt-2"
              >
                <span>{loading ? 'Authenticating Terminal...' : 'Sign In to Terminal'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {/* Security Guarantee Notice */}
            <div className="mt-7 pt-5 border-t border-[#E5D8C6] text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#5B6470] font-medium">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>Secure login • Your data is protected</span>
              </div>
            </div>
          </div>

          {/* Role Compatibility Helper Chip */}
          <div className="mt-4 p-2.5 rounded-xl bg-white/70 border border-[#E5D8C6] text-center text-xs text-[#5B6470]">
            <span>Supported Roles: </span>
            <span className="font-semibold text-[#1F2937]">Owner • Super Admin • Chef • Waiter • Cashier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
