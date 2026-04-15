'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // 不需要认证的路由
    const publicPaths = ['/login', '/register', '/'];
    
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      router.push('/login');
    }

    // 如果已登录但在登录页，重定向到仪表盘
    if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router]);

  // 加载状态或渲染子组件
  if (!isAuthenticated && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div>验证中...</div>
      </div>
    );
  }

  return <>{children}</>;
}
