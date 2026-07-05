"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeIndianRupee, CircleAlert, ShieldCheck, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { useWallet } from "@/context/WalletContext";
import { playSound } from "@/lib/sound";

type Card = {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: string;
  side?: "andar" | "bahar";
};

type GameResult = Record<string, any> | null;

const suitLabel: Record<Card["suit"], string> = {
  hearts: "H",
  diamonds: "D",
  clubs: "C",
  spades: "S",
};

function currency(value: number) {
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PlayingCard({ card, delay = 0, back = false, tone = "gold" }: { card?: Card; delay?: number; back?: boolean; tone?: "gold" | "teal" | "coral" }) {
  const color = tone === "teal" ? "text-bv-teal border-bv-teal/50" : tone === "coral" ? "text-bv-coral border-bv-coral/50" : "text-bv-gold border-bv-gold/50";

  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0, y: 8 }}
      animate={{ rotateY: 0, opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className={`relative h-28 w-20 rounded-lg border bg-gradient-to-br from-white to-[#d9d5c8] shadow-xl ${color}`}
    >
      {back || !card ? (
        <div className="absolute inset-2 rounded-md border border-bv-gold/30 bg-[linear-gradient(135deg,#4b1122_25%,#7c1d36_25%,#7c1d36_50%,#4b1122_50%,#4b1122_75%,#7c1d36_75%)] bg-[length:16px_16px]" />
      ) : (
        <div className="flex h-full flex-col justify-between p-2 font-mono">
          <div className="text-sm font-black">{card.rank}</div>
          <div className="grid place-items-center text-3xl font-black">{suitLabel[card.suit]}</div>
          <div className="rotate-180 text-sm font-black">{card.rank}</div>
        </div>
      )}
    </motion.div>
  );
}

function StatTile({ label, value, accent = "text-bv-gold" }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-bv-bg/50 p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-bv-text-dim">{label}</div>
      <div className={`mt-1 font-mono text-lg font-black tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-bv-coral/30 bg-bv-coral/10 px-4 py-3 text-bv-coral">
      <CircleAlert className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
}

function FairProof({ result }: { result: GameResult }) {
  if (!result) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-bv-bg/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-bv-text">
        <ShieldCheck className="h-4 w-4 text-bv-teal" />
        Provably Fair Proof
      </div>
      <div className="grid gap-2 text-xs text-bv-text-dim md:grid-cols-3">
        <div>
          <span className="block uppercase tracking-widest">Server Hash</span>
          <span className="font-mono text-bv-text">{result.serverSeedHash}</span>
        </div>
        <div>
          <span className="block uppercase tracking-widest">Client Seed</span>
          <span className="font-mono text-bv-text">{result.clientSeed}</span>
        </div>
        <div>
          <span className="block uppercase tracking-widest">Nonce</span>
          <span className="font-mono text-bv-text">{result.nonce}</span>
        </div>
      </div>
    </div>
  );
}

function BetPanel({
  betAmount,
  setBetAmount,
  children,
  onPlay,
  loading,
  cta,
}: {
  betAmount: number;
  setBetAmount: (value: number) => void;
  children?: React.ReactNode;
  onPlay: () => void;
  loading: boolean;
  cta: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-bv-surface p-5">
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-bv-text-dim">Bet Amount</label>
      <div className="mb-4 flex overflow-hidden rounded-lg border border-white/10 bg-bv-bg">
        <div className="grid place-items-center px-4 text-bv-gold">
          <BadgeIndianRupee className="h-5 w-5" />
        </div>
        <input
          type="number"
          min={10}
          value={betAmount}
          onChange={(event) => setBetAmount(Number(event.target.value))}
          className="w-full bg-transparent px-3 py-3 font-mono text-lg font-black text-bv-text outline-none"
        />
      </div>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {[10, 50, 100, 500].map((amount) => (
          <button
            key={amount}
            onClick={() => setBetAmount(amount)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm font-bold text-bv-text-dim transition hover:border-bv-gold/50 hover:text-bv-gold"
          >
            {amount}
          </button>
        ))}
      </div>
      {children}
      <Button onClick={onPlay} isLoading={loading} disabled={loading || betAmount <= 0} variant="gold" className="mt-5 w-full">
        {cta}
      </Button>
    </div>
  );
}

function useGameAction(endpoint: string) {
  const { refresh } = useWallet();
  const [result, setResult] = useState<GameResult>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function play(payload: Record<string, any>) {
    setLoading(true);
    setError("");
    playSound("chip");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Round failed");
      setResult(data);
      playSound(data.won ? "win" : "lose");
      await refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, error, play };
}

export function AndarBaharGame() {
  const [betAmount, setBetAmount] = useState(50);
  const [side, setSide] = useState<"andar" | "bahar">("andar");
  const { result, loading, error, play } = useGameAction("/api/games/andar-bahar/play");
  const visibleCards = useMemo(() => (result?.dealtCards || []).slice(0, 16), [result]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <BetPanel betAmount={betAmount} setBetAmount={setBetAmount} loading={loading} cta="Deal Andar Bahar" onPlay={() => play({ betAmount, side })}>
        <div className="grid grid-cols-2 gap-2">
          {(["andar", "bahar"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setSide(item)}
              className={`rounded-lg border px-4 py-3 text-sm font-black uppercase tracking-widest transition ${side === item ? "border-bv-gold bg-bv-gold text-black shadow-glow-white" : "border-white/10 bg-white/5 text-bv-text-dim hover:border-bv-gold/40"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </BetPanel>
      <div className="space-y-5">
        {error && <ErrorState message={error} />}
        <div className="rounded-lg border border-bv-gold/20 bg-[radial-gradient(circle_at_center,#272018,#111018_60%)] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl font-black text-bv-text">Andar Bahar</h2>
              <p className="text-bv-text-dim">Joker first, alternating sides until the rank matches.</p>
            </div>
            <Sparkles className="h-7 w-7 text-bv-gold" />
          </div>
          <div className="mb-6 flex items-center gap-4">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-bv-text-dim">Joker</div>
              <PlayingCard card={result?.jokerCard} />
            </div>
            {result && (
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Winner" value={result.winningSide} accent={result.won ? "text-bv-teal" : "text-bv-coral"} />
                <StatTile label="Payout" value={`₹${currency(result.payout)}`} accent={result.won ? "text-bv-teal" : "text-bv-text-dim"} />
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(["andar", "bahar"] as const).map((lane) => (
              <div key={lane} className={`rounded-lg border p-4 ${result?.winningSide === lane ? "border-bv-teal bg-bv-teal/10" : "border-white/10 bg-bv-bg/50"}`}>
                <div className="mb-3 font-bold uppercase tracking-widest text-bv-text-dim">{lane}</div>
                <div className="flex min-h-32 flex-wrap gap-2">
                  <AnimatePresence>
                    {visibleCards.filter((card: Card) => card.side === lane).map((card: Card, index: number) => (
                      <PlayingCard key={`${card.rank}-${card.suit}-${index}`} card={card} delay={index * 0.04} tone={lane === "andar" ? "gold" : "teal"} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
        <FairProof result={result} />
      </div>
    </div>
  );
}

export function BaccaratGame() {
  const [betAmount, setBetAmount] = useState(100);
  const [betType, setBetType] = useState<"player" | "banker" | "tie">("banker");
  const { result, loading, error, play } = useGameAction("/api/games/baccarat/play");

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <BetPanel betAmount={betAmount} setBetAmount={setBetAmount} loading={loading} cta="Deal Baccarat" onPlay={() => play({ betAmount, betType })}>
        <div className="grid grid-cols-3 gap-2">
          {(["player", "banker", "tie"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setBetType(item)}
              className={`rounded-lg border px-3 py-3 text-xs font-black uppercase tracking-widest transition ${betType === item ? "border-bv-teal bg-bv-teal text-black shadow-glow-teal" : "border-white/10 bg-white/5 text-bv-text-dim hover:border-bv-teal/40"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </BetPanel>
      <div className="space-y-5">
        {error && <ErrorState message={error} />}
        <div className="rounded-lg border border-emerald-300/20 bg-[radial-gradient(circle_at_center,#14351f,#0c1511_62%)] p-6">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-black text-bv-text">Baccarat</h2>
            <p className="text-bv-text-dim">Fixed third-card rules, banker commission included.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {(["player", "banker"] as const).map((lane) => (
              <div key={lane} className={`rounded-lg border p-5 ${result?.winner === lane ? "border-bv-teal bg-bv-teal/10" : "border-white/10 bg-bv-bg/50"}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-bold uppercase tracking-widest text-bv-text-dim">{lane}</div>
                  <div className="font-mono text-2xl font-black text-bv-gold">{result ? result[`${lane}Total`] : "-"}</div>
                </div>
                <div className="flex min-h-32 gap-3">
                  {(result?.[`${lane}Cards`] || [undefined, undefined]).map((card: Card | undefined, index: number) => (
                    <PlayingCard key={index} card={card} delay={index * 0.08} tone={lane === "player" ? "teal" : "gold"} back={!result} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {result && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <StatTile label="Winner" value={result.winner} accent={result.won ? "text-bv-teal" : "text-bv-coral"} />
              <StatTile label="Multiplier" value={`${result.multiplier.toFixed(2)}x`} />
              <StatTile label="Payout" value={`₹${currency(result.payout)}`} accent={result.won ? "text-bv-teal" : "text-bv-text-dim"} />
            </div>
          )}
        </div>
        <FairProof result={result} />
      </div>
    </div>
  );
}

export function TeenPattiGame() {
  const [betAmount, setBetAmount] = useState(50);
  const { result, loading, error, play } = useGameAction("/api/games/teen-patti/play");

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <BetPanel betAmount={betAmount} setBetAmount={setBetAmount} loading={loading} cta="Test Your Hand" onPlay={() => play({ betAmount })}>
        <div className="rounded-lg border border-bv-gold/20 bg-bv-gold/10 p-3 text-sm text-bv-text-dim">
          Solo Teen Patti uses real hand ranking with a fixed paytable.
        </div>
      </BetPanel>
      <div className="space-y-5">
        {error && <ErrorState message={error} />}
        <div className="rounded-lg border border-bv-gold/20 bg-[radial-gradient(circle_at_center,#441524,#150d14_62%)] p-6">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-black text-bv-text">Teen Patti</h2>
            <p className="text-bv-text-dim">Trail, pure sequence, sequence, color, pair, high card.</p>
          </div>
          <div className="mb-6 flex min-h-36 justify-center gap-4">
            {(result?.cards || [undefined, undefined, undefined]).map((card: Card | undefined, index: number) => (
              <PlayingCard key={index} card={card} delay={index * 0.12} tone="gold" back={!result} />
            ))}
          </div>
          {result && (
            <div className="grid gap-3 md:grid-cols-3">
              <StatTile label="Hand" value={result.handRank} accent={result.won ? "text-bv-teal" : "text-bv-coral"} />
              <StatTile label="Multiplier" value={`${result.multiplier.toFixed(2)}x`} />
              <StatTile label="Payout" value={`₹${currency(result.payout)}`} accent={result.won ? "text-bv-teal" : "text-bv-text-dim"} />
            </div>
          )}
        </div>
        <FairProof result={result} />
      </div>
    </div>
  );
}
