
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { Play, ArrowRight, Users, Trophy, Coins, Sparkles, Bomb, Zap, Target } from "lucide-react";
import Button from "./ui/Button";
import Link from "next/link";
import { useSnakebet } from "@/context/SnakebetContext";

const rotatingSubtitles = ["Provably Fair", "Instant Withdrawals", "50K+ Players"];

const HeroCarousel: React.FC = () => {
  const { onlineUsers } = useSnakebet();
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const timer = setInterval(() => {
      setCurrentSubtitleIndex((prev) => (prev + 1) % rotatingSubtitles.length);
    }, 3000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseX(e.clientX);
    setMouseY(e.clientY);
  };

  return (
    <section 
      className="relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 bg-[#0B0B0B] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,166,71,0.18),transparent_28rem),radial-gradient(circle_at_82%_20%,rgba(45,212,191,0.12),transparent_26rem)]" />
      </div>

      <div className="relative h-[85vh] min-h-[700px]">
        {/* Floating Game Icons with Parallax */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Mines Icon */}
          <motion.div
            className="absolute top-[20%] left-[10%]"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              x: (mouseX - dimensions.width / 2) * 0.02,
              y: (mouseY - dimensions.height / 2) * 0.02,
            }}
          >
            <div className="p-6 rounded-lg bg-bv-surface/80 backdrop-blur-sm border border-bv-gold/20 shadow-glow-white">
              <Bomb className="w-12 h-12 text-bv-gold" />
            </div>
          </motion.div>

          {/* Crash Icon */}
          <motion.div
            className="absolute top-[30%] right-[15%]"
            animate={{
              y: [0, -25, 0],
              rotate: [0, -3, 3, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            style={{
              x: (mouseX - dimensions.width / 2) * -0.025,
              y: (mouseY - dimensions.height / 2) * -0.025,
            }}
          >
            <div className="p-6 rounded-lg bg-bv-surface/80 backdrop-blur-sm border border-bv-teal/20 shadow-glow-teal">
              <Zap className="w-12 h-12 text-bv-teal" />
            </div>
          </motion.div>

          {/* Plinko Icon */}
          <motion.div
            className="absolute bottom-[25%] left-[20%]"
            animate={{
              y: [0, -18, 0],
              rotate: [0, 4, -4, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            style={{
              x: (mouseX - dimensions.width / 2) * 0.015,
              y: (mouseY - dimensions.height / 2) * 0.015,
            }}
          >
            <div className="p-6 rounded-lg bg-bv-surface/80 backdrop-blur-sm border border-bv-coral/20">
              <Target className="w-12 h-12 text-bv-coral" />
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="px-4 py-2 border border-bv-gold/30 bg-bv-gold/10 rounded-full">
                  <span className="text-bv-gold font-black text-xs uppercase tracking-widest">
                    PLAY-MONEY DEMO
                  </span>
                </div>
                <Link href="/verify" className="px-4 py-2 border border-bv-teal/30 bg-bv-teal/10 rounded-full text-bv-teal font-black text-xs uppercase tracking-widest">
                  Provably Fair
                </Link>
              </div>

              <h1 className="font-display text-6xl md:text-8xl font-black mb-6 text-white leading-tight">
                Snakebet
              </h1>

              {/* Rotating Subtitle */}
              <div className="h-16 mb-10">
                <motion.div
                  key={currentSubtitleIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl md:text-4xl text-bv-gold font-bold"
                >
                  {rotatingSubtitles[currentSubtitleIndex]}
                </motion.div>
              </div>

              <div className="flex flex-wrap items-center gap-6 mb-12">
                <Link href="/games">
                  <Button variant="gold" size="xl" className="shadow-glow-white text-lg">
                    <Play className="w-6 h-6 mr-2 fill-black" />
                    Start Playing Now
                  </Button>
                </Link>
                <Link href="/verify">
                <Button variant="outline" size="xl" className="border-bv-teal/40 hover:border-bv-teal/70 text-lg">
                  Learn More
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
                </Link>
              </div>

              {/* Live Stats */}
              <div className="flex flex-wrap items-center gap-8 mb-10">
                {[
                  { icon: Trophy, label: "Games Played", number: "1.2M+" },
                  { icon: Target, label: "Win Rate Margin", number: "97.8%" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="p-4 bg-bv-surface/80 rounded-lg border border-white/10">
                        <Icon className="w-8 h-8 text-bv-gold" />
                      </div>
                      <div>
                        <div className="text-3xl font-mono font-black text-white">{item.number}</div>
                        <div className="text-sm text-[#94A3B8]">{item.label}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Recent Big Win */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-3 px-6 py-4 rounded-lg bg-gradient-to-r from-bv-surface to-bv-bg border border-bv-gold/20"
              >
                <Sparkles className="w-6 h-6 text-[#FFFFFF]" />
                <div>
                  <span className="text-white font-semibold">Biggest win today <span className="font-mono text-bv-gold">₹50,000</span></span>
                  <span className="text-[#94A3B8] ml-2 text-sm">2 min ago</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
