'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardHistoryManager() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.replaceState({ page: 'dashboard' }, '', '/dashboard');
    
    window.history.pushState({ page: 'dashboard' }, '', '/dashboard');

    const handlePopState = (e: PopStateEvent) => {
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
        router.replace('/dashboard');
      } else {
        window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  return null;
}

