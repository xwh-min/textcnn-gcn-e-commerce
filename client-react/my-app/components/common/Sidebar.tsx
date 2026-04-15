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
  { id: 'dashboard', label: '仪表盘', icon: '📊', href: '/dashboard', permission: ['dashboard_view'] },
  { id: 'enterprises', label: '主体管理', icon: '🏢', href: '/enterprises', permission: ['enterprises_view'] },
  { id: 'graph', label: '关系图谱', icon: '🌐', href: '/graph', permission: ['graph_view'] },
  { id: 'datacenter', label: '数据中心', icon: '📦', href: '/datacenter', permission: ['datacenter_view'] },
  { id: 'detection', label: '单次预测', icon: '🔍', href: '/detection', permission: ['detection_single'] },
  { id: 'batch', label: '批量预测', icon: '📋', href: '/batch', permission: ['detection_batch'] },
  { id: 'risks', label: '风险列表', icon: '⚠️', href: '/risks', permission: ['risks_view'] },
  { id: 'api-management', label: 'API管理', icon: '🧩', href: '/api-management', permission: ['api_manage'] },
  { id: 'system', label: '系统管理', icon: '⚙️', href: '/system', permission: ['system_users'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);

  const userPermissions = user?.permissions || [];
  const userRole = (user?.role || '').toLowerCase();
  const isAdminRole = ['admin', 'superadmin', '管理员', '超级管理员'].includes(userRole) || ['管理员', '超级管理员'].includes(user?.role || '');
  const hasWildcard = userPermissions.includes('*');
  const hasAccess = (required: string[]) => {
    if (isAdminRole || hasWildcard) return true;
    return required.some((p) => userPermissions.includes(p));
  };

  const filteredMenuItems = menuItems.filter((item) => hasAccess(item.permission));

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-logo">🛍️</span>
          {!collapsed && <span className="sidebar-title">跨境电商中台</span>}
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => (
          <Link key={item.id} href={item.href} className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}>
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
              <div className="sidebar-user-role">{({ admin: '系统管理员', user: '运营用户' } as Record<string, string>)[user.role] || user.role}</div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 248px;
          min-height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #0b2440 100%);
          color: #fff;
          display: flex;
          flex-direction: column;
          transition: width 0.25s ease;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sidebar.collapsed { width: 74px; }

        .sidebar-header {
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-brand { display: flex; align-items: center; gap: 8px; }
        .sidebar-logo { font-size: 18px; }
        .sidebar-title { font-size: 14px; font-weight: 700; white-space: nowrap; }

        .sidebar-toggle {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }

        .sidebar-nav { flex: 1; padding: 10px 8px; display: flex; flex-direction: column; gap: 4px; }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.78);
          text-decoration: none;
          border: 1px solid transparent;
        }

        .sidebar-nav-item:hover {
          background: rgba(14, 165, 233, 0.16);
          color: #fff;
          border-color: rgba(14, 165, 233, 0.28);
        }

        .sidebar-nav-item.active {
          background: linear-gradient(90deg, #0284c7, #0ea5e9);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 6px 14px rgba(2, 132, 199, 0.35);
        }

        .sidebar-nav-icon { width: 20px; text-align: center; }
        .sidebar-nav-label { font-size: 13px; font-weight: 600; white-space: nowrap; }

        .sidebar-footer {
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .sidebar-user { display: flex; align-items: center; gap: 10px; }
        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: rgba(14, 165, 233, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-user-name { font-size: 13px; font-weight: 700; }
        .sidebar-user-role { font-size: 12px; color: rgba(255, 255, 255, 0.66); }
      `}</style>
    </aside>
  );
}
