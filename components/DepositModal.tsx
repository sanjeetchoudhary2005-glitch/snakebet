'use client';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';

export function DepositModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { depositLimits } = useWallet();
  const [amount, setAmount] = useState<number>(depositLimits.presets[0]);
  const [method, setMethod] = useState<'upi' | 'card'>('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleDeposit = async () => {
    setError('');
    if (amount < depositLimits.min) {
      setError(`Minimum deposit is ₹${depositLimits.min}`);
      return;
    }
    if (amount > depositLimits.max) {
      setError(`Maximum deposit is ₹${depositLimits.max}`);
      return;
    }
    setLoading(true);

    try {
      if (method === 'upi') {
        const res = await fetch('/api/payments/upi', {
          method: 'POST',
          body: JSON.stringify({ amount }),
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment initiation failed');
        // Open UPI app
        window.location.href = data.upiLink;
        // After payment, user will return; we rely on webhook to add balance.
        // Navigate to success page
        setTimeout(() => {
          onClose();
          router.push('/dashboard/deposit-success');
        }, 1000);
      } else if (method === 'card') {
        const res = await fetch('/api/payments/razorpay', {
          method: 'POST',
          body: JSON.stringify({ amount }),
          headers: { 'Content-Type': 'application/json' },
        });
        const order = await res.json();
        if (!res.ok) throw new Error(order.error || 'Payment initiation failed');
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
          amount: order.amount,
          currency: 'INR',
          name: 'Snakebet',
          order_id: order.id,
          handler: async (response: any) => {
            // Webhook will handle verification; navigate to success page
            onClose();
            router.push('/dashboard/deposit-success');
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-white">Deposit Funds</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">Amount (Min ₹{depositLimits.min})</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {depositLimits.presets.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`px-4 py-2 rounded-md ${amount === val ? 'bg-primary text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
              >
                ₹{val}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={depositLimits.min}
            max={depositLimits.max}
            className="w-full p-2 bg-background rounded-md border border-gray-700 text-white"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">Payment Method</label>
          <div className="flex gap-2">
            {['upi', 'card'].map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m as any)}
                className={`flex-1 py-2 rounded-md ${method === m ? 'bg-primary text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
              >
                {m === 'upi' && '📱 UPI'}
                {m === 'card' && '💳 Card'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleDeposit}
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary-dark text-black font-bold rounded-md disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Deposit ₹${amount}`}
        </button>
        <button onClick={onClose} className="w-full mt-2 py-2 text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  );
}
