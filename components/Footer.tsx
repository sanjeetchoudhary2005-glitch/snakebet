
'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const pathname = usePathname();
  const isGamePage = pathname?.startsWith('/games/');

  if (isGamePage) return null;

  return (
    <footer className="bg-secondary border-t border-border-light pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-glow-green">
                <Trophy className="w-8 h-8 text-black font-black" />
              </div>
              <span className="text-3xl font-black tracking-tight">
                Big<span className="gradient-text">Vedix</span>
              </span>
            </Link>
            <p className="text-muted-light mb-10 max-w-md leading-relaxed text-lg">
              Play Beyond Limits. The ultimate destination for premium online gaming and entertainment.
            </p>
            <div className="flex gap-4">
              {[Twitter, Facebook, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-12 h-12 bg-secondary-light border border-border-light rounded-2xl flex items-center justify-center text-muted-light hover:text-primary hover:border-primary/40 transition-all duration-300 hover:shadow-glow-green-sm"
                >
                  <Icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black mb-8">Games</h3>
            <ul className="space-y-4">
              {['Slots', 'Blackjack', 'Roulette', 'Skybound', 'Dice', 'Plinko'].map((item) => (
                <li key={item}>
                  <Link href="/games" className="text-muted-light hover:text-primary transition-colors duration-300 font-semibold text-base">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-black mb-8">Company</h3>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Affiliates', 'Contact', 'Press'].map((item) => (
                <li key={item}>
                  <Link href="/support" className="text-muted-light hover:text-primary transition-colors duration-300 font-semibold text-base">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-black mb-8">Legal</h3>
            <ul className="space-y-4">
              {['Terms & Conditions', 'Privacy Policy', 'Responsible Gaming', 'Cookie Policy', 'Security'].map((item) => (
                <li key={item}>
                  <Link href="/support" className="text-muted-light hover:text-primary transition-colors duration-300 font-semibold text-base">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border-light pt-10 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-muted-light text-center md:text-left text-sm font-semibold">
              © {new Date().getFullYear()} Snakebet. All rights reserved. 18+ only. Please gamble responsibly.
            </p>
            <div className="flex items-center gap-8 text-sm">
              <a href="#" className="text-muted-light hover:text-primary transition-colors font-semibold">License</a>
              <a href="#" className="text-muted-light hover:text-primary transition-colors font-semibold">Security</a>
              <a href="#" className="text-muted-light hover:text-primary transition-colors font-semibold">Fairness</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
