'use client';
import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, CheckCircle, XCircle, Clock, Eye, RefreshCw, X } from 'lucide-react';

interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  transactionId?: string;
  screenshotUrl?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
  userBalance: number;
  user: {
    username: string;
    email: string;
  };
  paymentAccount?: {
    label: string;
  };
}

export default function DepositRequestsManagement() {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Action Modals
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deposits?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch deposits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingId || !actionType) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/deposits', {
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
        fetchDeposits();
      }
    } catch (err) {
      console.error('Failed to process deposit', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Deposit Requests</h1>
          <p className="text-gray-400 text-sm mt-1 font-semibold">Verify deposit screenshots and credit user balances manually</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-2 overflow-x-auto pb-2">
        {[
          { id: 'PENDING', label: 'Pending Verification' },
          { id: 'APPROVED', label: 'Approved Deposits' },
          { id: 'REJECTED', label: 'Rejected Proofs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === tab.id
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
          <div className="text-center py-16 text-gray-500">No deposit requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0a0a0a] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold">
                  <th className="p-4">User</th>
                  <th className="p-4">Amount Claimed</th>
                  <th className="p-4">Reference ID</th>
                  <th className="p-4">Uploaded Proof</th>
                  <th className="p-4">Destination Channel</th>
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
                    <td className="p-4 font-black text-white text-sm">₹{r.amount.toLocaleString()}</td>
                    <td className="p-4 font-mono text-gray-300 font-bold">{r.transactionId || 'None'}</td>
                    <td className="p-4">
                      {r.screenshotUrl ? (
                        <button
                          onClick={() => setPreviewUrl(r.screenshotUrl || null)}
                          className="px-3 py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-[#FFFFFF] font-bold rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Proof
                        </button>
                      ) : (
                        <span className="text-gray-600 font-medium">No Image</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-300">
                        {r.paymentAccount?.label || 'Direct Wallet'}
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono bg-gray-900 px-2 py-0.5 rounded mt-1 inline-block">
                        {r.method}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {r.status === 'PENDING' ? (
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
                        </div>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          r.status === 'APPROVED'
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

      {/* Screenshot Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-4 max-w-xl w-full relative">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 bg-gray-900 p-2 rounded-full border border-gray-800 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mt-8 flex justify-center max-h-[70vh] overflow-hidden rounded-xl border border-gray-800">
              <img src={previewUrl} alt="Deposit Proof screenshot" className="object-contain max-h-full max-w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {processingId && actionType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                {actionType === 'APPROVE' ? 'Approve Deposit' : 'Reject Deposit'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {actionType === 'APPROVE'
                  ? 'Confirming will credit the amount directly to the user platform balance.'
                  : 'Rejections require a note so players understand why it was declined.'}
              </p>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  {actionType === 'REJECT' ? 'Reason for Rejection' : 'Admin Note'}
                </label>
                <input
                  type="text"
                  required={actionType === 'REJECT'}
                  placeholder={actionType === 'REJECT' ? 'Transaction ID not matching, fake proof, etc.' : 'Optional reference number'}
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
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
