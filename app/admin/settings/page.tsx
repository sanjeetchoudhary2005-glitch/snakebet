'use client';

import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setMaintenanceMode(data.maintenanceMode);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    setMaintenanceMode(newVal); // Optimistic UI
    
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: newVal })
      });
    } catch (err) {
      setMaintenanceMode(!newVal); // Revert
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">Platform Settings</h1>
        <p className="text-gray-400 mt-1 font-mono text-sm">Configure global platform behavior</p>
      </div>

      <div className="bg-[#161224] p-6 rounded-2xl border border-white/5 max-w-2xl shadow-lg space-y-8">
        
        {/* Maintenance Mode */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white uppercase tracking-widest">Maintenance Mode</h3>
            <p className="text-sm text-gray-500 mt-1">If enabled, all non-admin users will be redirected to the maintenance page.</p>
          </div>
          <button
            disabled={loading}
            onClick={toggleMaintenance}
            className={\`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-black \${maintenanceMode ? 'bg-red-500' : 'bg-gray-600'}\`}
          >
            <span className={\`inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}\`} />
          </button>
        </div>

      </div>
    </div>
  );
}
