'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqCategories = [
  {
    title: 'Getting Started',
    questions: [
      { q: 'How do I create an account?', a: 'Click on the "Sign Up" button, enter your details, and verify your email address.' },
      { q: 'Is there a welcome bonus?', a: 'Yes! All new users get a welcome bonus on their first deposit.' },
    ],
  },
  {
    title: 'Deposits & Withdrawals',
    questions: [
      { q: 'What payment methods are accepted?', a: 'We accept UPI and debit/credit cards during the current launch phase.' },
      { q: 'How long do withdrawals take?', a: 'Withdrawals are typically processed within 24 hours. UPI withdrawals are faster.' },
    ],
  },
  {
    title: 'Games & Rules',
    questions: [
      { q: 'Are the games provably fair?', a: 'Yes! All our games use a provably fair system. You can verify every game result.' },
      { q: 'What games are available?', a: 'We offer Mines, Crash, Plinko, Slots, Dice, Roulette, and Blackjack.' },
    ],
  },
  {
    title: 'Account & Security',
    questions: [
      { q: 'How do I enable 2FA?', a: 'Go to the Security section in your Profile page and follow the 2FA setup instructions.' },
      { q: 'Is my data secure?', a: 'Yes, we use industry-standard encryption and security practices to protect your data.' },
    ],
  },
  {
    title: 'Responsible Gaming',
    questions: [
      { q: 'Can I set deposit limits?', a: 'Yes! You can set daily, weekly, or monthly deposit limits in your account settings.' },
      { q: 'How do I self-exclude?', a: 'Contact our support team to request self-exclusion.' },
    ],
  },
];

type FAQItem = { q: string; a: string };

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-lg font-semibold text-white">{item.q}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <p className="mt-3 text-gray-300 leading-relaxed">{item.a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-400 text-lg">
            Find answers to common questions about Snakebet
          </p>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category, idx) => (
            <div key={idx} className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 text-yellow-400">
                {category.title}
              </h2>
              <div className="space-y-2">
                {category.questions.map((question, qIdx) => (
                  <FAQAccordion key={qIdx} item={question} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
