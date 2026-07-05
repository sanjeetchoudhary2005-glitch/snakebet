'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Gamepad2,
  Receipt,
  Megaphone,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Clock
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Payment Accounts', href: '/admin/dashboard/payments', icon: CreditCard },
  { label: 'User Management', href: '/admin/dashboard/users', icon: Users },
  { label: 'Withdrawals', href: '/admin/dashboard/withdrawals', icon: ArrowUpRight },
  { label: 'Deposits', href: '/admin/dashboard/deposits', icon: ArrowDownLeft },
  { label: 'Game Control', href: '/admin/dashboard/games', icon: Gamepad2 },
  { label: 'Transactions', href: '/admin/dashboard/transactions', icon: Receipt },
  { label: 'Promotions', href: '/admin/dashboard/promotions', icon: Megaphone },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // 30-minute inactivity timeout
  useEffect(() => {
    const INACTIVITY_LIMIT = 30 * 60 * 1000;

    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
        handleLogout();
      }
    }, 10000);

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [lastActivity]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 flex flex-col md:flex-row font-sans selection:bg-[#FFFFFF] selection:text-black">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111111] border-r border-gray-800 shrink-0 sticky top-0 h-screen z-20">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF]/10 border border-[#FFFFFF]/30 flex items-center justify-center text-[#FFFFFF]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-lg text-white tracking-tight leading-none">
              Snakebet
            </h2>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#FFFFFF] text-black shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#111111] border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#FFFFFF]" />
          <span className="font-bold text-white">Snakebet Admin</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-400 hover:text-white">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#111111] border-b border-gray-800 p-4 space-y-2 sticky top-[65px] z-20">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                  isActive ? 'bg-[#FFFFFF] text-black' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-950/40 text-red-400 rounded-xl text-sm font-semibold"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#111111]/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-4 h-4 text-[#FFFFFF]" /> Auto session security active (30m limit)
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-300 font-medium">
              Role: <span className="text-[#FFFFFF] font-bold">SUPER ADMIN</span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
