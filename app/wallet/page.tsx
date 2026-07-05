'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Clock, ShieldCheck, WalletCards } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { DepositModal } from '@/components/DepositModal';
import { WithdrawModal } from '@/components/WithdrawModal';

function formatMoney(value: number) {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function WalletPage() {
  const { balance, transactions, depositLimits, withdrawLimits, refresh, fetchTransactions } = useWallet();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const summary = useMemo(() => {
    const deposits = transactions
      .filter((tx: any) => String(tx.type).includes('DEPOSIT') && String(tx.status).toLowerCase() === 'completed')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
    const withdrawals = transactions
      .filter((tx: any) => String(tx.type).includes('WITHDRAW'))
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
    const pending = transactions.filter((tx: any) => String(tx.status).toLowerCase() === 'pending').length;
    return { deposits, withdrawals, pending };
  }, [transactions]);

  const closeModals = async () => {
    setDepositOpen(false);
    setWithdrawOpen(false);
    await refresh();
    await fetchTransactions();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-[#94A3B8] transition-colors hover:text-[#FFFFFF]">
        <ArrowLeft className="h-5 w-5" />
        Back to Home
      </Link>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-white">Wallet</h1>
          <p className="mt-2 text-[#94A3B8]">Manage deposits, withdrawals, and balance activity.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setDepositOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#FFFFFF] px-5 py-3 font-black text-black hover:bg-[#7BE600]">
            <ArrowDownToLine className="h-5 w-5" />
            Deposit
          </button>
          <button onClick={() => setWithdrawOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#2A2A2A] bg-[#141414] px-5 py-3 font-bold text-white hover:border-[#FFFFFF]/40">
            <ArrowUpFromLine className="h-5 w-5" />
            Withdraw
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-[#94A3B8]">Available Balance</div>
              <div className="mt-2 text-5xl font-black text-white">{formatMoney(balance)}</div>
            </div>
            <div className="hidden rounded-2xl bg-[#FFFFFF]/10 p-5 text-[#FFFFFF] sm:block">
              <WalletCards className="h-10 w-10" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
              <div className="text-sm text-[#94A3B8]">Total Deposits</div>
              <div className="mt-2 text-2xl font-black text-white">{formatMoney(summary.deposits)}</div>
            </div>
            <div className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
              <div className="text-sm text-[#94A3B8]">Withdrawals</div>
              <div className="mt-2 text-2xl font-black text-red-300">{formatMoney(summary.withdrawals)}</div>
            </div>
            <div className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
              <div className="text-sm text-[#94A3B8]">Pending Items</div>
              <div className="mt-2 text-2xl font-black text-white">{summary.pending}</div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-[#FFFFFF]" />
              <div>
                <div className="font-bold text-white">Cashier limits</div>
                <div className="mt-1 text-sm text-[#94A3B8]">
                  Deposit {formatMoney(depositLimits.min)} to {formatMoney(depositLimits.max)}. Withdraw {formatMoney(withdrawLimits.min)} to {formatMoney(withdrawLimits.max)}.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">Recent Activity</h2>
            <Link href="/transactions" className="text-sm font-bold text-[#FFFFFF] hover:text-[#7BE600]">View all</Link>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-10 text-center">
              <Clock className="mx-auto mb-3 h-8 w-8 text-[#94A3B8]" />
              <div className="font-bold text-white">No wallet activity yet</div>
              <div className="mt-1 text-sm text-[#94A3B8]">Deposits, withdrawals, bets, and wins will appear here.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 8).map((tx: any) => {
                const type = String(tx.type);
                const positive = ['DEPOSIT', 'WIN', 'BONUS', 'ADJUSTMENT'].some((item) => type.includes(item)) && Number(tx.amount) >= 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
                    <div>
                      <div className="font-bold text-white">{type}</div>
                      <div className="text-xs text-[#94A3B8]">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={positive ? 'font-black text-white' : 'font-black text-red-300'}>
                      {positive ? '+' : '-'}{formatMoney(Math.abs(Number(tx.amount)))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <DepositModal open={depositOpen} onClose={closeModals} />
      <WithdrawModal open={withdrawOpen} onClose={closeModals} />
    </div>
  );
}
