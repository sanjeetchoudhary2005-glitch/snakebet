
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Bell, 
  Wallet, 
  User, 
  Menu, 
  X, 
  Trophy, 
  Dices, 
  TrendingUp, 
  Gift,
  Zap,
  Home,
  LogOut,
  Plus,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useWallet } from '@/context/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import PromoBar from './PromoBar';
import { AuthModal } from './AuthModal';
import { DepositModal } from './DepositModal';
import { SessionNetWidget } from './SessionNetWidget';
import { isSoundEnabled, playSound, setSoundEnabled } from '@/lib/sound';

const Navbar = () => {
  const { data: session, status, signIn, signOut } = useSession();
  const { balance = 0 } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playSound('click');
  };

  return (
    <>
      <nav className={cn(
        "sticky top-0 z-50 transition-all duration-500 border-b",
        scrolled 
          ? "glass-strong border-border-light shadow-lg" 
          : "glass border-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-14 h-14 bg-gradient-to-br from-primary via-primary-dark to-primary rounded-2xl flex items-center justify-center shadow-glow-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <Trophy className="relative w-8 h-8 text-black font-black" />
              </motion.div>
              <span className="text-4xl font-black tracking-tight text-white">
                Snakebet
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {[ 
                { href: '/', label: 'Home', icon: Home },
                { href: '/games', label: 'Casino', icon: Dices },
                { href: '/promotions', label: 'Promos', icon: Gift },
                { href: '/vip', label: 'VIP', icon: Trophy },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="relative group px-5 py-4 text-muted-light hover:text-white transition-all duration-300"
                  >
                    <span className="flex items-center gap-2 font-semibold text-base">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </span>
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark transition-all duration-300 group-hover:w-3/4 rounded-full" />
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Search */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className="group p-3.5 rounded-2xl bg-secondary-light hover:bg-secondary border border-border-light hover:border-primary/30 text-muted-light hover:text-primary transition-all duration-300"
              >
                <Search className="w-5.5 h-5.5" />
              </motion.button>

              {/* Notifications */}
              <Link href="/notifications" className="group relative">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3.5 rounded-2xl bg-secondary-light hover:bg-secondary border border-border-light hover:border-primary/30 text-muted-light hover:text-primary transition-all duration-300"
                >
                  <Bell className="w-5.5 h-5.5" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    3
                  </span>
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleSound}
                title={soundOn ? 'Sound on' : 'Sound off'}
                className="group p-3.5 rounded-2xl bg-secondary-light hover:bg-secondary border border-border-light hover:border-bv-gold/30 text-muted-light hover:text-bv-gold transition-all duration-300"
              >
                {soundOn ? <Volume2 className="w-5.5 h-5.5" /> : <VolumeX className="w-5.5 h-5.5" />}
              </motion.button>

              {session ? (
                <>
                  <SessionNetWidget />
                  {/* Wallet */}
                  <div className="flex items-center gap-3">
                    <Link href="/wallet" className="group">
                      <motion.button 
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-gradient-to-br from-secondary-light to-secondary border border-border-light hover:border-primary/40 hover:shadow-glow-white-sm transition-all duration-300"
                      >
                        <Wallet className="w-5.5 h-5.5 text-primary" />
                        <div className="text-left">
                          <div className="text-[10px] text-muted uppercase tracking-widest font-semibold">Balance</div>
                          <div className="text-white font-black text-lg">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      </motion.button>
                    </Link>
                    <motion.button 
                      onClick={() => setIsDepositModalOpen(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-black font-black rounded-2xl transition-all duration-300 shadow-glow-white"
                    >
                      <Plus className="w-5 h-5" />
                      Deposit
                    </motion.button>
                  </div>

                  {/* User Profile & Logout */}
                  <div className="flex items-center gap-3">
                    <Link href="/profile" className="flex items-center gap-3 p-2 rounded-2xl bg-secondary-light hover:bg-secondary border border-border-light hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                        <User className="w-5 h-5 text-black" />
                      </div>
                      <span className="text-white font-bold">
                        {session.user?.name || "User"}
                      </span>
                    </Link>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => signOut()}
                      className="p-3.5 rounded-2xl bg-secondary-light hover:bg-secondary border border-border-light hover:border-red-500 text-muted-light hover:text-red-500 transition-all"
                    >
                      <LogOut className="w-5.5 h-5.5" />
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  {/* Auth Buttons */}
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-6 py-3.5 text-muted-light hover:text-white transition-all duration-300 font-semibold"
                  >
                    Login
                  </button>
                  <motion.button 
                    onClick={() => setIsAuthModalOpen(true)}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(212,175,55,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-black font-black rounded-2xl transition-all duration-300 shadow-glow-white"
                  >
                    Get Started
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white p-3"
            >
              {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-strong border-t border-border-light"
            >
              <div className="px-5 py-10 space-y-4">
                {[ 
                  { href: '/', label: 'Home', icon: Home },
                  { href: '/games', label: 'Casino', icon: Dices },
                  { href: '/promotions', label: 'Promotions', icon: Gift },
                  { href: '/vip', label: 'VIP', icon: Trophy },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-6 py-4.5 rounded-2xl bg-secondary-light hover:bg-secondary text-white transition-all duration-300 border border-border-light hover:border-primary/30"
                    >
                      <Icon className="w-6 h-6 text-primary" />
                      <span className="font-bold text-lg">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Modal */}
        <GlobalSearch 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
        />
      </nav>
      <PromoBar />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <DepositModal open={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
    </>
  );
};

function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const results = [
    { type: 'game', title: 'Crash Extreme', icon: <Dices className="w-6 h-6 text-primary" /> },
    { type: 'game', title: 'Skybound', icon: <Dices className="w-6 h-6 text-primary" /> },
    { type: 'sport', title: 'Soccer - World Cup', icon: <TrendingUp className="w-6 h-6 text-primary" /> },
    { type: 'promo', title: 'Welcome Bonus', icon: <Gift className="w-6 h-6 text-primary" /> },
  ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-40 bg-black/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl mx-4 glass-strong border border-border-light rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 flex items-center gap-5 border-b border-border-light">
          <Search className="w-7 h-7 text-muted-light" />
          <input 
            autoFocus
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, sports, promos..."
            className="flex-1 bg-transparent text-white text-2xl placeholder:text-gray-600 outline-none font-semibold"
          />
          <button onClick={onClose} className="text-muted-light hover:text-white p-2 hover:bg-secondary rounded-xl transition-all">
            <X className="w-7 h-7" />
          </button>
        </div>
        <div className="p-8">
          {query.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="w-full text-left px-6 py-5 rounded-2xl hover:bg-secondary-light transition-all duration-300 flex items-center gap-5 border border-transparent hover:border-border-light"
                  onClick={onClose}
                >
                  {result.icon}
                  <div>
                    <div className="font-bold text-white text-lg">{result.title}</div>
                    <div className="text-xs text-muted uppercase tracking-widest font-semibold">{result.type}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Navbar;
