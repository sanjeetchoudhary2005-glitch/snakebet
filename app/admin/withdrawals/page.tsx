'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
  user: {
    username: string;
  };
}

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    const notes = prompt('Admin notes (optional):');
    
    try {
      await fetch('/api/admin/withdraw/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          adminNotes: notes,
          approve
        })
      });
      fetchRequests();
    } catch (error) {
      console.error('Failed to process request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Admin: Withdrawal Requests</h1>
        <p className="text-muted mt-2">Manage pending withdrawal requests</p>
      </div>

      <div className="bg-secondary rounded-3xl overflow-hidden border border-gray-700">
        {requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-muted text-lg">No withdrawal requests</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-bold text-xl">₹{request.amount.toLocaleString()}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        request.status === 'APPROVED' ? 'bg-white/20 text-white' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-muted text-sm mb-2">
                      User: <span className="text-white font-semibold">{request.user.username}</span>
                    </div>
                    <div className="text-muted text-sm mb-2">
                      Method: <span className="text-white font-semibold">{request.method}</span>
                    </div>
                    {request.accountDetails.upiId && (
                      <div className="text-muted text-sm mb-2">
                        UPI ID: <span className="text-white font-mono">{request.accountDetails.upiId}</span>
                      </div>
                    )}
                    {request.accountDetails.account && (
                      <div className="text-muted text-sm mb-2">
                        Bank Account: <span className="text-white font-mono">{request.accountDetails.account}</span>
                      </div>
                    )}
                    {request.accountDetails.cryptoAddr && (
                      <div className="text-muted text-sm mb-2">
                        Crypto Address: <span className="text-white font-mono">{request.accountDetails.cryptoAddr}</span>
                      </div>
                    )}
                    <div className="text-muted text-xs">
                      Requested: {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {request.status === 'PENDING' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleProcessRequest(request.id, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white text-black font-bold rounded-xl transition-all"
                      >
                        <CheckCircle className="w-5 h-5" /> Approve
                      </button>
                      <button
                        onClick={() => handleProcessRequest(request.id, false)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
                      >
                        <XCircle className="w-5 h-5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
