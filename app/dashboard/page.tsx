'use client';
import { useWallet } from '@/context/WalletContext';
import { useState } from 'react';
import { DepositModal } from '@/components/DepositModal';
import { WithdrawModal } from '@/components/WithdrawModal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Dashboard() {
  const { balance, transactions, depositLimits, withdrawLimits, refresh, fetchTransactions } = useWallet();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-10">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-white">Wallet Dashboard</h1>
      </div>
      
      <div className="bg-secondary rounded-2xl p-6 mb-6 shadow-lg border border-gray-700">
        <h2 className="text-lg text-gray-400">Your Balance</h2>
        <div className="text-5xl font-bold text-white mt-2">
          ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => setDepositOpen(true)} 
            className="px-8 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dark transition-colors"
          >
            Deposit
          </button>
          <button 
            onClick={() => setWithdrawOpen(true)} 
            className="px-8 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-secondary rounded-2xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx, i) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-gray-700">
                <div>
                  <span className="font-bold text-white">{tx.type}</span>
                  <div className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</div>
                </div>
                <span className={`font-bold text-lg ${
                  tx.type.includes('DEPOSIT') || tx.type.includes('WIN') || tx.type.includes('CASHOUT') 
                    ? 'text-white' 
                    : 'text-red-400'
                }`}>
                  {tx.type.includes('DEPOSIT') || tx.type.includes('WIN') || tx.type.includes('CASHOUT') 
                    ? '+' 
                    : '-'
                  }₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DepositModal open={depositOpen} onClose={() => { setDepositOpen(false); refresh(); fetchTransactions(); }} />
      <WithdrawModal open={withdrawOpen} onClose={() => { setWithdrawOpen(false); refresh(); fetchTransactions(); }} />
    </div>
  );
}
