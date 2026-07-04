'use client';

import { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';

const INTERVAL_MS = 30 * 60 * 1000;

export function SessionReminder() {
  const [startedAt] = useState(() => Date.now());
  const [visible, setVisible] = useState(false);
  const [minutes, setMinutes] = useState(30);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsedMinutes = Math.max(30, Math.round((Date.now() - startedAt) / 60000));
      setMinutes(elapsedMinutes);
      setVisible(true);
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-[#2A2A2A] bg-[#141414] p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 text-[#FFFFFF]" />
        <div className="flex-1">
          <div className="font-bold text-white">Session reminder</div>
          <div className="text-sm text-[#94A3B8]">You have been playing for about {minutes} minutes.</div>
        </div>
        <button
          type="button"
          aria-label="Dismiss session reminder"
          onClick={() => setVisible(false)}
          className="rounded-lg p-1 text-[#94A3B8] hover:bg-[#0B0B0B] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
