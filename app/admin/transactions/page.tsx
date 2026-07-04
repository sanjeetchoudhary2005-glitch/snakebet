'use client';

import { useState, useEffect } from 'react';
import { Filter, Download } from 'lucide-react';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/admin/transactions?type=\${filterType}\`);
      const data = await res.json();
      if (!data.error) setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const exportCSV = () => {
    window.open(\`/api/admin/analytics/export?type=\${filterType}\`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">Transaction Ledger</h1>
          <p className="text-gray-400 mt-1 font-mono text-sm">Full audit trail of all platform movements</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#161224] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-teal-500 font-mono text-sm flex-1 md:flex-none"
          >
            <option value="">All Types</option>
            <option value="BET">Bets</option>
            <option value="WIN">Wins</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="ADMIN_ADJUSTMENT">Admin Adjustments</option>
          </select>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Download size={16} />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-[#161224] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/5 text-xs uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">User</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
                <th className="px-6 py-4 font-bold">Game/Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-mono">Loading transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500 font-mono">No transactions found.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{t.id.slice(-8)}</td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-white">{t.user?.username || 'System'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide
                        \${t.type === 'WIN' ? 'bg-green-500/20 text-green-400' : 
                          t.type === 'BET' ? 'bg-red-500/20 text-red-400' : 
                          t.type === 'ADMIN_ADJUSTMENT' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'}`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-mono font-bold text-right \${Number(t.amount) > 10000 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white'}`}>
                      {['WIN', 'DEPOSIT', 'ADMIN_ADJUSTMENT'].includes(t.type) && Number(t.amount) > 0 ? '+' : ''}
                      ₹{Number(t.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{t.gameId || t.reason || t.method || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
