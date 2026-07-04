'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export function WithdrawModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { balance, withdrawLimits, refresh } = useWallet();
  const [amount, setAmount] = useState<number>(withdrawLimits.min);
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({ account: '', ifsc: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleWithdraw = async () => {
    setError('');
    if (amount < withdrawLimits.min) {
      setError(`Minimum withdrawal is ₹${withdrawLimits.min}`);
      return;
    }
    if (amount > balance) {
      setError(`Insufficient balance. You have ₹${balance}`);
      return;
    }
    if (method === 'upi' && !upiId) {
      setError('Please enter your UPI ID');
      return;
    }
    if (method === 'bank' && (!bankDetails.account || !bankDetails.ifsc)) {
      setError('Please fill bank details');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        amount,
        method: method.toUpperCase(),
        accountDetails: method === 'upi' ? { upiId } : bankDetails,
      };
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        alert('Withdrawal request submitted. It will be processed within 24 hours.');
        await refresh();
        onClose();
      } else {
        setError(data.error || 'Failed to submit withdrawal');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-white">Withdraw Funds</h2>
        <p className="text-sm text-gray-400 mb-2">Available balance: ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">Amount (Min ₹{withdrawLimits.min})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={withdrawLimits.min}
            max={balance}
            className="w-full p-2 bg-background rounded-md border border-gray-700 text-white"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">Withdrawal Method</label>
          <div className="flex gap-2">
            {['upi', 'bank'].map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m as any)}
                className={`flex-1 py-2 rounded-md ${method === m ? 'bg-primary text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
              >
                {m === 'upi' && '📱 UPI'}
                {m === 'bank' && '🏦 Bank'}
              </button>
            ))}
          </div>
        </div>

        {method === 'upi' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">UPI ID</label>
            <input
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full p-2 bg-background rounded-md border border-gray-700 text-white"
            />
          </div>
        )}
        {method === 'bank' && (
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Account Number"
              value={bankDetails.account}
              onChange={(e) => setBankDetails({ ...bankDetails, account: e.target.value })}
              className="w-full p-2 bg-background rounded-md border border-gray-700 text-white"
            />
            <input
              type="text"
              placeholder="IFSC Code"
              value={bankDetails.ifsc}
              onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
              className="w-full p-2 bg-background rounded-md border border-gray-700 text-white"
            />
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary-dark text-black font-bold rounded-md disabled:opacity-50"
        >
          {loading ? 'Submitting...' : `Withdraw ₹${amount}`}
        </button>
        <button onClick={onClose} className="w-full mt-2 py-2 text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}
