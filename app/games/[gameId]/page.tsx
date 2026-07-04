
"use client";

import dynamic from 'next/dynamic';

// Dynamically import our client-side game page, disable SSR entirely
const ClientGamePage = dynamic(() => import('./client-page'), {
  ssr: false,
  loading: () => (
    <div className="pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    </div>
  ),
});

const GamePage = () => {
  return <ClientGamePage />;
};

export default GamePage;
