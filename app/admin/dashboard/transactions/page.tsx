'use client';
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, RefreshCw } from 'lucide-react';

interface TransactionItem {
  id: string;
  userId: string;
  username: string;
  email: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  gameId?: string;
  method?: string;
  reference?: string;
  status: string;
  createdAt: string;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [game, setGame] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = `/api/admin/transactions?search=${encodeURIComponent(search)}&type=${type}&game=${game}`;
      if (minAmount) query += `&minAmount=${minAmount}`;
      if (maxAmount) query += `&maxAmount=${maxAmount}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await fetch(query);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [type, game, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleExportCSV = () => {
    let query = `/api/admin/transactions?format=csv&search=${encodeURIComponent(search)}&type=${type}&game=${game}`;
    if (minAmount) query += `&minAmount=${minAmount}`;
    if (maxAmount) query += `&maxAmount=${maxAmount}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;

    window.open(query, '_blank');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">System Ledger Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Audit trail of all bets, wins, adjustments, deposits, and withdrawal transactions</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-3 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-200 font-semibold rounded-xl text-xs transition-all shadow-md self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#FFFFFF]" /> Export Ledger to CSV
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Filter by Username, Email or Reference Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-xl text-xs text-white outline-none focus:border-[#FFFFFF]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-850 text-gray-300 text-xs font-bold rounded-xl border border-gray-800"
          >
            Apply Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Type Filter */}
          <div>
            <label className="block text-gray-500 uppercase tracking-wider text-[10px] mb-1 font-bold">Transaction Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="BET">Bets Placed</option>
              <option value="WIN">Winnings Payout</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="BONUS">Bonus Rewards</option>
              <option value="ADJUSTMENT">Admin Adjustments</option>
            </select>
          </div>

          {/* Game Filter */}
          <div>
            <label className="block text-gray-500 uppercase tracking-wider text-[10px] mb-1 font-bold">Casino Game</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full p-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white outline-none"
            >
              <option value="ALL">All Games</option>
              <option value="CRASH">Skybound (Crash)</option>
              <option value="MINES">Mines Pro</option>
              <option value="DICE">Dice Roll</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-gray-500 uppercase tracking-wider text-[10px] mb-1 font-bold">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white outline-none text-xs"
            />
          </div>
          <div>
            <label className="block text-gray-500 uppercase tracking-wider text-[10px] mb-1 font-bold">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-[#FFFFFF] animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No transaction records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0a0a0a] text-gray-400 border-b border-gray-800 uppercase tracking-wider font-semibold">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Balance Range</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-gray-400">{t.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{t.username}</div>
                      <div className="text-gray-500 font-mono text-[10px]">{t.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] ${
                        t.type === 'BET' || t.type === 'WITHDRAWAL'
                          ? 'bg-red-950/60 border border-red-900/40 text-red-400'
                          : 'bg-green-950/60 border border-green-900/40 text-white'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`p-4 font-black text-sm ${t.amount >= 0 ? 'text-[#FFFFFF]' : 'text-red-400'}`}>
                      ₹{t.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-400 font-mono">
                      ₹{t.balanceBefore.toLocaleString()} → ₹{t.balanceAfter.toLocaleString()}
                    </td>
                    <td className="p-4">
                      {t.gameId && (
                        <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded mr-1">
                          {t.gameId}
                        </span>
                      )}
                      {t.method && (
                        <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded font-mono">
                          {t.method}
                        </span>
                      )}
                      <div className="text-gray-500 text-[10px] mt-1 break-all max-w-[200px]">{t.reference || '-'}</div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
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
