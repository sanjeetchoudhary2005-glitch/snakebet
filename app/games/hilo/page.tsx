'use client';

import { HiLoGame } from '@/components/games/hilo/HiLoGame';

export default function HiLoPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl flex items-center justify-center min-h-[calc(100vh-100px)]">
      <HiLoGame />
    </div>
  );
}
