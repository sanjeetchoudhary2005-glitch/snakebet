'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Gift, Trophy, Wallet, CheckCircle2, Trash2, Bell, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSnakebet } from '@/context/SnakebetContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const NotificationsPage = () => {
  const { notifications, markNotificationRead, addNotification } = useSnakebet();

  const [filter, setFilter] = React.useState<'all' | 'unread' | 'promos' | 'account'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'promos') return n.type === 'success';
    if (filter === 'account') return n.type === 'info' || n.type === 'warning';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Gift className="w-6 h-6 text-primary" />;
      case 'warning':
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      default:
        return <Wallet className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Notifications</h1>
            <p className="text-muted">Stay up to date with all Snakebet updates</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id))}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['all', 'unread', 'promos', 'account'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
              filter === tab
                ? 'bg-primary text-black'
                : 'text-muted hover:text-white hover:bg-secondary'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'unread' && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Bell className="w-16 h-16 text-muted mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">No notifications</h3>
            <p className="text-muted">You're all caught up!</p>
          </motion.div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => markNotificationRead(notification.id)}
              className={`cursor-pointer ${!notification.read ? 'border-primary/30' : ''}`}
            >
              <Card className={`p-6 hover:border-gray-700 transition-all ${!notification.read ? 'bg-primary/5 border-primary/30' : ''}`}>
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${!notification.read ? 'bg-primary/20' : 'bg-gray-800'}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{notification.title}</h3>
                    <p className="text-muted mb-3">{notification.message}</p>
                    <div className="text-xs text-muted">
                      {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-2 text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
