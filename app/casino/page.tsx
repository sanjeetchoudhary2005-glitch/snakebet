'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const CasinoPage = () => {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/games');
  }, [router]);
  return null;
};

export default CasinoPage;