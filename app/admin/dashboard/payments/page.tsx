'use client';
import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, QrCode, Copy, Check, Trash2, Edit, Power, RefreshCw, Smartphone, Landmark, Coins } from 'lucide-react';

interface PaymentAccount {
  id: string;
  type: string;
  label: string;
  details: any;
  qrCodeUrl?: string;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  usageCount: number;
}

export default function PaymentAccountsManager() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState('UPI');
  const [label, setLabel] = useState('Main UPI');
  const [upiId, setUpiId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [minAmount, setMinAmount] = useState(100);
  const [maxAmount, setMaxAmount] = useState(100000);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch payment accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setType('UPI');
    setLabel('');
    setUpiId('');
    setWalletAddress('');
    setBankName('');
    setAccountNumber('');
    setIfsc('');
    setHolderName('');
    setMinAmount(100);
    setMaxAmount(100000);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (acc: PaymentAccount) => {
    setEditingId(acc.id);
    setType(acc.type);
    setLabel(acc.label);
    setMinAmount(acc.minAmount);
    setMaxAmount(acc.maxAmount);

    if (acc.type === 'UPI') {
      setUpiId(acc.details.upiId || '');
    } else if (acc.type.startsWith('CRYPTO')) {
      setWalletAddress(acc.details.walletAddress || '');
    } else if (acc.type === 'BANK') {
      setBankName(acc.details.bankName || '');
      setAccountNumber(acc.details.accountNumber || '');
      setIfsc(acc.details.ifsc || '');
      setHolderName(acc.details.holderName || '');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let detailsObj: any = {};
    let qrData = '';

    if (type === 'UPI') {
      detailsObj = { upiId };
      qrData = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Snakebet`;
    } else if (type.startsWith('CRYPTO')) {
      detailsObj = { walletAddress };
      qrData = walletAddress;
    } else if (type === 'BANK') {
      detailsObj = { bankName, accountNumber, ifsc, holderName };
      qrData = `BANK:${accountNumber}:${ifsc}`;
    }

    const generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload: any = {
        type,
        label,
        details: detailsObj,
        qrCodeUrl: generatedQr,
        minAmount,
        maxAmount
      };
      if (editingId) payload.id = editingId;

      const res = await fetch('/api/admin/payments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchAccounts();
      }
    } catch (err) {
      console.error('Failed to save account', err);
    }
  };

  const toggleActive = async (acc: PaymentAccount) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id, isActive: !acc.isActive })
      });
      if (res.ok) fetchAccounts();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment account?')) return;
    try {
      const res = await fetch(`/api/admin/payments?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAccounts();
    } catch (err) {
      console.error('Failed to delete account', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (t: string) => {
    if (t === 'UPI') return <Smartphone className="w-6 h-6 text-[#FFFFFF]" />;
    if (t === 'BANK') return <Landmark className="w-6 h-6 text-blue-400" />;
    return <Coins className="w-6 h-6 text-yellow-400" />;
  };

  const getAccountDisplay = (acc: PaymentAccount) => {
    if (acc.type === 'UPI') return acc.details.upiId;
    if (acc.type.startsWith('CRYPTO')) return acc.details.walletAddress;
    if (acc.type === 'BANK') return `${acc.details.bankName} - A/C: ${acc.details.accountNumber} (IFSC: ${acc.details.ifsc})`;
    return '';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment Accounts Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Configure deposit gateways, QR codes, and active receiving channels</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-[#FFFFFF] hover:bg-[#b8860b] text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,255,136,0.2)] self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Add Payment Account
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RefreshCw className="w-8 h-8 text-[#FFFFFF] animate-spin" />
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const displayStr = getAccountDisplay(acc);
            return (
              <div
                key={acc.id}
                className={`bg-[#111111] border rounded-2xl p-6 relative flex flex-col justify-between transition-all ${
                  acc.isActive ? 'border-gray-800 hover:border-[#FFFFFF]/40' : 'border-red-900/40 opacity-60 bg-[#0d0d0d]'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                        {getTypeIcon(acc.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">{acc.label}</h3>
                        <span className="text-[11px] text-gray-400 font-mono uppercase bg-gray-900 px-2 py-0.5 rounded mt-1 inline-block">
                          {acc.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(acc)}
                      title={acc.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-2 rounded-xl border transition-all ${
                        acc.isActive
                          ? 'bg-[#FFFFFF]/10 border-[#FFFFFF]/30 text-[#FFFFFF]'
                          : 'bg-red-950/30 border-red-900/40 text-red-500'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QR Code Display */}
                  {acc.qrCodeUrl && (
                    <div className="mb-4 flex flex-col items-center justify-center bg-white p-3 rounded-xl shadow-inner w-40 h-40 mx-auto">
                      <img src={acc.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {/* Account Details */}
                  <div className="bg-[#0a0a0a] p-3.5 rounded-xl border border-gray-800/80 mb-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Details</span>
                      <button
                        onClick={() => copyToClipboard(displayStr, acc.id)}
                        className="text-xs text-[#FFFFFF] hover:underline flex items-center gap-1"
                      >
                        {copiedId === acc.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === acc.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-200 font-mono break-all font-semibold leading-relaxed">
                      {displayStr}
                    </div>
                  </div>

                  {/* Limits & Usage Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="bg-gray-900/50 p-2 rounded-lg text-center border border-gray-800">
                      <span className="text-gray-500 block text-[10px]">Deposit Limits</span>
                      <span className="text-gray-200 font-bold">₹{acc.minAmount} - ₹{acc.maxAmount}</span>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded-lg text-center border border-gray-800">
                      <span className="text-gray-500 block text-[10px]">Total Usage</span>
                      <span className="text-blue-400 font-bold">{acc.usageCount} deposits</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-800/80">
                  <button
                    onClick={() => openEditModal(acc)}
                    className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 rounded-xl transition-all border border-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-6">
            <h2 className="text-2xl font-bold text-white">
              {editingId ? 'Edit Payment Account' : 'Add New Payment Account'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Account Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm, etc.)</option>
                  <option value="BANK">Bank Transfer (IMPS/NEFT)</option>
                  <option value="CRYPTO_BTC">Crypto (Bitcoin BTC)</option>
                  <option value="CRYPTO_ETH">Crypto (Ethereum ETH)</option>
                  <option value="CRYPTO_USDT_TRC20">Crypto (USDT TRC20)</option>
                  <option value="CRYPTO_USDT_ERC20">Crypto (USDT ERC20)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Account Label / Custom Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main UPI, Binance Wallet"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                />
              </div>

              {/* Dynamic Inputs based on Type */}
              {type === 'UPI' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">UPI ID</label>
                  <input
                    type="text"
                    required
                    placeholder="name@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
              )}

              {type.startsWith('CRYPTO') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Wallet Address</label>
                  <input
                    type="text"
                    required
                    placeholder="0x... or T..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF] font-mono text-sm"
                  />
                </div>
              )}

              {type === 'BANK' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="HDFC Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="501002345678"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">IFSC Code</label>
                    <input
                      type="text"
                      required
                      placeholder="HDFC0001234"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Snakebet Gaming Pvt Ltd"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Min Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    value={minAmount}
                    onChange={(e) => setMinAmount(Number(e.target.value))}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Max Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-800 rounded-xl text-white outline-none focus:border-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#FFFFFF] text-black font-bold rounded-xl hover:bg-[#b8860b] transition-all shadow-[0_0_15px_rgba(0,255,136,0.2)]"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
