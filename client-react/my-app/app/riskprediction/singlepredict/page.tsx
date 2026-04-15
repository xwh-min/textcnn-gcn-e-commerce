'use client';

import { Suspense } from 'react';
import DetectionContent from './DetectionContent';

export default function DetectionPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div>加载中...</div>
      </div>
    }>
      <DetectionContent />
    </Suspense>
  );
}
