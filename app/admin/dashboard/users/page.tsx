'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Filter, Ban, CheckCircle, PlusCircle, MinusCircle, KeyRound, Eye, RefreshCw, X } from 'lucide-react';

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWon: number;
  totalBetsCount: number;
  isBanned: boolean;
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Action modals state
  const [activeModalUser, setActiveModalUser] = useState<UserItem | null>(null);
  const [modalType, setModalType] = useState<'ADD_BAL' | 'DED_BAL' | 'RESET_PWD' | 'BAN' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalUser || !modalType) return;
    setSubmitting(true);

    try {
      let actionName = '';
      let payload: any = { userId: activeModalUser.id };

      if (modalType === 'ADD_BAL') {
        actionName = 'ADD_BALANCE';
        payload.amount = Number(amountInput);
        payload.reason = reasonInput;
      } else if (modalType === 'DED_BAL') {
        actionName = 'DEDUCT_BALANCE';
        payload.amount = Number(amountInput);
        payload.reason = reasonInput;
      } else if (modalType === 'RESET_PWD') {
        actionName = 'RESET_PASSWORD';
        payload.newPassword = passwordInput;
      } else if (modalType === 'BAN') {
        actionName = activeModalUser.isBanned ? 'UNBAN' : 'BAN';
        payload.reason = reasonInput;
      }

      payload.action = actionName;

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActiveModalUser(null);
        setModalType(null);
        setAmountInput('');
        setReasonInput('');
        setPasswordInput('');
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch (err) {
      console.error('User action failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">Full registry of player accounts, balances, and moderation actions</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-[#111111] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by Username, Email, or User ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-xl text-sm text-white outline-none focus:border-[#FFFFFF]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-500 shrink-0 ml-2" />
          {['ALL', 'ACTIVE', 'BANNED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === f ? 'bg-[#FFFFFF] text-black shadow-[0_0_10px_rgba(0,255,136,0.2)]' : 'bg-[#0a0a0a] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {f} Users
            </button>
          ))}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-[#FFFFFF] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No user accounts found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0a0a0a] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold">
                  <th className="p-4">Player</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Deposited / Withdrawn</th>
                  <th className="p-4">Bets Placed</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((u) => {
                  const winRatio = u.totalBetsCount > 0 ? ((u.totalWon / Math.max(1, u.totalDeposited)) * 100).toFixed(0) : '0';
                  return (
                    <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{u.username}</div>
                        <div className="text-gray-500 font-mono text-[11px]">{u.email || u.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-black text-[#FFFFFF] text-sm">₹{u.balance.toLocaleString()}</div>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="text-white font-semibold">In: ₹{u.totalDeposited.toLocaleString()}</div>
                        <div className="text-red-400 font-semibold">Out: ₹{u.totalWithdrawn.toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-200">{u.totalBetsCount} bets</div>
                        <div className="text-gray-500 text-[10px]">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        {u.isBanned ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 font-bold text-[10px] inline-flex items-center gap-1">
                            <Ban className="w-3 h-3" /> BANNED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-green-950/60 border border-green-800 text-white font-bold text-[10px] inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/dashboard/users/${u.id}`}
                            title="View Full Profile"
                            className="p-2 bg-gray-900 hover:bg-gray-800 text-blue-400 rounded-lg border border-gray-800 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => { setActiveModalUser(u); setModalType('ADD_BAL'); }}
                            title="Add Balance"
                            className="p-2 bg-gray-900 hover:bg-gray-800 text-[#FFFFFF] rounded-lg border border-gray-800 transition-all"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActiveModalUser(u); setModalType('DED_BAL'); }}
                            title="Deduct Balance"
                            className="p-2 bg-gray-900 hover:bg-gray-800 text-yellow-400 rounded-lg border border-gray-800 transition-all"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActiveModalUser(u); setModalType('RESET_PWD'); }}
                            title="Reset Password"
                            className="p-2 bg-gray-900 hover:bg-gray-800 text-purple-400 rounded-lg border border-gray-800 transition-all"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActiveModalUser(u); setModalType('BAN'); }}
                            title={u.isBanned ? 'Unban User' : 'Ban User'}
                            className={`p-2 rounded-lg border transition-all ${
                              u.isBanned ? 'bg-green-950/40 border-green-900 text-white' : 'bg-red-950/40 border-red-900 text-red-400'
                            }`}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {activeModalUser && modalType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6 relative">
            <button
              onClick={() => { setActiveModalUser(null); setModalType(null); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-white">
                {modalType === 'ADD_BAL' && `Credit Balance to ${activeModalUser.username}`}
                {modalType === 'DED_BAL' && `Deduct Balance from ${activeModalUser.username}`}
                {modalType === 'RESET_PWD' && `Reset Password for ${activeModalUser.username}`}
                {modalType === 'BAN' && (activeModalUser.isBanned ? `Unban ${activeModalUser.username}` : `Ban ${activeModalUser.username}`)}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Current balance: ₹{activeModalUser.balance.toLocaleString()}</p>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {(modalType === 'ADD_BAL' || modalType === 'DED_BAL') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="1000"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Reason / Admin Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Compensation, Manual Deposit"
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                </>
              )}

              {modalType === 'RESET_PWD' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new strong password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
              )}

              {modalType === 'BAN' && !activeModalUser.isBanned && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Reason for Ban</label>
                  <input
                    type="text"
                    placeholder="e.g. Fraud, Multi-account creation"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setActiveModalUser(null); setModalType(null); }}
                  className="flex-1 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 font-bold rounded-xl transition-all text-xs ${
                    modalType === 'BAN' && !activeModalUser.isBanned
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-[#FFFFFF] text-black hover:bg-[#b8860b]'
                  }`}
                >
                  {submitting ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
