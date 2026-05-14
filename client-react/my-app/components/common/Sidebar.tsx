'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import styles from './sidebar.module.css';

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
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrand}>
          <span className={styles.sidebarLogo}>🛍️</span>
          {!collapsed && <span className={styles.sidebarTitle}>跨境电商中台</span>}
        </div>
        <button className={styles.sidebarToggle} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className={styles.sidebarNav}>
        {filteredMenuItems.map((item) => (
          <Link key={item.id} href={item.href} className={`${styles.sidebarNavItem} ${pathname === item.href ? styles.active : ''}`}>
            <span className={styles.sidebarNavIcon}>{item.icon}</span>
            {!collapsed && <span className={styles.sidebarNavLabel}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        {!collapsed && user && (
          <div className={styles.sidebarUser}>
            <div className={styles.sidebarUserAvatar}>👤</div>
            <div className={styles.sidebarUserInfo}>
              <div className={styles.sidebarUserName}>{user.username}</div>
              <div className={styles.sidebarUserRole}>{({ admin: '系统管理员', user: '运营用户' } as Record<string, string>)[user.role] || user.role}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
