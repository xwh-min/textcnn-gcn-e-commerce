'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import '../enterprises/styles.css';

interface Enterprise {
  id: string;
  name: string;
  creditCode: string;
  type: 'enterprise' | 'logistics' | 'customs';
  riskStatus: 'high' | 'medium' | 'low' | 'normal';
  registerDate: string;
  lastDetectionDate: string;
  hasRelations: boolean;
}

const typeLabels: Record<string, string> = {
  enterprise: '企业',
  logistics: '物流商',
  customs: '海关',
};

const riskStatusLabels: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
  normal: '正常',
};

const riskStatusClasses: Record<string, string> = {
  high: 'risk-high',
  medium: 'risk-medium',
  low: 'risk-low',
  normal: 'risk-normal',
};

export default function EnterprisesPage() {
  const router = useRouter();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRiskStatus, setFilterRiskStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentEnterprise, setCurrentEnterprise] = useState<Enterprise | null>(null);
  const pageSize = 3;

  // 加载所有主体数据
  const loadEnterprises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 分别获取企业、物流商、海关数据
      const [enterpriseRes, logisticsRes, customsRes] = await Promise.all([
        apiService.getEnterprises(),
        apiService.getLogisticsProviders(),
        apiService.getCustomsOffices(),
      ]);

      let allEnterprises: Enterprise[] = [];

      if (enterpriseRes.code === 200 && enterpriseRes.data) {
        allEnterprises = allEnterprises.concat(
          enterpriseRes.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            creditCode: item.creditCode || item.registrationNumber || '',
            type: 'enterprise' as const,
            riskStatus: item.riskLevel?.toLowerCase() as any || 'normal',
            registerDate: item.establishDate || item.registrationDate || '',
            lastDetectionDate: item.lastDetectionTime || '-',
            hasRelations: false,
          }))
        );
      }

      if (logisticsRes.code === 200 && logisticsRes.data) {
        allEnterprises = allEnterprises.concat(
          logisticsRes.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name || item.companyName,
            creditCode: item.creditCode || item.businessLicense || '',
            type: 'logistics' as const,
            riskStatus: item.riskLevel?.toLowerCase() as any || 'normal',
            registerDate: item.establishDate || item.registrationDate || '',
            lastDetectionDate: item.lastDetectionTime || '-',
            hasRelations: false,
          }))
        );
      }

      if (customsRes.code === 200 && customsRes.data) {
        allEnterprises = allEnterprises.concat(
          customsRes.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name || item.customsName,
            creditCode: item.creditCode || item.code || '',
            type: 'customs' as const,
            riskStatus: 'normal' as const,
            registerDate: item.establishDate || '',
            lastDetectionDate: '-',
            hasRelations: false,
          }))
        );
      }

      setEnterprises(allEnterprises);
    } catch (err) {
      console.error('加载主体数据失败:', err);
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnterprises();
  }, []);

  // 筛选数据
  const filteredEnterprises = enterprises.filter((item) => {
    const matchSearch = 
      item.name.includes(searchText) || 
      item.creditCode.includes(searchText);
    const matchType = filterType === 'all' || item.type === filterType;
    const matchRisk = filterRiskStatus === 'all' || item.riskStatus === filterRiskStatus;
    return matchSearch && matchType && matchRisk;
  });

  // 分页数据
  const totalPages = Math.ceil(filteredEnterprises.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEnterprises = filteredEnterprises.slice(startIndex, startIndex + pageSize);

  // 处理新增
  const handleAdd = async (data: any) => {
    try {
      let response;
      
      if (data.type === 'enterprise') {
        response = await apiService.createEnterprise({
          name: data.name,
          creditCode: data.creditCode,
          establishDate: data.registerDate,
        });
      } else if (data.type === 'logistics') {
        response = await apiService.createLogisticsProvider({
          name: data.name,
          creditCode: data.creditCode,
          establishDate: data.registerDate,
        });
      } else if (data.type === 'customs') {
        response = await apiService.createCustomsOffice({
          name: data.name,
          creditCode: data.creditCode,
          establishDate: data.registerDate,
        });
      }

      if (response?.code === 200) {
        await loadEnterprises();
        setShowAddModal(false);
      } else {
        alert(response?.message || '新增失败');
      }
    } catch (err) {
      console.error('新增失败:', err);
      alert('新增失败，请稍后重试');
    }
  };

  // 处理编辑
  const handleEdit = async (data: any) => {
    if (!currentEnterprise) return;
    try {
      let response;
      
      if (currentEnterprise.type === 'enterprise') {
        response = await apiService.updateEnterprise(parseInt(currentEnterprise.id), {
          name: data.name,
          creditCode: data.creditCode,
          establishDate: data.registerDate,
        });
      } else if (currentEnterprise.type === 'logistics') {
        response = await apiService.updateLogisticsProvider(parseInt(currentEnterprise.id), {
          name: data.name,
          creditCode: data.creditCode,
          establishDate: data.registerDate,
        });
      } else if (currentEnterprise.type === 'customs') {
        response = await apiService.updateCustomsOffice(parseInt(currentEnterprise.id), {
          name: data.name,
          creditCode: data.creditCode,
          establishDate: data.registerDate,
        });
      }

      if (response?.code === 200) {
        await loadEnterprises();
        setShowEditModal(false);
        setCurrentEnterprise(null);
      } else {
        alert(response?.message || '编辑失败');
      }
    } catch (err) {
      console.error('编辑失败:', err);
      alert('编辑失败，请稍后重试');
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!currentEnterprise) return;
    try {
      let response;
      
      if (currentEnterprise.type === 'enterprise') {
        response = await apiService.deleteEnterprise(parseInt(currentEnterprise.id));
      } else if (currentEnterprise.type === 'logistics') {
        response = await apiService.deleteLogisticsProvider(parseInt(currentEnterprise.id));
      } else if (currentEnterprise.type === 'customs') {
        response = await apiService.deleteCustomsOffice(parseInt(currentEnterprise.id));
      }

      if (response?.code === 200) {
        await loadEnterprises();
        setShowDeleteModal(false);
        setCurrentEnterprise(null);
      } else {
        alert(response?.message || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请稍后重试');
    }
  };

  // 打开编辑弹窗
  const openEditModal = (item: Enterprise) => {
    setCurrentEnterprise(item);
    setShowEditModal(true);
  };

  // 打开删除弹窗
  const openDeleteModal = (item: Enterprise) => {
    setCurrentEnterprise(item);
    setShowDeleteModal(true);
  };

  return (
    <div className="enterprises-page">
      <div className="enterprises-container">
        <div className="enterprises-header">
          <div className="enterprises-header-left">
            <h1 className="enterprises-title">主体管理</h1>
            <p className="enterprises-subtitle">企业、物流商、海关信息管理</p>
          </div>
          <div className="enterprises-actions">
            <button 
              className="enterprises-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              + 新增主体
            </button>
          </div>
        </div>
        
        <div className="enterprises-card">
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
                onClick={loadEnterprises}
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
          {/* 搜索和筛选栏 */}
          <div className="enterprises-filter-bar">
            <div className="enterprises-search">
              <div className="enterprises-search-container">
                <svg className="enterprises-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  className="enterprises-search-input"
                  placeholder="搜索名称/编码"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
            
            <div className="enterprises-filter-actions">
              <select 
                className="enterprises-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">所有类型</option>
                <option value="enterprise">企业</option>
                <option value="logistics">物流商</option>
                <option value="customs">海关</option>
              </select>
              
              <select 
                className="enterprises-filter-select"
                value={filterRiskStatus}
                onChange={(e) => setFilterRiskStatus(e.target.value)}
              >
                <option value="all">所有风险状态</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
                <option value="normal">正常</option>
              </select>
            </div>
          </div>
          
          <div className="enterprises-table-container">
            <table className="enterprises-table">
              <thead>
                <tr>
                  <th>主体名称</th>
                  <th>统一社会信用代码</th>
                  <th>类型</th>
                  <th>风险状态</th>
                  <th>注册时间</th>
                  <th>最近检测时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEnterprises.map((item) => (
                  <tr key={item.id}>
                    <td className="enterprise-name">{item.name}</td>
                    <td>{item.creditCode}</td>
                    <td>
                      <span className="enterprises-badge enterprises-badge-blue">
                        {typeLabels[item.type]}
                      </span>
                    </td>
                    <td>
                      <span className={`enterprises-badge ${riskStatusClasses[item.riskStatus]}`}>
                        {riskStatusLabels[item.riskStatus]}
                      </span>
                    </td>
                    <td>{item.registerDate}</td>
                    <td>{item.lastDetectionDate}</td>
                    <td>
                      <Link href={`/enterprises/${item.id}`} className="enterprises-link">
                        查看详情
                      </Link>
                      <button 
                        className="enterprises-link"
                        onClick={() => router.push(`/graph?enterprise=${item.id}`)}
                      >
                        查看图谱
                      </button>
                      <button 
                        className="enterprises-link"
                        onClick={() => openEditModal(item)}
                      >
                        编辑
                      </button>
                      <button 
                        className="enterprises-link-danger"
                        onClick={() => openDeleteModal(item)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 分页 */}
          <div className="enterprises-pagination">
            <div className="enterprises-pagination-info">
              显示 <span>{startIndex + 1}</span> 到 <span>{Math.min(startIndex + pageSize, filteredEnterprises.length)}</span> 共 <span>{filteredEnterprises.length}</span> 条记录
            </div>
            <div className="enterprises-pagination-buttons">
              <button 
                className="enterprises-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`enterprises-pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button 
                className="enterprises-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* 新增弹窗 */}
      {showAddModal && (
        <EnterpriseModal
          title="新增主体"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}

      {/* 编辑弹窗 */}
      {showEditModal && currentEnterprise && (
        <EnterpriseModal
          title="编辑主体"
          initialData={currentEnterprise}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
        />
      )}

      {/* 删除确认弹窗 */}
      {showDeleteModal && currentEnterprise && (
        <DeleteModal
          enterprise={currentEnterprise}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// 新增/编辑弹窗组件
function EnterpriseModal({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: Enterprise;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    creditCode: initialData?.creditCode || '',
    type: initialData?.type || 'enterprise',
    registerDate: initialData?.registerDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">主体名称</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">统一社会信用代码</label>
            <input
              type="text"
              className="form-input"
              value={formData.creditCode}
              onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">主体类型</label>
            <select
              className="form-input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="enterprise">企业</option>
              <option value="logistics">物流商</option>
              <option value="customs">海关</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">注册时间</label>
            <input
              type="date"
              className="form-input"
              value={formData.registerDate}
              onChange={(e) => setFormData({ ...formData, registerDate: e.target.value })}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              提交
            </button>
          </div>
        </form>
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
        }

        .modal-content {
          background: white;
          border-radius: 0.75rem;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
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
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
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
          margin-top: 1.5rem;
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

        .btn-primary:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}

// 删除确认弹窗组件
function DeleteModal({
  enterprise,
  onClose,
  onConfirm,
}: {
  enterprise: Enterprise;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">确认删除</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="delete-warning">
            确定要删除 <strong>{enterprise.name}</strong> 吗？
          </p>
          {enterprise.hasRelations ? (
            <div className="delete-error">
              ⚠️ 该主体存在关联关系，无法删除！
            </div>
          ) : (
            <div className="delete-hint">
              此操作不可恢复，请谨慎操作。
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            取消
          </button>
          {!enterprise.hasRelations && (
            <button type="button" className="btn-danger" onClick={onConfirm}>
              确认删除
            </button>
          )}
        </div>
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
        }

        .modal-content {
          background: white;
          border-radius: 0.75rem;
          width: 100%;
          max-width: 450px;
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
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .delete-warning {
          font-size: 1rem;
          color: #111827;
          margin-bottom: 1rem;
        }

        .delete-error {
          padding: 1rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .delete-hint {
          padding: 1rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding: 0 1.5rem 1.5rem;
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

        .btn-danger {
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 0.5rem;
          background: #dc2626;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }
      `}</style>
    </div>
  );
}
