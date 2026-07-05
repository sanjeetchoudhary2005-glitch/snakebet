import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-20">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-lg border border-bv-gold/30 bg-bv-gold/10 text-bv-gold">
          <Compass className="h-10 w-10" />
        </div>
        <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.35em] text-bv-teal">404</p>
        <h1 className="font-display text-5xl font-black text-bv-text">Page Not Found</h1>
        <p className="mx-auto mt-4 max-w-md text-bv-text-dim">
          This table is closed or the route no longer exists. Head back to the casino lobby and pick a live game.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-lg bg-bv-gold px-5 py-3 font-bold text-black transition hover:shadow-glow-white">
            <Home className="h-5 w-5" />
            Home
          </Link>
          <Link href="/games" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-bv-surface px-5 py-3 font-bold text-bv-text transition hover:border-bv-teal/50 hover:text-bv-teal">
            <Search className="h-5 w-5" />
            Browse Games
          </Link>
        </div>
      </div>
    </div>
  );
}
