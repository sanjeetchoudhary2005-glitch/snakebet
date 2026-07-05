'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Wallet, ArrowDownLeft, ArrowUpRight, Gamepad2, History, RefreshCw } from 'lucide-react';

export default function SingleUserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'GAMES' | 'DEPOSITS' | 'WITHDRAWALS'>('TRANSACTIONS');

  const fetchUserProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUserProfile();
  }, [userId]);

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-[#FFFFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/admin/dashboard/users"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to User List
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <User className="w-8 h-8 text-[#FFFFFF]" />
              {userData.username}
            </h1>
            <p className="text-gray-400 text-xs mt-1 font-mono">{userData.email || 'No Email'} • ID: {userData.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl text-gray-300">
              Joined: {new Date(userData.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* User Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase">Current Balance</span>
          <div className="text-2xl font-black text-[#FFFFFF] mt-1">₹{userData.balance.toLocaleString()}</div>
        </div>
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase">Total Deposited</span>
          <div className="text-2xl font-black text-white mt-1">₹{userData.totalDeposited.toLocaleString()}</div>
        </div>
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase">Total Withdrawn</span>
          <div className="text-2xl font-black text-red-400 mt-1">₹{userData.totalWithdrawn.toLocaleString()}</div>
        </div>
        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase">Total Winnings</span>
          <div className="text-2xl font-black text-yellow-400 mt-1">₹{userData.totalWon.toLocaleString()}</div>
        </div>
      </div>

      {/* Profile Detail Tabs */}
      <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 space-y-6">
        <div className="flex border-b border-gray-800 gap-2 overflow-x-auto pb-2">
          {[
            { id: 'TRANSACTIONS', label: `Transactions (${userData.transactions.length})`, icon: History },
            { id: 'GAMES', label: `Game Bets (${userData.games.length})`, icon: Gamepad2 },
            { id: 'DEPOSITS', label: `Deposits (${userData.depositRequests.length})`, icon: ArrowDownLeft },
            { id: 'WITHDRAWALS', label: `Withdrawals (${userData.withdrawRequests.length})`, icon: ArrowUpRight },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive ? 'bg-[#FFFFFF] text-black shadow-[0_0_10px_rgba(0,255,136,0.2)]' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Transactions Tab */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 uppercase text-[10px]">
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Before / After</th>
                  <th className="p-3">Reference / Reason</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {userData.transactions.map((t: any) => (
                  <tr key={t.id}>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        t.type === 'DEPOSIT' || t.type === 'WIN' ? 'bg-green-950 text-white' : 'bg-red-950 text-red-400'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">₹{Number(t.amount).toLocaleString()}</td>
                    <td className="p-3 text-gray-400">₹{Number(t.balanceBefore).toLocaleString()} → ₹{Number(t.balanceAfter).toLocaleString()}</td>
                    <td className="p-3 text-gray-400">{t.reason || t.reference || '-'}</td>
                    <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Games Bets Tab */}
        {activeTab === 'GAMES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 uppercase text-[10px]">
                  <th className="p-3">Game</th>
                  <th className="p-3">Bet Amount</th>
                  <th className="p-3">Multiplier</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Win Amount</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {userData.games.map((g: any) => (
                  <tr key={g.id}>
                    <td className="p-3 font-bold text-white">{g.type}</td>
                    <td className="p-3 font-semibold text-gray-200">₹{g.betAmount}</td>
                    <td className="p-3 font-mono text-yellow-400">{g.multiplier.toFixed(2)}x</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${g.result === 'WIN' ? 'bg-green-950 text-white' : 'bg-red-950 text-red-400'}`}>
                        {g.result}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">₹{g.winAmount}</td>
                    <td className="p-3 text-gray-500">{new Date(g.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'DEPOSITS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 uppercase text-[10px]">
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">TX ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {userData.depositRequests.map((d: any) => (
                  <tr key={d.id}>
                    <td className="p-3 font-bold text-white">₹{Number(d.amount).toLocaleString()}</td>
                    <td className="p-3 text-gray-300">{d.method}</td>
                    <td className="p-3 font-mono text-gray-400">{d.transactionId || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        d.status === 'APPROVED' ? 'bg-green-950 text-white' : d.status === 'PENDING' ? 'bg-yellow-950 text-yellow-400' : 'bg-red-950 text-red-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(d.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'WITHDRAWALS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 uppercase text-[10px]">
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {userData.withdrawRequests.map((w: any) => (
                  <tr key={w.id}>
                    <td className="p-3 font-bold text-white">₹{Number(w.amount).toLocaleString()}</td>
                    <td className="p-3 text-gray-300">{w.method}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        w.status === 'APPROVED' || w.status === 'COMPLETED' ? 'bg-green-950 text-white' : w.status === 'PENDING' ? 'bg-yellow-950 text-yellow-400' : 'bg-red-950 text-red-400'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{w.adminNotes || '-'}</td>
                    <td className="p-3 text-gray-500">{new Date(w.createdAt).toLocaleString()}</td>
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
