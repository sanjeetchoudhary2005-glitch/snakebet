'use client';

import { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle, IndianRupee, Eye } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(\`/api/admin/users?search=\${encodeURIComponent(search)}\`);
      const data = await res.json();
      if (!data.error) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchUsers(), 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount || !adjustReason) return;
    
    setAdjusting(true);
    try {
      const res = await fetch(\`/api/admin/users/\${selectedUser.id}/adjust-balance\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(adjustAmount), reason: adjustReason })
      });
      
      if (res.ok) {
        setSelectedUser(null);
        setAdjustAmount('');
        setAdjustReason('');
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to adjust balance');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdjusting(false);
    }
  };

  const toggleStatus = async (user: any) => {
    if (!confirm(\`Are you sure you want to \${user.isActive ? 'suspend' : 'restore'} \${user.username}?\`)) return;
    
    try {
      const res = await fetch(\`/api/admin/users/\${user.id}/status\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-teal-400">User Management</h1>
          <p className="text-gray-400 mt-1 font-mono text-sm">Manage player accounts and balances</p>
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search username or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161224] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-teal-500 font-mono text-sm"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-500" />
        </div>
      </div>

      <div className="bg-[#161224] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/5 text-xs uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4 font-bold">Username</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Balance</th>
                <th className="px-6 py-4 font-bold">Wagered</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Joined</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-mono">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-mono">No users found.</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                       {user.role === 'ADMIN' && <span className="bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded text-[10px] uppercase">Admin</span>}
                       {user.username}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono font-bold text-yellow-400">₹{Number(user.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4 font-mono text-gray-300">₹{Number(user.totalWagered || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => setSelectedUser(user)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-yellow-400 transition-colors" title="Adjust Balance">
                        <IndianRupee size={16} />
                      </button>
                      <button onClick={() => toggleStatus(user)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title={user.isActive ? 'Suspend' : 'Restore'}>
                        {user.isActive ? <Ban size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-green-400" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#161224] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl">
            <h2 className="text-xl font-black uppercase tracking-widest text-white mb-4">Adjust Balance</h2>
            <p className="text-sm text-gray-400 mb-6">Modifying balance for <strong className="text-teal-400">{selectedUser.username}</strong>. Current: ₹{Number(selectedUser.balance).toFixed(2)}</p>
            
            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Amount (Use negative to deduct)</label>
                <input 
                  type="number" 
                  required
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-mono text-white focus:outline-none focus:border-teal-500" 
                  placeholder="+500 or -200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Reason (Required for audit log)</label>
                <input 
                  type="text" 
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-mono text-white focus:outline-none focus:border-teal-500" 
                  placeholder="Compensatory bonus for bug"
                />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={adjusting}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {adjusting ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
