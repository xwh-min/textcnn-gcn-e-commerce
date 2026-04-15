'use client';

import { useEffect, useState } from 'react';
import type { ToastDetail } from '@/src/utils/notify';

interface ToastItem extends ToastDetail {
  id: number;
}

export default function AppToast() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<ToastDetail>;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [...prev, { id, ...custom.detail }]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 2600);
    };

    window.addEventListener('app-toast', handler as EventListener);
    return () => window.removeEventListener('app-toast', handler as EventListener);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            minWidth: 220,
            maxWidth: 360,
            padding: '10px 12px',
            borderRadius: 8,
            color: '#111827',
            background:
              item.type === 'success' ? '#d1fae5' : item.type === 'error' ? '#fee2e2' : '#dbeafe',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            fontSize: 13,
          }}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
