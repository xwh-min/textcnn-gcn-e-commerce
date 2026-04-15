'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/src/services/api';
import { useAuthStore } from '@/src/store/useAuthStore';
import { notifyError, notifyInfo, notifySuccess } from '@/src/utils/notify';
import './styles.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface Log {
  id: string;
  operator: string;
  action: string;
  type: string;
  time: string;
  details: string;
}

const permissionTree = [
  {
    id: 'dashboard',
    name: '仪表盘',
    children: [
      { id: 'dashboard_view', name: '查看仪表盘' },
    ],
  },
  {
    id: 'enterprises',
    name: '主体管理',
    children: [
      { id: 'enterprises_view', name: '查看主体' },
      { id: 'enterprises_add', name: '新增主体' },
      { id: 'enterprises_edit', name: '编辑主体' },
      { id: 'enterprises_delete', name: '删除主体' },
    ],
  },
  {
    id: 'graph',
    name: '关系图谱',
    children: [
      { id: 'graph_view', name: '查看图谱' },
    ],
  },
  {
    id: 'datacenter',
    name: '数据中心',
    children: [
      { id: 'datacenter_view', name: '查看数据' },
      { id: 'datacenter_import', name: '导入数据' },
      { id: 'datacenter_export', name: '导出数据' },
    ],
  },
  {
    id: 'detection',
    name: '风险预测',
    children: [
      { id: 'detection_single', name: '单次预测' },
      { id: 'detection_batch', name: '批量预测' },
    ],
  },
  {
    id: 'risks',
    name: '风险历史',
    children: [
      { id: 'risks_view', name: '查看历史' },
      { id: 'risks_export', name: '导出报告' },
    ],
  },
  {
    id: 'system',
    name: '系统管理',
    children: [
      { id: 'system_users', name: '用户管理' },
      { id: 'system_roles', name: '角色管理' },
      { id: 'system_logs', name: '操作日志' },
    ],
  },
];


export default function SystemPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.permissions?.includes('*');

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersRes, rolesRes, logsRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getRoles(),
        apiService.getOperationLogs(),
      ]);

      if (usersRes.code === 200 && usersRes.data) {
        const roleMap: Record<string, string> = { admin: '管理员', user: '普通用户' };
        setUsers(usersRes.data.map((item: any) => ({
          id: item.id.toString(),
          username: item.username || '',
          email: item.email || '',
          role: item.role || 'user',
          status: (item.status?.toLowerCase() as any) || 'active',
          createdAt: item.createTime || item.createdAt || '',
        })));
      }

      if (rolesRes.code === 200 && rolesRes.data) {
        setRoles(rolesRes.data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name || '',
          description: item.description || '',
          permissions: item.permissions || [],
        })));
      }

      if (logsRes.code === 200 && logsRes.data) {
        setLogs(logsRes.data.map((item: any) => ({
          id: item.id.toString(),
          operator: item.operator || item.username || '',
          action: item.action || item.operation || '',
          type: item.type || item.module || '',
          time: item.time || item.operateTime || '',
          details: item.details || item.description || '',
        })));
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [logOperator, setLogOperator] = useState('');
  const [logType, setLogType] = useState('');
  const [logStartDate, setLogStartDate] = useState('');
  const [logEndDate, setLogEndDate] = useState('');

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleAllInGroup = (group: any) => {
    const allChildIds = group.children.map((child: any) => child.id);
    const allSelected = allChildIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !allChildIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...allChildIds])]);
    }
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (currentUser) {
        const resp = await apiService.updateUser(Number(currentUser.id), {
          username: data.username,
          email: data.email,
          role: data.role,
        });
        if (resp.code !== 200) {
          notifyError(resp.message || '用户更新失败');
          return;
        }
      } else {
        const resp = await apiService.createUser({
          username: data.username,
          password: data.password || '123456',
          email: data.email,
          role: data.role,
        });
        if (resp.code !== 200) {
          notifyError(resp.message || '用户创建失败');
          return;
        }
      }

      setShowUserModal(false);
      await loadData();
    } catch {
      notifyError('用户保存失败，请稍后重试');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const resp = await apiService.setUserStatus(Number(user.id), user.status !== 'active');
      if (resp.code !== 200) {
        notifyError(resp.message || '状态更新失败');
        return;
      }
      await loadData();
    } catch {
      notifyError('状态更新失败，请稍后重试');
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      const resp = await apiService.resetUserPassword(Number(user.id), '123456');
      if (resp.code === 200) {
        notifySuccess(`已为用户 ${user.username} 重置密码`);
      } else {
        notifyError(resp.message || '重置密码失败');
      }
    } catch {
      notifyError('重置密码失败，请稍后重试');
    }
  };

  const handleEditRole = (role: Role) => {
    setCurrentRole(role);
    setSelectedPermissions([...role.permissions]);
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (currentRole) {
      const resp = await apiService.updateRole(Number(currentRole.id), { permissions: selectedPermissions });
      if (resp.code !== 200) {
        notifyError(resp.message || '角色权限保存失败');
        return;
      }
      notifySuccess('角色权限已保存，菜单权限已刷新');
      await loadData();
    }
    setShowRoleModal(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchOperator = !logOperator || log.operator.includes(logOperator);
    const matchType = !logType || log.type === logType;
    const matchDate = 
      (!logStartDate || new Date(log.time) >= new Date(logStartDate)) &&
      (!logEndDate || new Date(log.time) <= new Date(logEndDate + ' 23:59:59'));
    return matchOperator && matchType && matchDate;
  });

  if (!isAdmin) {
    return (
      <div className="system-page">
        <div className="system-container">
          <div className="system-card" style={{ padding: '2rem', color: '#991b1b' }}>
            无权限访问系统管理，仅管理员可查看。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="system-page">
      <div className="system-container">
        <div className="system-header">
          <div className="system-header-left">
            <h1 className="system-title">系统管理</h1>
            <p className="system-subtitle">用户管理、角色权限、操作日志</p>
          </div>
        </div>

        <div className="system-card">
          {/* 加载状态 */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>加载中...</div>
            </div>
          )}
          
          {/* 错误提示 */}
          {error && (
            <div style={{ 
              padding: '1rem', 
              background: '#fee2e2', 
              color: '#991b1b', 
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              {error}
              <button 
                onClick={loadData}
                style={{
                  marginLeft: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                重试
              </button>
            </div>
          )}
          
          {/* 内容 */}
          {!loading && !error && (
            <>
              <div className="system-tabs">
                <button
                  className={`system-tab ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  👤 用户管理
                </button>
                <button
                  className={`system-tab ${activeTab === 'roles' ? 'active' : ''}`}
                  onClick={() => setActiveTab('roles')}
                >
                  🔐 角色权限
                </button>
                <button
                  className={`system-tab ${activeTab === 'logs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('logs')}
                >
                  📋 操作日志
                </button>
              </div>

          {activeTab === 'users' && (
            <div className="tab-content">
              <div className="tab-header">
                <h3 className="tab-title">用户列表</h3>
                <button className="add-btn" onClick={handleAddUser}>
                  + 新增用户
                </button>
              </div>

              <div className="table-container">
                <table className="system-table">
                  <thead>
                    <tr>
                      <th>用户名</th>
                      <th>邮箱</th>
                      <th>角色</th>
                      <th>状态</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{{ admin: '管理员', user: '普通用户' }[user.role] || user.role}</td>
                        <td>
                          <span className={`status-badge ${user.status}`}>
                            {user.status === 'active' ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td>{user.createdAt}</td>
                        <td>
                          <button className="action-btn" onClick={() => handleEditUser(user)}>编辑</button>
                          <button className="action-btn" onClick={() => handleResetPassword(user)}>重置密码</button>
                          <button className={`action-btn ${user.status === 'active' ? 'danger' : 'success'}`} onClick={() => handleToggleUserStatus(user)}>
                            {user.status === 'active' ? '禁用' : '启用'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="tab-content">
              <div className="tab-header">
                <h3 className="tab-title">角色列表</h3>
              </div>

              <div className="roles-grid">
                {roles.map(role => (
                  <div key={role.id} className="role-card">
                    <div className="role-header">
                      <div>
                        <h4 className="role-name">{role.name}</h4>
                        <p className="role-desc">{role.description}</p>
                      </div>
                      <button className="edit-role-btn" onClick={() => handleEditRole(role)}>
                        编辑权限
                      </button>
                    </div>
                    <div className="role-permissions">
                      {role.permissions.slice(0, 5).map(p => (
                        <span key={p} className="permission-tag">{p}</span>
                      ))}
                      {role.permissions.length > 5 && (
                        <span className="permission-tag">+{role.permissions.length - 5} 更多</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="tab-content">
              <div className="log-filter-bar">
                <div className="log-filter-item">
                  <label>操作人</label>
                  <input
                    type="text"
                    placeholder="搜索操作人"
                    value={logOperator}
                    onChange={(e) => setLogOperator(e.target.value)}
                  />
                </div>
                <div className="log-filter-item">
                  <label>操作类型</label>
                  <select value={logType} onChange={(e) => setLogType(e.target.value)}>
                    <option value="">全部类型</option>
                    <option value="登录">登录</option>
                    <option value="用户管理">用户管理</option>
                    <option value="风险预测">风险预测</option>
                  </select>
                </div>
                <div className="log-filter-item">
                  <label>开始时间</label>
                  <input
                    type="date"
                    value={logStartDate}
                    onChange={(e) => setLogStartDate(e.target.value)}
                  />
                </div>
                <div className="log-filter-item">
                  <label>结束时间</label>
                  <input
                    type="date"
                    value={logEndDate}
                    onChange={(e) => setLogEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="system-table">
                  <thead>
                    <tr>
                      <th>操作人</th>
                      <th>操作类型</th>
                      <th>操作内容</th>
                      <th>操作时间</th>
                      <th>详情</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.operator}</td>
                        <td>
                          <span className="log-type-badge">{log.type}</span>
                        </td>
                        <td>{log.action}</td>
                        <td>{log.time}</td>
                        <td>
                          <button className="detail-btn" onClick={() => notifyInfo(log.details)}>
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {!loading && !error && showUserModal && (
        <UserModal
          user={currentUser}
          onClose={() => setShowUserModal(false)}
          onSave={handleSaveUser}
        />
      )}

      {!loading && !error && showRoleModal && currentRole && (
        <RoleModal
          role={currentRole}
          selectedPermissions={selectedPermissions}
          onTogglePermission={togglePermission}
          onToggleAllInGroup={toggleAllInGroup}
          onClose={() => setShowRoleModal(false)}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: User | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'user',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{user ? '编辑用户' : '新增用户'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">角色</label>
            <select
              className="form-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="admin">管理员</option>
              <option value="user">普通用户</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              保存
            </button>
          </div>
        </form>
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 0.75rem;
            width: 100%;
            max-width: 500px;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
          }

          .modal-form {
            padding: 1.5rem;
          }

          .form-group {
            margin-bottom: 1.25rem;
          }

          .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
          }

          .form-input {
            width: 100%;
            padding: 0.625rem 0.875rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            color: #111827;
          }

          .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding-top: 0.5rem;
          }

          .btn-cancel {
            padding: 0.625rem 1.25rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            background: white;
            color: #374151;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
          }

          .btn-primary {
            padding: 0.625rem 1.25rem;
            border: none;
            border-radius: 0.5rem;
            background: #3b82f6;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}

function RoleModal({
  role,
  selectedPermissions,
  onTogglePermission,
  onToggleAllInGroup,
  onClose,
  onSave,
}: {
  role: Role;
  selectedPermissions: string[];
  onTogglePermission: (id: string) => void;
  onToggleAllInGroup: (group: any) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content role-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">编辑角色权限 - {role.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="permission-tree">
            {permissionTree.map(group => {
              const allSelected = group.children.every((child: any) => selectedPermissions.includes(child.id));
              const someSelected = group.children.some((child: any) => selectedPermissions.includes(child.id));
              
              return (
                <div key={group.id} className="permission-group">
                  <div className="permission-group-header">
                    <label className="permission-checkbox-label">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => onToggleAllInGroup(group)}
                      />
                      <span>{group.name}</span>
                    </label>
                  </div>
                  <div className="permission-children">
                    {group.children.map((child: any) => (
                      <label key={child.id} className="permission-checkbox-label child">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(child.id)}
                          onChange={() => onTogglePermission(child.id)}
                        />
                        <span>{child.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={onSave}>
            保存权限
          </button>
        </div>
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal-content {
            background: white;
            border-radius: 0.75rem;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .role-modal {
            max-width: 700px;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
          }

          .permission-tree {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .permission-group {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1rem;
          }

          .permission-group-header {
            margin-bottom: 0.75rem;
          }

          .permission-checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-size: 0.9375rem;
            color: #111827;
          }

          .permission-checkbox-label.child {
            padding-left: 1.5rem;
            font-size: 0.875rem;
            color: #374151;
          }

          .permission-children {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .modal-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding: 1rem 1.5rem;
            border-top: 1px solid #e5e7eb;
          }

          .btn-cancel {
            padding: 0.625rem 1.25rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            background: white;
            color: #374151;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
          }

          .btn-primary {
            padding: 0.625rem 1.25rem;
            border: none;
            border-radius: 0.5rem;
            background: #3b82f6;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}
