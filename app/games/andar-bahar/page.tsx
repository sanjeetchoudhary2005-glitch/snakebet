'use client';

import { AndarBaharGame } from '@/components/games/andar-bahar/AndarBaharGame';

export default function AndarBaharPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl flex items-center justify-center min-h-[calc(100vh-100px)]">
      <AndarBaharGame />
    </div>
  );
}
