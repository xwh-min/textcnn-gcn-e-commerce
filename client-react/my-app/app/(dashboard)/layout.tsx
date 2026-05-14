'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import { useAuthStore } from '@/src/store/useAuthStore';

const routePermissions: Record<string, string[]> = {
  '/dashboard': ['dashboard_view'],
  '/enterprises': ['enterprises_view'],
  '/graph': ['graph_view'],
  '/datacenter': ['datacenter_view'],
  '/detection': ['detection_single'],
  '/batch': ['detection_batch'],
  '/risks': ['risks_view'],
  '/api-management': ['api_manage'],
  '/system': ['system_users'],
};

const orderedRoutes = [
  '/dashboard',
  '/enterprises',
  '/graph',
  '/datacenter',
  '/detection',
  '/batch',
  '/risks',
  '/api-management',
  '/system',
] as const;

function getRequiredPermissions(pathname: string): string[] {
  const matched = Object.keys(routePermissions)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => pathname.startsWith(prefix));
  return matched ? routePermissions[matched] : [];
}

function hasPermission(user: { role?: string; permissions?: string[] } | null, required: string[]): boolean {
  if (required.length === 0) return true;

  const role = (user?.role || '').toLowerCase();
  const isAdminRole = ['admin', 'superadmin', '管理员', '超级管理员'].includes(role) || ['管理员', '超级管理员'].includes(user?.role || '');
  const perms = user?.permissions || [];

  if (isAdminRole || perms.includes('*')) return true;
  return required.some((p) => perms.includes(p));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const canAccess = useMemo(() => {
    const required = getRequiredPermissions(pathname || '');
    return hasPermission(user, required);
  }, [pathname, user]);

  const firstAccessibleRoute = useMemo(() => {
    for (const route of orderedRoutes) {
      const required = routePermissions[route] || [];
      if (hasPermission(user, required)) {
        return route;
      }
    }
    return null;
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (!canAccess) {
      if (firstAccessibleRoute && pathname !== firstAccessibleRoute) {
        router.replace(firstAccessibleRoute);
      }
    }
  }, [isAuthenticated, canAccess, firstAccessibleRoute, pathname, router]);

  const handleLogoutAndLogin = () => {
    logout();
    router.push('/login');
  };

  const handleLogoutAndHome = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="state-page">正在跳转到登录页...</div>
    );
  }

  if (!canAccess) {
    if (firstAccessibleRoute) {
      return (
        <div className="state-page">当前页面无权限，正在跳转到：{firstAccessibleRoute}</div>
      );
    }

    return (
      <div className="unauthorized-page">
        <div className="unauthorized-card">
          <h2 className="unauthorized-title">无权限访问</h2>
          <p className="unauthorized-desc">
            当前账号暂无任何可访问页面，请联系管理员开通权限。
          </p>

          <div className="unauthorized-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleLogoutAndLogin}
            >
              前往登录页
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogoutAndHome}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <main className="dashboard-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
        }

        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .dashboard-content {
          flex: 1;
          background: #f9fafb;
          overflow-y: auto;
        }

        .state-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #374151;
          background: #f9fafb;
          font-size: 14px;
        }

        .unauthorized-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
          padding: 24px;
        }

        .unauthorized-card {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          text-align: center;
        }

        .unauthorized-title {
          margin: 0;
          font-size: 28px;
          color: #111827;
          font-weight: 700;
        }

        .unauthorized-desc {
          margin: 12px 0 0;
          color: #4b5563;
          font-size: 15px;
          line-height: 1.7;
        }

        .unauthorized-actions {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          appearance: none;
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #4f46e5;
          color: #fff;
        }

        .btn-primary:hover {
          background: #4338ca;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #111827;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
