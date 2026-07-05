'use client';
import { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  balance: number;
  user: any;
  transactions: any[];
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => void;
  setBalance: (amount: number) => void;
  refresh: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  depositLimits: { min: number; max: number; presets: number[] };
  withdrawLimits: { min: number; max: number; };
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      setBalance(data.balance);
      setUser(data.user);
    } catch (e) {
      console.error('Failed to fetch balance', e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const addBalance = (amount: number) => setBalance(prev => prev + amount);
  const deductBalance = (amount: number) => setBalance(prev => prev - amount);

  return (
    <WalletContext.Provider
      value={{
        balance,
        user,
        transactions,
        addBalance,
        deductBalance,
        setBalance,
        refresh: fetchBalance,
        fetchTransactions,
        depositLimits: { min: 200, max: 100000, presets: [200, 300, 500, 1000, 5000] },
        withdrawLimits: { min: 1000, max: 500000 },
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
