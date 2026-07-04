'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageCircle, 
  Mail, 
  HelpCircle, 
  FileText, 
  Shield, 
  Search,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

const SupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { question: 'How do I deposit funds?', answer: 'Go to your Wallet, click "Deposit", choose your payment method, and follow the instructions.' },
    { question: 'How long do withdrawals take?', answer: 'UPI withdrawals are reviewed by an admin and are typically processed within 24 hours. Bank transfers can take 1-3 business days.' },
    { question: 'Is my personal information safe?', answer: 'Yes, we use industry-standard encryption and security protocols to protect your data.' },
    { question: 'How do I verify my account?', answer: 'Go to Profile > Security and complete the KYC process with your ID documents.' },
    { question: 'What games are available?', answer: 'We offer slots, blackjack, roulette, poker, crash, dice, live dealer games, and sports betting.' }
  ];

  const contactOptions = [
    { icon: MessageCircle, title: 'Live Chat', description: 'Get instant help 24/7', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { icon: Mail, title: 'Email', description: 'support@Snakebet.com', color: 'text-white', bg: 'bg-white/20' },
    { icon: HelpCircle, title: 'FAQ', description: 'Browse common questions', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <Link href="/" className="text-muted hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        <h1 className="text-4xl font-bold">Support Center</h1>
        <p className="text-muted mt-2">How can we help you today?</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-12"
      >
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-secondary rounded-2xl border border-gray-700 focus:border-primary outline-none transition-colors text-lg"
          />
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {contactOptions.map((option, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-secondary rounded-2xl p-8 cursor-pointer hover:border-primary border border-transparent transition-all"
          >
            <div className={`w-16 h-16 ${option.bg} rounded-2xl flex items-center justify-center mb-6`}>
              <option.icon className={`w-8 h-8 ${option.color}`} />
            </div>
            <h3 className="text-xl font-bold mb-3">{option.title}</h3>
            <p className="text-muted">{option.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-secondary rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
              >
                <span className="font-bold text-lg">{faq.question}</span>
                <ChevronDown className={`w-6 h-6 text-muted transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === idx && (
                <div className="px-6 pb-5 text-muted">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 bg-gradient-to-br from-primary/20 to-secondary rounded-2xl p-8"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
            <p className="text-muted">Our support team is available 24/7 to assist you.</p>
          </div>
          <button className="px-8 py-4 bg-primary text-black font-bold rounded-full hover:bg-white transition-all shadow-glow-green">
            Contact Support
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SupportPage;
