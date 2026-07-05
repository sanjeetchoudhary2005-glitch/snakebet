
"use client";

import React from "react";

const promos = [
  { icon: "🎁", text: "Welcome Bonus ₹500 Demo Coins" },
  { icon: "🔥", text: "100% First Deposit Bonus" },
  { icon: "⚡", text: "Daily Cashback" },
  { icon: "🏆", text: "Weekly Tournament" },
  { icon: "🎯", text: "Refer Friends & Earn Rewards" },
  { icon: "💎", text: "VIP Rewards" },
  { icon: "🎁", text: "Daily Free Spin" },
];

const PromoBar: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-secondary via-secondary-light to-secondary border-y border-primary/20 overflow-hidden py-2">
      <div className="flex animate-[scroll_40s_linear_infinite] items-center gap-12 whitespace-nowrap">
        {/* Duplicate content for seamless loop */}
        {[...promos, ...promos].map((promo, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-4 cursor-pointer hover:text-primary transition-colors"
          >
            <span className="text-xl">{promo.icon}</span>
            <span className="text-white font-semibold text-sm md:text-base">
              {promo.text}
            </span>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default PromoBar;
