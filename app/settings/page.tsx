'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  User, 
  Wallet, 
  Moon, 
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Timer,
  Lock,
  HelpCircle,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    promotions: true
  });

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD');

  // Responsible Gaming state
  const [responsibleGaming, setResponsibleGaming] = useState({
    depositLimitDaily: 10000,
    depositLimitWeekly: 50000,
    depositLimitMonthly: 200000,
    lossLimitDaily: 5000,
    sessionLimit: 60,
    realityCheck: 30,
    coolingOff: false,
    coolingOffDuration: '24h',
    selfExclude: false
  });
  const [selfExclusionStatus, setSelfExclusionStatus] = useState<{ active: boolean; exclusion?: { until: string | null } } | null>(null);
  const [savingExclusion, setSavingExclusion] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  useEffect(() => {
    fetch('/api/responsible-gaming/self-exclusion')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setSelfExclusionStatus(data);
      })
      .catch(() => undefined);

    fetch('/api/responsible-gaming/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data) return;
        setResponsibleGaming((current) => ({
          ...current,
          depositLimitDaily: data.depositLimitDaily ?? current.depositLimitDaily,
          sessionLimit: data.sessionLimit ?? current.sessionLimit,
        }));
      })
      .catch(() => undefined);
  }, []);

  const toggleNotification = (key: string) => {
    setNotifications({ ...notifications, [key]: !notifications[key as keyof typeof notifications] });
  };

  const saveSelfExclusion = async (period: '24h' | '7d' | '30d' | 'permanent') => {
    const label = period === 'permanent' ? 'permanently' : `for ${period}`;
    if (!confirm(`Take a break ${label}? You will not be able to log in or place bets during this period.`)) return;

    setSavingExclusion(true);
    setSettingsMessage('');
    try {
      const res = await fetch('/api/responsible-gaming/self-exclusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save self-exclusion');
      setSelfExclusionStatus(data);
      setSettingsMessage('Your break has been saved.');
    } catch (error: any) {
      setSettingsMessage(error.message || 'Unable to save self-exclusion');
    } finally {
      setSavingExclusion(false);
    }
  };

  const saveResponsibleGaming = async () => {
    setSavingSettings(true);
    setSettingsMessage('');
    try {
      const res = await fetch('/api/responsible-gaming/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositLimitDaily: responsibleGaming.depositLimitDaily,
          sessionLimit: responsibleGaming.sessionLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save limits');
      setResponsibleGaming((current) => ({
        ...current,
        depositLimitDaily: data.depositLimitDaily ?? current.depositLimitDaily,
        sessionLimit: data.sessionLimit ?? current.sessionLimit,
      }));
      setSettingsMessage('Responsible gaming limits saved.');
    } catch (error: any) {
      setSettingsMessage(error.message || 'Unable to save limits');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted mt-2">Customize your experience</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        <div className="bg-[#141414] rounded-2xl p-8 border border-[#2A2A2A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#FFFFFF]/20 rounded-xl">
              <Bell className="w-6 h-6 text-[#FFFFFF]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <p className="text-[#94A3B8]">Manage how we contact you</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'push', label: 'Push Notifications', desc: 'Browser notifications' },
              { key: 'sms', label: 'SMS Alerts', desc: 'Text message updates' },
              { key: 'promotions', label: 'Promotions & Bonuses', desc: 'Get notified about new offers' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-[#0B0B0B] rounded-xl border border-[#2A2A2A]">
                <div>
                  <div className="font-bold text-white">{item.label}</div>
                  <div className="text-sm text-[#94A3B8]">{item.desc}</div>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`w-14 h-7 rounded-full transition-all relative ${notifications[item.key as keyof typeof notifications] ? 'bg-[#FFFFFF]' : 'bg-[#2A2A2A]'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${notifications[item.key as keyof typeof notifications] ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] rounded-2xl p-8 border border-[#2A2A2A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#FFFFFF]/20 rounded-xl">
              <Palette className="w-6 h-6 text-[#FFFFFF]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Appearance</h2>
              <p className="text-[#94A3B8]">Customize how Snakebet looks</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`p-6 rounded-xl text-left transition-all border-2 ${theme === 'dark' ? 'border-[#FFFFFF] bg-[#0B0B0B]' : 'border-transparent bg-[#0B0B0B] hover:border-[#FFFFFF]/30'}`}
            >
              <Moon className="w-8 h-8 mb-3 text-white" />
              <div className="font-bold text-white">Dark Mode</div>
              <div className="text-sm text-[#94A3B8]">Easy on the eyes</div>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-6 rounded-xl text-left transition-all border-2 ${theme === 'light' ? 'border-[#FFFFFF] bg-[#0B0B0B]' : 'border-transparent bg-[#0B0B0B] hover:border-[#FFFFFF]/30'}`}
            >
              <div className="w-8 h-8 bg-yellow-400 rounded-full mb-3 flex items-center justify-center">☀️</div>
              <div className="font-bold text-white">Light Mode</div>
              <div className="text-sm text-[#94A3B8]">Bright and clean</div>
            </button>
          </div>
        </div>

        <div className="bg-[#141414] rounded-2xl p-8 border border-[#2A2A2A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#FFFFFF]/20 rounded-xl">
              <Globe className="w-6 h-6 text-[#FFFFFF]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Preferences</h2>
              <p className="text-[#94A3B8]">Language and currency settings</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-[#94A3B8] block mb-2">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFFFFF] transition-colors text-white"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Portuguese</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#94A3B8] block mb-2">Currency</label>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFFFFF] transition-colors text-white"
              >
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>BTC</option>
                <option>ETH</option>
              </select>
            </div>
          </div>
        </div>

        {/* Responsible Gaming Section */}
        <div className="bg-[#141414] rounded-2xl p-8 border border-[#2A2A2A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Responsible Gaming</h2>
              <p className="text-[#94A3B8]">Tools to help you play responsibly</p>
            </div>
          </div>

          {/* Age Verification Reminder */}
          <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div className="text-yellow-400 font-bold">Important Reminder</div>
            </div>
            <p className="text-[#94A3B8]">You must be 18 years or older to play on Snakebet. Please gamble responsibly.</p>
          </div>

          <div className="space-y-8">
            {settingsMessage && (
              <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A] text-[#94A3B8]">
                {settingsMessage}
              </div>
            )}
            {selfExclusionStatus?.active && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                Active self-exclusion {selfExclusionStatus.exclusion?.until ? `until ${new Date(selfExclusionStatus.exclusion.until).toLocaleString()}` : 'permanently'}.
              </div>
            )}
            {/* Deposit Limits */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#FFFFFF]" />
                Deposit Limits
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-[#94A3B8] block mb-2">Daily Limit (₹)</label>
                  <select 
                    value={responsibleGaming.depositLimitDaily}
                    onChange={(e) => setResponsibleGaming({ ...responsibleGaming, depositLimitDaily: Number(e.target.value) })}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFFFFF] transition-colors text-white"
                  >
                    <option value={5000}>5,000</option>
                    <option value={10000}>10,000</option>
                    <option value={25000}>25,000</option>
                    <option value={50000}>50,000</option>
                    <option value={100000}>100,000</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={saveResponsibleGaming}
                disabled={savingSettings}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFFFFF] text-black font-semibold disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {savingSettings ? 'Saving...' : 'Save Limits'}
              </button>
            </div>

            {/* Loss Limits */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FFFFFF]" />
                Loss Limits
              </h3>
              <div>
                <label className="text-sm text-[#94A3B8] block mb-2">Daily Loss Limit (₹)</label>
                <select 
                  value={responsibleGaming.lossLimitDaily}
                  onChange={(e) => setResponsibleGaming({ ...responsibleGaming, lossLimitDaily: Number(e.target.value) })}
                  className="w-full md:w-1/3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFFFFF] transition-colors text-white"
                >
                  <option value={2000}>2,000</option>
                  <option value={5000}>5,000</option>
                  <option value={10000}>10,000</option>
                  <option value={25000}>25,000</option>
                </select>
              </div>
            </div>

            {/* Session & Reality Checks */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-[#FFFFFF]" />
                Session & Reality Checks
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-[#94A3B8] block mb-2">Session Limit (minutes)</label>
                  <select 
                    value={responsibleGaming.sessionLimit}
                    onChange={(e) => setResponsibleGaming({ ...responsibleGaming, sessionLimit: Number(e.target.value) })}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFFFFF] transition-colors text-white"
                  >
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                    <option value={120}>120</option>
                    <option value={180}>180</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#94A3B8] block mb-2">Reality Check (minutes)</label>
                  <select 
                    value={responsibleGaming.realityCheck}
                    onChange={(e) => setResponsibleGaming({ ...responsibleGaming, realityCheck: Number(e.target.value) })}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-3 focus:outline-none focus:border-[#FFFFFF] transition-colors text-white"
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cooling Off & Self Exclude */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Temporary Exclusions
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setResponsibleGaming({ ...responsibleGaming, coolingOff: !responsibleGaming.coolingOff })}
                  className={`p-6 rounded-xl text-left transition-all border-2 ${responsibleGaming.coolingOff ? 'border-red-500 bg-red-500/10' : 'border-transparent bg-[#0B0B0B] hover:border-red-500/30'}`}
                >
                  <div className="font-bold text-white mb-2">Cooling Off Period</div>
                  <div className="text-sm text-[#94A3B8] mb-4">Temporarily suspend your account</div>
                  <select 
                    value={responsibleGaming.coolingOffDuration}
                    onChange={(e) => setResponsibleGaming({ ...responsibleGaming, coolingOffDuration: e.target.value })}
                    className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2"
                  >
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                  </select>
                </button>
                <div className="p-6 rounded-xl text-left bg-red-500/10 border-2 border-red-500/30">
                  <div className="font-bold text-red-400 mb-2">Take a Break</div>
                  <div className="text-sm text-[#94A3B8] mb-4">Block login and gameplay for a chosen period.</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['24h', '24 Hours'],
                      ['7d', '7 Days'],
                      ['30d', '30 Days'],
                      ['permanent', 'Permanent'],
                    ].map(([period, label]) => (
                      <button
                        key={period}
                        type="button"
                        disabled={savingExclusion || selfExclusionStatus?.active}
                        onClick={() => saveSelfExclusion(period as '24h' | '7d' | '30d' | 'permanent')}
                        className="px-3 py-2 rounded-lg bg-[#0B0B0B] border border-[#2A2A2A] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Help Links */}
            <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="w-6 h-6 text-blue-400" />
                <div className="text-blue-400 font-bold">Need Help?</div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="p-4 bg-[#0B0B0B] rounded-xl hover:bg-[#0B0B0B]/80 transition-colors">
                  <div className="font-bold text-white">Gamblers Anonymous</div>
                  <div className="text-sm text-[#94A3B8]">Support groups</div>
                </a>
                <a href="https://www.gambleaware.org" target="_blank" rel="noopener noreferrer" className="p-4 bg-[#0B0B0B] rounded-xl hover:bg-[#0B0B0B]/80 transition-colors">
                  <div className="font-bold text-white">GambleAware</div>
                  <div className="text-sm text-[#94A3B8]">Information & resources</div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#141414] rounded-2xl p-8 border border-[#2A2A2A]">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Danger Zone</h2>
              <p className="text-[#94A3B8]">Be careful with these actions</p>
            </div>
          </div>

          <div className="space-y-4">
            <button className="w-full p-4 bg-[#0B0B0B] rounded-xl text-left hover:bg-red-500/10 transition-colors flex items-center justify-between group border border-[#2A2A2A] hover:border-red-500/30">
              <div>
                <div className="font-bold text-red-400">Deactivate Account</div>
                <div className="text-sm text-[#94A3B8]">Temporarily disable your account</div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-red-400" />
            </button>
            <button className="w-full p-4 bg-[#0B0B0B] rounded-xl text-left hover:bg-red-500/10 transition-colors flex items-center justify-between group border border-[#2A2A2A] hover:border-red-500/30">
              <div>
                <div className="font-bold text-red-400">Delete Account</div>
                <div className="text-sm text-[#94A3B8]">Permanently delete all your data</div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#94A3B8] group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
