'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('PWA: Service Worker registered');
            }
          })
          .catch(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('PWA: Service Worker registration failed');
            }
          });
      });
    }
  }, []);

  return null;
}

