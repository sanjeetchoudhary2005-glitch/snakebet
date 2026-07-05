'use client';
import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Clipboard, Eye } from 'lucide-react';

interface WithdrawRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  accountDetails: any;
  status: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
  userBalance: number;
  user: {
    username: string;
    email: string;
  };
}

export default function WithdrawalManagement() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ON_HOLD'>('PENDING');

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'HOLD' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${statusTab}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
        setTotalPendingAmount(data.totalPendingAmount);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusTab]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingId || !actionType) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: processingId,
          action: actionType,
          adminNotes: reasonInput
        })
      });

      if (res.ok) {
        setProcessingId(null);
        setActionType(null);
        setReasonInput('');
        fetchWithdrawals();
      }
    } catch (err) {
      console.error('Failed to update withdrawal', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDetailsDisplay = (details: any) => {
    if (details.upiId) return `UPI: ${details.upiId}`;
    if (details.cryptoAddr) return `Crypto (${details.network || 'BTC'}): ${details.cryptoAddr}`;
    if (details.account) {
      return `Bank: A/C ${details.account}, IFSC ${details.ifsc || 'N/A'}, Name: ${details.holder || 'N/A'}`;
    }
    return JSON.stringify(details);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Withdrawal Management</h1>
          <p className="text-gray-400 text-sm mt-1">Review, approve, or reject user cashout payouts</p>
        </div>
        
        {/* Pending Payout Card */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl px-5 py-3 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Pending Payouts</span>
            <div className="text-xl font-black text-white">₹{totalPendingAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-2 overflow-x-auto pb-2">
        {[
          { id: 'PENDING', label: 'Pending Requests' },
          { id: 'ON_HOLD', label: 'On Hold' },
          { id: 'APPROVED', label: 'Approved History' },
          { id: 'REJECTED', label: 'Rejected History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusTab === tab.id
                ? 'bg-[#FFFFFF] text-black shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                : 'text-gray-400 hover:text-white border border-gray-800 bg-[#111111]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table grid */}
      <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-[#FFFFFF] animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No withdrawal requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0a0a0a] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold">
                  <th className="p-4">User</th>
                  <th className="p-4">Requested Amount</th>
                  <th className="p-4">User Wallet Balance</th>
                  <th className="p-4">Payout Method & Details</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{r.user?.username || 'Unknown'}</div>
                      <div className="text-gray-500 font-mono text-[10px]">{r.userId}</div>
                    </td>
                    <td className="p-4 font-black text-red-400 text-sm">₹{r.amount.toLocaleString()}</td>
                    <td className="p-4 font-bold text-gray-200">₹{r.userBalance.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-300 font-mono break-all max-w-[280px]">
                        {getDetailsDisplay(r.accountDetails)}
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider bg-gray-900 px-2 py-0.5 rounded mt-1 inline-block">
                        {r.method}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {statusTab === 'PENDING' || statusTab === 'ON_HOLD' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setProcessingId(r.id); setActionType('APPROVE'); }}
                            className="px-3 py-1.5 bg-green-950/60 border border-green-800 hover:bg-green-900 text-white font-bold rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setProcessingId(r.id); setActionType('REJECT'); }}
                            className="px-3 py-1.5 bg-red-950/60 border border-red-800 hover:bg-red-900 text-red-400 font-bold rounded-lg transition-all"
                          >
                            Reject
                          </button>
                          {statusTab === 'PENDING' && (
                            <button
                              onClick={() => { setProcessingId(r.id); setActionType('HOLD'); }}
                              className="px-3 py-1.5 bg-yellow-950/60 border border-yellow-800 hover:bg-yellow-900 text-yellow-400 font-bold rounded-lg transition-all"
                            >
                              Hold
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          r.status === 'APPROVED' || r.status === 'COMPLETED'
                            ? 'bg-green-950/60 border border-green-800 text-white'
                            : 'bg-red-950/60 border border-red-800 text-red-400'
                        }`}>
                          {r.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation and Reason Modals */}
      {processingId && actionType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                {actionType === 'APPROVE' && 'Approve Withdrawal'}
                {actionType === 'REJECT' && 'Reject Withdrawal'}
                {actionType === 'HOLD' && 'Put Request on Hold'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {actionType === 'APPROVE' && 'This marks the withdrawal as paid and deducts from user liability.'}
                {actionType === 'REJECT' && 'This will return the requested amount back to the user balance.'}
                {actionType === 'HOLD' && 'This will move the request to Review status.'}
              </p>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  {actionType === 'REJECT' ? 'Reason for Rejection (sent to user)' : 'Internal Admin Notes'}
                </label>
                <input
                  type="text"
                  required={actionType === 'REJECT'}
                  placeholder={actionType === 'REJECT' ? 'Suspicious activity, invalid account info, etc.' : 'Optional reference ID'}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setProcessingId(null); setActionType(null); setReasonInput(''); }}
                  className="flex-1 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 font-bold rounded-xl transition-all text-xs ${
                    actionType === 'APPROVE' ? 'bg-[#FFFFFF] text-black hover:bg-[#b8860b]' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
