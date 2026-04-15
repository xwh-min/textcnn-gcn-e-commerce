'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function Header() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const canAccessSystem = useMemo(() => {
    const role = (user?.role || '').toLowerCase();
    const isAdminRole = ['admin', 'superadmin', '管理员', '超级管理员'].includes(role) || ['管理员', '超级管理员'].includes(user?.role || '');
    const perms = user?.permissions || [];
    return isAdminRole || perms.includes('*') || perms.includes('system_users') || perms.includes('api_manage');
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title-wrap">
          <div className="header-title">跨境电商风险运营后台</div>
          <div className="header-subtitle">实时监控 · 主体治理 · 风险预测</div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="header-action-btn" title="通知">
            🔔
            <span className="header-badge">3</span>
          </button>
          <button className="header-action-btn" title="帮助">❓</button>
        </div>

        <div className="header-user" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="header-user-avatar">👤</div>
          <div className="header-user-info">
            <div className="header-user-name">{user?.username || '用户'}</div>
            <div className="header-user-role">{user?.role === 'admin' ? '管理员' : '运营角色'}</div>
          </div>
          <span className="header-user-arrow">▼</span>
        </div>

        {showDropdown && (
          <div className="header-dropdown">
            <div className="header-dropdown-item">
              <span>👤</span>
              <Link href="/settings">个人设置</Link>
            </div>
            {canAccessSystem && (
              <div className="header-dropdown-item">
                <span>⚙️</span>
                <Link href="/system">系统设置</Link>
              </div>
            )}
            <div className="header-dropdown-divider"></div>
            <div className="header-dropdown-item" onClick={handleLogout}>
              <span>🚪</span>
              <span>退出登录</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .header {
          height: 68px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 4px 14px rgba(2, 8, 23, 0.04);
        }

        .header-title { font-size: 15px; font-weight: 800; color: #0f172a; }
        .header-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }

        .header-right { display: flex; align-items: center; gap: 10px; position: relative; }
        .header-actions { display: flex; gap: 6px; }

        .header-action-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 10px;
          position: relative;
        }

        .header-badge {
          position: absolute;
          right: -2px;
          top: -4px;
          background: #ef4444;
          color: #fff;
          border-radius: 999px;
          font-size: 10px;
          padding: 1px 5px;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
        }

        .header-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #e0f2fe;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-user-name { font-size: 13px; font-weight: 700; color: #0f172a; }
        .header-user-role { font-size: 11px; color: #64748b; }
        .header-user-arrow { font-size: 11px; color: #64748b; }

        .header-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 8px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          min-width: 180px;
          box-shadow: 0 10px 24px rgba(2, 8, 23, 0.12);
          overflow: hidden;
          z-index: 100;
        }

        .header-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          color: #0f172a;
          font-size: 13px;
        }

        .header-dropdown-item:hover { background: #f8fafc; }
        .header-dropdown-divider { height: 1px; background: #e2e8f0; }
        .header-dropdown-item :global(a) { color: inherit; text-decoration: none; }
      `}</style>
    </header>
  );
}
