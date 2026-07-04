'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

type LedgerUser = {
  id: string;
  username: string;
  email: string | null;
  balance: string;
};

type Adjustment = {
  id: string;
  userId: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  reason: string | null;
  adminUserId: string | null;
  createdAt: string;
  user?: { username: string; email: string | null };
};

export default function AdminLedgerPage() {
  const [users, setUsers] = useState<LedgerUser[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ledger');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load ledger');
      setUsers(data.users || []);
      setAdjustments(data.adjustments || []);
      if (!userId && data.users?.[0]) setUserId(data.users[0].id);
    } catch (error: any) {
      setMessage(error.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: Number(amount), reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed');
      setAmount('');
      setReason('');
      setMessage('Adjustment saved.');
      await load();
    } catch (error: any) {
      setMessage(error.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/admin/surveillance" className="mb-4 flex items-center gap-2 text-muted hover:text-primary">
        <ArrowLeft className="h-5 w-5" /> Back to Admin
      </Link>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white">Manual Ledger</h1>
          <p className="mt-2 text-muted">Create audited balance adjustments.</p>
        </div>
        <button onClick={load} className="rounded-xl border border-[#2A2A2A] p-3 text-white hover:border-primary">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {message && <div className="mb-6 rounded-xl border border-[#2A2A2A] bg-[#141414] p-4 text-[#94A3B8]">{message}</div>}

      <form onSubmit={submit} className="mb-8 grid gap-4 rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 md:grid-cols-4">
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white">
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username} ({user.email || 'no email'})
            </option>
          ))}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount (+/-)" className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white" />
        <button disabled={submitting || !userId || !amount || reason.length < 5} className="rounded-xl bg-primary px-5 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? 'Saving...' : 'Adjust'}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#141414]">
        {loading ? (
          <div className="p-8 text-[#94A3B8]">Loading...</div>
        ) : adjustments.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">No manual adjustments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0B0B0B] text-[#94A3B8]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Before</th>
                  <th className="px-4 py-3">After</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-white">
                {adjustments.map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td className="px-4 py-3">{adjustment.user?.username || adjustment.userId}</td>
                    <td className={Number(adjustment.amount) >= 0 ? 'px-4 py-3 text-white' : 'px-4 py-3 text-red-300'}>₹{Number(adjustment.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">₹{Number(adjustment.balanceBefore).toFixed(2)}</td>
                    <td className="px-4 py-3">₹{Number(adjustment.balanceAfter).toFixed(2)}</td>
                    <td className="px-4 py-3">{adjustment.reason}</td>
                    <td className="px-4 py-3">{new Date(adjustment.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
