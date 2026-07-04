'use client';
import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Power, RefreshCw, Gift, Bell } from 'lucide-react';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

interface PromotionItem {
  id: string;
  title: string;
  type: string;
  matchPercentage: number;
  maxBonus: number;
  wageringMultiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function PromotionsAnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form toggles
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Promotion form
  const [promoTitle, setPromoTitle] = useState('');
  const [promoType, setPromoType] = useState('WELCOME');
  const [promoPct, setPromoPct] = useState(100);
  const [promoMax, setPromoMax] = useState(1000);
  const [promoWager, setPromoWager] = useState(30);
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements);
        setPromotions(data.promotions);
      }
    } catch (err) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'ANNOUNCEMENT',
          title: annTitle,
          content: annContent
        })
      });

      if (res.ok) {
        setShowAnnModal(false);
        setAnnTitle('');
        setAnnContent('');
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'PROMOTION',
          title: promoTitle,
          type: promoType,
          matchPercentage: promoPct,
          maxBonus: promoMax,
          wageringMultiplier: promoWager,
          startDate: promoStart,
          endDate: promoEnd
        })
      });

      if (res.ok) {
        setShowPromoModal(false);
        setPromoTitle('');
        setPromoType('WELCOME');
        setPromoPct(100);
        setPromoMax(1000);
        setPromoWager(30);
        setPromoStart('');
        setPromoEnd('');
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAnnStatus = async (item: AnnouncementItem) => {
    try {
      await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'ANNOUNCEMENT',
          id: item.id,
          title: item.title,
          content: item.content,
          isActive: !item.isActive
        })
      });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePromoStatus = async (item: PromotionItem) => {
    try {
      await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'PROMOTION',
          id: item.id,
          title: item.title,
          type: item.type,
          matchPercentage: item.matchPercentage,
          maxBonus: item.maxBonus,
          wageringMultiplier: item.wageringMultiplier,
          startDate: item.startDate,
          endDate: item.endDate,
          isActive: !item.isActive
        })
      });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, isAnn: boolean) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: isAnn ? 'ANNOUNCEMENT' : 'PROMOTION',
          action: 'DELETE',
          id
        })
      });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Promotions & Announcements</h1>
          <p className="text-gray-400 text-sm mt-1">Deploy site banners, system notices, and credit bonus deposit matchups</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnnModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-200 font-bold rounded-xl"
          >
            <Plus className="w-4 h-4 text-[#FFFFFF]" /> Add Notice
          </button>
          <button
            onClick={() => setShowPromoModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#b8860b] text-black font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Promo Campaign
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-[#FFFFFF] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Announcements Card */}
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" /> Active System Notices
            </h2>

            {announcements.length === 0 ? (
              <div className="text-center py-10 text-gray-600 font-medium">No announcements deployed yet.</div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800/80 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">{ann.title}</h4>
                      <p className="text-gray-400 leading-relaxed">{ann.content}</p>
                      <span className="text-[10px] text-gray-600 block mt-1">Created: {new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleAnnStatus(ann)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          ann.isActive ? 'bg-[#FFFFFF]/10 border-[#FFFFFF]/30 text-[#FFFFFF]' : 'bg-red-950/20 border-red-900/40 text-red-500'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id, true)}
                        className="p-1.5 bg-red-950/30 border border-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promotions Card */}
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" /> Active Bonus Campaigns
            </h2>

            {promotions.length === 0 ? (
              <div className="text-center py-10 text-gray-600 font-medium">No promotional matching campaigns deployed.</div>
            ) : (
              <div className="space-y-3">
                {promotions.map((promo) => (
                  <div key={promo.id} className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800/80 flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-white text-sm">{promo.title}</h4>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-yellow-400">
                          {promo.type}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-gray-400">
                          Match: {promo.matchPercentage}%
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-gray-400">
                          Max: ₹{promo.maxBonus}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-gray-400">
                          Wager: {promo.wageringMultiplier}x
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 block leading-none">
                        Active: {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => togglePromoStatus(promo)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          promo.isActive ? 'bg-[#FFFFFF]/10 border-[#FFFFFF]/30 text-[#FFFFFF]' : 'bg-red-950/20 border-red-900/40 text-red-500'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id, false)}
                        className="p-1.5 bg-red-950/30 border border-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Notice Modal */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-6">
            <h2 className="text-xl font-bold text-white">Create Announcement Notice</h2>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Maintenance Notice"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Notice Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details of the announcement displayed on user dashboard..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FFFFFF] text-black font-bold rounded-xl hover:bg-[#b8860b] transition-all text-xs"
                >
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6">
            <h2 className="text-xl font-bold text-white">Create Bonus Campaign</h2>

            <form onSubmit={handleSavePromotion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monsoon 200% Reload Bonus"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Promo Type</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none"
                  >
                    <option value="WELCOME">Welcome Bonus</option>
                    <option value="RELOAD">Reload Match</option>
                    <option value="FREE_BET">Free Bet Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Match Percentage (%)</label>
                  <input
                    type="number"
                    required
                    value={promoPct}
                    onChange={(e) => setPromoPct(Number(e.target.value))}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Max Bonus Limit (₹)</label>
                  <input
                    type="number"
                    required
                    value={promoMax}
                    onChange={(e) => setPromoMax(Number(e.target.value))}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Wagering Multiplier (x)</label>
                  <input
                    type="number"
                    required
                    value={promoWager}
                    onChange={(e) => setPromoWager(Number(e.target.value))}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={promoStart}
                    onChange={(e) => setPromoStart(e.target.value)}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={promoEnd}
                    onChange={(e) => setPromoEnd(e.target.value)}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FFFFFF] text-black font-bold rounded-xl hover:bg-[#b8860b] transition-all text-xs shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                >
                  Launch Bonus Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
