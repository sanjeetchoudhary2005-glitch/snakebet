"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, ShieldAlert } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-20">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-lg border border-bv-coral/30 bg-bv-coral/10 text-bv-coral">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.35em] text-bv-coral">500</p>
        <h1 className="font-display text-5xl font-black text-bv-text">Something Glitched</h1>
        <p className="mx-auto mt-4 max-w-md text-bv-text-dim">
          The page failed to load cleanly. You can retry the render or return to the games lobby.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-lg bg-bv-gold px-5 py-3 font-bold text-black transition hover:shadow-glow-white">
            <RotateCcw className="h-5 w-5" />
            Try Again
          </button>
          <Link href="/games" className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-bv-surface px-5 py-3 font-bold text-bv-text transition hover:border-bv-teal/50 hover:text-bv-teal">
            Browse Games
          </Link>
        </div>
      </div>
    </div>
  );
}
