'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Gamepad2,
  Calendar,
  Download,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  reference?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdraw' | 'game' | 'bonus'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 20;

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/user/transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter and search
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'deposit' && !tx.type.toLowerCase().includes('deposit')) return false;
        if (typeFilter === 'withdraw' && !tx.type.toLowerCase().includes('withdraw')) return false;
        if (typeFilter === 'game' && !['game', 'bet', 'win', 'cashout'].some(k => tx.type.toLowerCase().includes(k))) return false;
        if (typeFilter === 'bonus' && !tx.type.toLowerCase().includes('bonus')) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const txStatus = tx.status.toLowerCase();
        if (statusFilter === 'completed' && txStatus !== 'completed') return false;
        if (statusFilter === 'pending' && txStatus !== 'pending') return false;
        if (statusFilter === 'failed' && txStatus !== 'failed') return false;
      }

      const txDate = new Date(tx.createdAt);
      const now = new Date();
      if (dateRange === 'today' && (now.getTime() - txDate.getTime()) > 86400000) return false;
      if (dateRange === 'week' && (now.getTime() - txDate.getTime()) > 604800000) return false;
      if (dateRange === 'month' && (now.getTime() - txDate.getTime()) > 2592000000) return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!tx.type.toLowerCase().includes(q) && 
            !tx.method.toLowerCase().includes(q) && 
            !(tx.reference?.toLowerCase().includes(q))) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, statusFilter, dateRange, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Summary
  const summary = useMemo(() => {
    const totalDeposits = transactions
      .filter(t => t.type.toLowerCase().includes('deposit') && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions
      .filter(t => t.type.toLowerCase().includes('withdraw') && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);
    return { totalDeposits, totalWithdrawals, netChange: totalDeposits - totalWithdrawals };
  }, [transactions]);

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('deposit')) return <ArrowDownToLine className="w-5 h-5" />;
    if (t.includes('withdraw')) return <ArrowUpFromLine className="w-5 h-5" />;
    if (t.includes('bonus')) return <TrendingUp className="w-5 h-5" />;
    return <Gamepad2 className="w-5 h-5" />;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'COMPLETED') return <CheckCircle2 className="w-4 h-4 text-white" />;
    if (status === 'PENDING') return <Clock className="w-4 h-4 text-yellow-400" />;
    return <AlertCircle className="w-4 h-4 text-red-400" />;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Status', 'Method', 'Reference'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(tx => [
        new Date(tx.createdAt).toLocaleString(),
        tx.type,
        tx.amount,
        tx.status,
        tx.method,
        tx.reference || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        <Link href="/" className="text-[#94A3B8] hover:text-[#FFFFFF] flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-black text-white">Transaction History</h1>
        <p className="text-[#94A3B8] mt-2">View and manage all your transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[#94A3B8] font-bold">Total Deposits</div>
            <ArrowDownToLine className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl font-black text-white">₹{summary.totalDeposits.toLocaleString('en-IN')}</div>
        </div>
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[#94A3B8] font-bold">Total Withdrawals</div>
            <ArrowUpFromLine className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400">₹{summary.totalWithdrawals.toLocaleString('en-IN')}</div>
        </div>
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[#94A3B8] font-bold">Net Change</div>
            <BarChart3 className="w-6 h-6 text-[#FFFFFF]" />
          </div>
          <div className="text-3xl font-black text-white">₹{summary.netChange.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by type, method or reference..."
            className="w-full pl-14 pr-6 py-4 bg-[#141414] rounded-2xl border border-[#2A2A2A] focus:border-[#FFFFFF]/50 outline-none text-white text-lg font-semibold"
          />
        </div>
        <button
          onClick={exportToCSV}
          className="px-6 py-4 bg-[#141414] rounded-2xl border border-[#2A2A2A] hover:border-[#FFFFFF]/50 text-white text-lg font-semibold flex items-center gap-2"
        >
          <Download className="w-5 h-5" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex flex-wrap gap-3">
          <span className="text-[#94A3B8] font-semibold self-center">Date:</span>
          {['today', 'week', 'month', 'custom'].map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d as any)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                dateRange === d ? 'bg-[#FFFFFF] text-black' : 'bg-[#141414] border border-[#2A2A2A] text-white hover:border-[#FFFFFF]/30'
              }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="text-[#94A3B8] font-semibold self-center">Type:</span>
          {['all', 'deposit', 'withdraw', 'game', 'bonus'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as any)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                typeFilter === t ? 'bg-[#FFFFFF] text-black' : 'bg-[#141414] border border-[#2A2A2A] text-white hover:border-[#FFFFFF]/30'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="text-[#94A3B8] font-semibold self-center">Status:</span>
          {['all', 'completed', 'pending', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                statusFilter === s ? 'bg-[#FFFFFF] text-black' : 'bg-[#141414] border border-[#2A2A2A] text-white hover:border-[#FFFFFF]/30'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#141414] rounded-3xl overflow-hidden border border-[#2A2A2A] mb-8">
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-[#94A3B8] text-lg">No transactions found</div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 p-6 border-b border-[#2A2A2A] text-[#94A3B8] font-bold">
              <div>Date</div>
              <div>Type</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Method</div>
              <div>Reference</div>
            </div>
            {/* Table Body */}
            <div className="divide-y divide-[#2A2A2A]">
              {paginatedTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-6 gap-4 p-6 items-center"
                >
                  <div className="text-white font-semibold">
                    {new Date(tx.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type.toLowerCase().includes('deposit') || tx.type.toLowerCase().includes('win') || tx.type.toLowerCase().includes('bonus')
                        ? 'bg-white/20 text-white'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {getIcon(tx.type)}
                    </div>
                    <span className="text-white font-semibold capitalize">{tx.type}</span>
                  </div>
                  <div className={`font-bold text-xl ${
                    tx.type.toLowerCase().includes('deposit') || tx.type.toLowerCase().includes('win') || tx.type.toLowerCase().includes('cashout') || tx.type.toLowerCase().includes('bonus')
                      ? 'text-white'
                      : 'text-red-400'
                  }`}>
                    {tx.type.toLowerCase().includes('deposit') || tx.type.toLowerCase().includes('win') || tx.type.toLowerCase().includes('cashout') || tx.type.toLowerCase().includes('bonus')
                      ? '+'
                      : '-'}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    <span className={`font-semibold ${
                      tx.status === 'COMPLETED' ? 'text-white'
                      : tx.status === 'PENDING' ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-[#94A3B8] font-semibold">{tx.method}</div>
                  <div className="text-[#94A3B8] font-mono text-sm">{tx.reference}</div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#FFFFFF]/30"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                currentPage === page
                  ? 'bg-[#FFFFFF] text-black'
                  : 'bg-[#141414] border border-[#2A2A2A] text-white hover:border-[#FFFFFF]/30'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#FFFFFF]/30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
