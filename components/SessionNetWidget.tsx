'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export function SessionNetWidget() {
  const [net, setNet] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/user/session-net');
        if (!res.ok) return;
        const data = await res.json();
        if (active) setNet(Number(data.net || 0));
      } catch {
        // Widget is non-critical.
      }
    };

    load();
    const timer = window.setInterval(load, 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const formatted = `${net >= 0 ? '+' : '-'}₹${Math.abs(net).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-border-light bg-secondary-light px-4 py-3 text-sm">
      <Activity className="h-4 w-4 text-primary" />
      <span className="text-muted-light">Session</span>
      <span className={net >= 0 ? 'font-black text-white' : 'font-black text-[#FCA5A5]'}>
        {formatted}
      </span>
    </div>
  );
}
