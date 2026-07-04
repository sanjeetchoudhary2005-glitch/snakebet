'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type LiveActivityEvent = {
  id: string;
  maskedUsername: string;
  gameId: string;
  gameName: string;
  amount: number;
  eventType: 'bet' | 'win';
  timestamp: string;
};

export type LiveStatsPayload = {
  online: number;
  dbOnline: number;
  totalGames: number;
};

function wsUrl() {
  if (typeof window === 'undefined') return '';
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname;
  const port = process.env.NEXT_PUBLIC_WS_PORT || '8080';
  return `${protocol}//${host}:${port}`;
}

export function useLiveWebSocket() {
  const [activities, setActivities] = useState<LiveActivityEvent[]>([]);
  const [stats, setStats] = useState<LiveStatsPayload>({ online: 0, dbOnline: 0, totalGames: 0 });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  const connect = useCallback(() => {
    const url = wsUrl();
    if (!url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'activity' && msg.data) {
          setActivities((prev) => [msg.data as LiveActivityEvent, ...prev].slice(0, 50));
        }
        if (msg.type === 'stats' && msg.data) {
          setStats({
            online: msg.data.dbOnline ?? msg.data.online ?? 0,
            dbOnline: msg.data.dbOnline ?? 0,
            totalGames: msg.data.totalGames ?? 0,
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      const delay = Math.min(10_000, 1000 * 2 ** retryRef.current);
      retryRef.current += 1;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { activities, stats, connected, setActivities };
}
