'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  permission: string[];
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: '📊', href: '/dashboard', permission: ['admin', 'user'] },
  { id: 'enterprises', label: '主体管理', icon: '🏢', href: '/enterprises', permission: ['admin', 'user'] },
  { id: 'graph', label: '关系图谱', icon: '🌐', href: '/graph', permission: ['admin', 'user'] },
  { id: 'datacenter', label: '数据中心', icon: '📦', href: '/datacenter', permission: ['admin', 'user'] },
  { id: 'detection', label: '单次预测', icon: '🔍', href: '/detection', permission: ['admin', 'user'] },
  { id: 'batch', label: '批量预测', icon: '📋', href: '/batch', permission: ['admin', 'user'] },
  { id: 'risks', label: '风险列表', icon: '⚠️', href: '/risks', permission: ['admin', 'user'] },
  { id: 'system', label: '系统管理', icon: '⚙️', href: '/system', permission: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);

  const userPermissions = user?.permissions || [];

  const filteredMenuItems = menuItems.filter(item => 
    item.permission.some(p => userPermissions.includes(p))
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-logo">🚀</span>
          {!collapsed && <span className="sidebar-title">跨境风控</span>}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">👤</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.username}</div>
              <div className="sidebar-user-role">
                {user.role === 'admin' ? '系统管理员' : '普通用户'}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 260px;
          min-height: 100vh;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
        }

        .sidebar.collapsed {
          width: 72px;
        }

        .sidebar-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar-logo {
          font-size: 1.5rem;
        }

        .sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .sidebar-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all 0.2s;
        }

        .sidebar-nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .sidebar-nav-item.active {
          background: #3b82f6;
          color: white;
        }

        .sidebar-nav-icon {
          font-size: 1.25rem;
          width: 24px;
          text-align: center;
        }

        .sidebar-nav-label {
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .sidebar-user-info {
          flex: 1;
        }

        .sidebar-user-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .sidebar-user-role {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            z-index: 50;
          }
        }
      `}</style>
    </aside>
  );
}
