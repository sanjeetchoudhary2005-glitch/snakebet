'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Game {
  id: string;
  name: string;
  category: string;
  image: string;
  players: number;
  rating: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  timestamp: Date;
}

interface User {
  id: string;
  username: string;
  email?: string | null;
  balance: number;
}

interface SnakebetContextType {
  favorites: string[];
  toggleFavorite: (gameId: string) => void;
  recentlyPlayed: Game[];
  addToRecentlyPlayed: (game: Game) => void;
  onlineUsers: number;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  balance: number;
  user: User | null;
  updateBalance: (amount: number) => void;
  refreshBalance: () => Promise<void>;
}

const SnakebetContext = createContext<SnakebetContextType | undefined>(undefined);

const mockGames: Game[] = [
  { id: '1', name: 'Crash Extreme', category: 'casino', image: 'https://picsum.photos/id/1/300/300', players: 1245, rating: 4.9 },
  { id: '2', name: 'Blackjack Pro', category: 'casino', image: 'https://picsum.photos/id/2/300/300', players: 892, rating: 4.8 },
  { id: '3', name: 'Roulette X', category: 'casino', image: 'https://picsum.photos/id/3/300/300', players: 567, rating: 4.7 },
  { id: '4', name: 'Mega Slots', category: 'casino', image: 'https://picsum.photos/id/6/300/300', players: 2341, rating: 4.9 },
  { id: '5', name: 'Dice Master', category: 'casino', image: 'https://picsum.photos/id/8/300/300', players: 432, rating: 4.6 },
];

export function SnakebetProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Game[]>(mockGames.slice(0, 3));
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Welcome Bonus!', message: 'You have a 100% match bonus waiting!', type: 'success', read: false, timestamp: new Date(Date.now() - 3600000) },
    { id: '2', title: 'Daily Spin', message: 'Spin the wheel for free!', type: 'info', read: false, timestamp: new Date(Date.now() - 7200000) },
    { id: '3', title: 'VIP Upgrade', message: 'You are almost VIP Level 4!', type: 'warning', read: true, timestamp: new Date(Date.now() - 86400000) },
  ]);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);

  // Fetch user data
  const refreshBalance = async () => {
    try {
      const res = await fetch('/api/user');
      const data = await res.json();
      setUser(data);
      setBalance(data.balance);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  useEffect(() => {
    const fetchOnline = () => {
      fetch('/api/live/snapshot')
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.onlineUsers === 'number') {
            setOnlineUsers(data.onlineUsers);
          }
        })
        .catch(() => {});
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 30_000);
    return () => clearInterval(interval);
  }, []);

  const toggleFavorite = (gameId: string) => {
    setFavorites(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  const addToRecentlyPlayed = (game: Game) => {
    setRecentlyPlayed(prev => [game, ...prev.filter(g => g.id !== game.id)].slice(0, 10));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    setNotifications(prev => [{
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    }, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updateBalance = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  return (
    <SnakebetContext.Provider 
      value={{
        favorites,
        toggleFavorite,
        recentlyPlayed,
        addToRecentlyPlayed,
        onlineUsers,
        notifications,
        addNotification,
        markNotificationRead,
        balance,
        user,
        updateBalance,
        refreshBalance,
      }}
    >
      {children}
    </SnakebetContext.Provider>
  );
}

export function useSnakebet() {
  const context = useContext(SnakebetContext);
  if (!context) {
    throw new Error('useSnakebet must be used within a SnakebetProvider');
  }
  return context;
}
