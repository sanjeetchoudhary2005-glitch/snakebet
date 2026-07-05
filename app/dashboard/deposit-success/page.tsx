'use client';
import { useWallet } from '@/context/WalletContext';
import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function DepositSuccess() {
  const { refresh, fetchTransactions } = useWallet();
  
  useEffect(() => {
    refresh();
    fetchTransactions();
  }, [refresh, fetchTransactions]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-secondary rounded-2xl p-8 border border-gray-700 text-center">
        <CheckCircle className="w-20 h-20 text-white mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Deposit Successful!</h1>
        <p className="text-gray-400 mb-8">Your deposit is being processed and will reflect in your wallet soon.</p>
        
        <Link 
          href="/dashboard" 
          className="w-full block px-8 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dark transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}