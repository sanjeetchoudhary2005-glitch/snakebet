
"use client";

import React from "react";
import { Users, Trophy, Gift, CircleDashed, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const FloatingWidgets: React.FC = () => {
  return (
    <>
      {/* Left Side Widgets */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.95 }}
          className="group flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-glow-green border border-primary/40">
            <Gift className="w-7 h-7 text-black" />
          </div>
          <span className="text-xs font-bold text-primary">Daily</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.95 }}
          className="group flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary-light rounded-2xl flex items-center justify-center border border-border hover:border-primary/40 transition-all">
            <CircleDashed className="w-7 h-7 text-primary" />
          </div>
          <span className="text-xs font-bold text-muted-light">Spin</span>
        </motion.button>
      </div>

      {/* Top Right Widgets */}
      <div className="fixed right-6 top-36 z-40 flex flex-col gap-4">
        <motion.div
          whileHover={{ scale: 1.05, x: -5 }}
          className="glass-strong border border-primary/30 rounded-2xl p-4 shadow-glow-green-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-muted uppercase tracking-widest font-semibold">
                Online Now
              </div>
              <div className="text-white font-black text-xl">50,234</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, x: -5 }}
          className="glass-strong border border-border rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-muted uppercase tracking-widest font-semibold">
                Jackpot
              </div>
              <div className="text-white font-black text-xl">$2,543,210</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Right Support Widget */}
      <div className="fixed right-6 bottom-8 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-glow-green border-2 border-primary/50"
        >
          <MessageSquare className="w-8 h-8 text-black" />
        </motion.button>
      </div>
    </>
  );
};

export default FloatingWidgets;
