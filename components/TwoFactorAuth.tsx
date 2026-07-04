'use client';

import { useState, useEffect } from 'react';

export function TwoFactorAuth() {
  const [step, setStep] = useState<'setup' | 'verify' | 'enabled'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [encryptedSecret, setEncryptedSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    // In real app, you'd check the user's 2FA status via an API
    setStep('setup');
  };

  const setup2FA = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/2fa/setup');
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setEncryptedSecret(data.encryptedSecret);
      setStep('verify');
    } catch (error) {
      setMessage('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, encryptedSecret }),
      });
      if (res.ok) {
        setStep('enabled');
        setMessage('2FA enabled successfully!');
      } else {
        setMessage('Invalid 2FA code');
      }
    } catch (error) {
      setMessage('Failed to verify 2FA');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
      });
      if (res.ok) {
        setStep('setup');
        setMessage('2FA disabled');
      }
    } catch (error) {
      setMessage('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl max-w-md mx-auto">
      <h3 className="font-bold text-xl mb-4">🔐 Two-Factor Authentication</h3>

      {step === 'setup' && (
        <div>
          <p className="text-gray-400 mb-4">Add an extra layer of security to your account</p>
          <button
            onClick={setup2FA}
            disabled={loading}
            className="w-full py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <p className="text-gray-400 mb-4">Scan the QR code with Google Authenticator or Authy</p>
          <img src={qrCode} alt="QR Code" className="mx-auto mb-4" />
          <p className="text-xs text-gray-500 mb-4">Secret: {secret}</p>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full p-3 bg-gray-700 rounded-lg mb-4"
            maxLength={6}
          />
          <button
            onClick={verify2FA}
            disabled={loading}
            className="w-full py-3 bg-white text-black rounded-lg font-bold hover:bg-white disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
      )}

      {step === 'enabled' && (
        <div>
          <p className="text-white mb-4">✅ 2FA is enabled</p>
          <button
            onClick={disable2FA}
            disabled={loading}
            className="w-full py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-400 disabled:opacity-50"
          >
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-center text-gray-300">{message}</p>}
    </div>
  );
}
