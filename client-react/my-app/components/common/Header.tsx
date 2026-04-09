'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function Header() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-breadcrumb">
          <span>首页</span>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="header-action-btn" title="通知">
            🔔
            <span className="header-badge">3</span>
          </button>
          <button className="header-action-btn" title="帮助">
            ❓
          </button>
        </div>

        <div className="header-user" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="header-user-avatar">👤</div>
          <div className="header-user-info">
            <div className="header-user-name">管理员</div>
          </div>
          <span className="header-user-arrow">▼</span>
        </div>

        {showDropdown && (
          <div className="header-dropdown">
            <div className="header-dropdown-item">
              <span>👤</span>
              <Link href="/settings">个人设置</Link>
            </div>
            <div className="header-dropdown-item">
              <span>⚙️</span>
              <Link href="/system">系统设置</Link>
            </div>
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
          height: 64px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
        }

        .header-breadcrumb {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .header-action-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background 0.2s;
        }

        .header-action-btn:hover {
          background: #f3f4f6;
        }

        .header-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          padding: 2px 6px;
          border-radius: 9999px;
          font-weight: 600;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .header-user:hover {
          background: #f3f4f6;
        }

        .header-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
        }

        .header-user-info {
          display: flex;
          flex-direction: column;
        }

        .header-user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }

        .header-user-arrow {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .header-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          min-width: 200px;
          z-index: 100;
          overflow: hidden;
        }

        .header-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.2s;
          color: #111827;
          text-decoration: none;
        }

        .header-dropdown-item:hover {
          background: #f3f4f6;
        }

        .header-dropdown-item :global(a) {
          color: inherit;
          text-decoration: none;
        }

        .header-dropdown-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0.25rem 0;
        }
      `}</style>
    </header>
  );
}
