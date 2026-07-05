"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Trophy, X, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

const slides = [
  {
    icon: Sparkles,
    title: "Play-Money Casino Demo",
    copy: "Snakebet is built for demo gameplay, client pitches, and product exploration without real-money gambling.",
  },
  {
    icon: ShieldCheck,
    title: "Provably Fair Rounds",
    copy: "Every supported game exposes seed data so outcomes can be independently checked after the round.",
    href: "/verify",
  },
  {
    icon: Trophy,
    title: "VIP, Races, and Rewards",
    copy: "Explore the product loops clients expect: VIP progress, tournaments, leaderboards, and daily rewards.",
    href: "/vip",
  },
];

export function FirstVisitOnboarding() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch("/api/user/onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.hasSeenOnboarding === false) setOpen(true);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  async function close() {
    setOpen(false);
    await fetch("/api/user/onboarding", { method: "POST" }).catch(() => {});
  }

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="relative w-full max-w-lg rounded-lg border border-bv-gold/25 bg-bv-surface p-6 shadow-2xl"
          >
            <button onClick={close} className="absolute right-4 top-4 rounded-md p-2 text-bv-text-dim transition hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-6 grid h-14 w-14 place-items-center rounded-lg border border-bv-gold/30 bg-bv-gold/10 text-bv-gold">
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="font-display text-3xl font-black text-bv-text">{slide.title}</h2>
            <p className="mt-3 text-bv-text-dim">{slide.copy}</p>
            {slide.href && (
              <Link href={slide.href} onClick={close} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-bv-teal hover:text-bv-gold">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {slides.map((_, dot) => (
                  <button
                    key={dot}
                    onClick={() => setIndex(dot)}
                    className={`h-2.5 rounded-full transition-all ${dot === index ? "w-8 bg-bv-gold" : "w-2.5 bg-white/20"}`}
                    aria-label={`Go to onboarding slide ${dot + 1}`}
                  />
                ))}
              </div>
              {index < slides.length - 1 ? (
                <Button variant="gold" onClick={() => setIndex((value) => value + 1)}>
                  Next
                </Button>
              ) : (
                <Button variant="gold" onClick={close}>
                  Start Playing
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
