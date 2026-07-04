'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, Key, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';
import { useSession } from '@/context/SessionContext';
import { useWallet } from '@/context/WalletContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn } = useSession();
  const { refresh } = useWallet();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'otp'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState('');
  const [unverifiedUserId, setUnverifiedUserId] = useState('');

  if (!isOpen) return null;

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Guest login failed');

      await signIn();
      await refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          if (data.error && data.error.toLowerCase().includes('verify')) {
            // Need verification - send them to OTP if we can get user ID or ask them to sign up
            throw new Error(data.error);
          }
          throw new Error(data.error || 'Login failed');
        }

        await signIn();
        await refresh();
        onClose();

      } else if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            password,
            referralCode: referralCode || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');

        setUnverifiedUserId(data.userId);
        setSuccessMsg('Account created! Please check your email for OTP.');
        setMode('otp');

      } else if (mode === 'otp') {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: unverifiedUserId,
            otp,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'OTP verification failed');

        setSuccessMsg('Account verified successfully! You can now log in.');
        setMode('login');
        setPassword(''); // clear password for safety

      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
        setSuccessMsg(data.message || 'If the email matches an account, a reset link has been sent.');
        setTimeout(() => setMode('login'), 2500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-3xl border border-gray-700 shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600" />
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-8">
          <h2 className="text-3xl font-bold text-white text-center mb-2">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'otp' && 'Verify OTP'}
          </h2>
          <p className="text-gray-400 text-center mb-6">
            {mode === 'login' && 'Sign in to continue playing'}
            {mode === 'signup' && 'Get started with Snakebet'}
            {mode === 'forgot' && 'Enter your email to reset password'}
            {mode === 'otp' && 'Enter the 6-digit code sent to your email'}
          </p>

          {/* Quick Demo Play Header */}
          {mode === 'login' && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 flex flex-col items-center text-center gap-2">
              <span className="text-xs font-semibold text-yellow-500 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Quick Play Mode
              </span>
              <p className="text-[11px] text-gray-400">Want to test the games immediately? Play with ₹10,000 demo cash.</p>
              <Button 
                onClick={handleGuestLogin}
                variant="primary"
                size="sm"
                className="w-full mt-1 font-black"
                disabled={loading}
              >
                Instant Guest Play (₹10,000)
              </Button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-950/40 border border-green-800/40 rounded-xl text-green-400 text-xs font-semibold text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Username</label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Your username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Referral Code (Optional)</label>
                  <div className="relative">
                    <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="XXXXXX" 
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'otp' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">6-Digit Verification Code</label>
                <div className="relative">
                  <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="123456" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary text-sm tracking-widest font-mono text-center"
                    required
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot' && mode !== 'otp' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-primary text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === 'forgot' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary text-sm"
                    required
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Processing...' : (
                mode === 'login' ? 'Sign In' : 
                mode === 'signup' ? 'Create Account' : 
                mode === 'otp' ? 'Verify Code' :
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'login' && (
              <div className="space-y-2">
                <button onClick={() => { setMode('forgot'); setError(null); }} className="text-primary text-sm hover:underline">
                  Forgot Password?
                </button>
                <div className="text-gray-400 text-sm">
                  Don&apos;t have an account? <button onClick={() => { setMode('signup'); setError(null); }} className="text-primary hover:underline">Sign Up</button>
                </div>
              </div>
            )}
            {mode === 'signup' && (
              <div className="text-gray-400 text-sm">
                Already have an account? <button onClick={() => { setMode('login'); setError(null); }} className="text-primary hover:underline">Sign In</button>
              </div>
            )}
            {mode === 'forgot' && (
              <div className="text-gray-400 text-sm">
                Remember your password? <button onClick={() => { setMode('login'); setError(null); }} className="text-primary hover:underline">Sign In</button>
              </div>
            )}
            {mode === 'otp' && (
              <div className="text-gray-400 text-sm">
                Incorrect email? <button onClick={() => { setMode('signup'); setError(null); }} className="text-primary hover:underline">Back to Sign Up</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
