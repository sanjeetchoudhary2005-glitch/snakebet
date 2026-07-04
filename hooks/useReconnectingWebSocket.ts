'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  onMessage: (event: MessageEvent) => void;
  onOpen?: (socket: WebSocket) => void;
  maxRetries?: number;
};

export function useReconnectingWebSocket(url: string, { onMessage, onOpen, maxRetries = 8 }: Options) {
  const socketRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const manualCloseRef = useRef(false);
  const [status, setStatus] = useState<'connecting' | 'open' | 'reconnecting' | 'closed'>('connecting');

  const connect = useCallback(() => {
    manualCloseRef.current = false;
    setStatus(retriesRef.current > 0 ? 'reconnecting' : 'connecting');
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      retriesRef.current = 0;
      setStatus('open');
      onOpen?.(socket);
    };
    socket.onmessage = onMessage;
    socket.onclose = () => {
      if (manualCloseRef.current) {
        setStatus('closed');
        return;
      }
      if (retriesRef.current >= maxRetries) {
        setStatus('closed');
        return;
      }
      retriesRef.current += 1;
      setStatus('reconnecting');
      const delay = Math.min(1000 * 2 ** (retriesRef.current - 1), 15000);
      window.setTimeout(connect, delay);
    };
    socket.onerror = () => {
      socket.close();
    };
  }, [maxRetries, onMessage, onOpen, url]);

  useEffect(() => {
    connect();
    return () => {
      manualCloseRef.current = true;
      socketRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((payload: unknown) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    return true;
  }, []);

  return { socketRef, status, send };
}
