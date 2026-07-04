
'use client';
import { LimboGame } from '@/components/games/LimboGame';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LimboPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-gray-400 hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
        <LimboGame />
      </div>
    </div>
  );
}
