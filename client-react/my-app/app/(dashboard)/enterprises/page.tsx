'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/src/services/api';
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

const typeLabels: Record<Enterprise['type'], string> = {
  enterprise: '企业',
  logistics: '物流商',
  customs: '海关',
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
  const pageSize = 6;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentEnterprise, setCurrentEnterprise] = useState<Enterprise | null>(null);

  const loadEnterprises = async () => {
    try {
      setLoading(true);
      setError(null);

      const [companyRes, logisticsRes, customsRes] = await Promise.all([
        apiService.getCompanies({ page: 1, page_size: 1000 }),
        apiService.getLogistics({ page: 1, page_size: 1000 }),
        apiService.getCustoms({ page: 1, page_size: 1000 }),
      ]);

      const companies = (companyRes.data || []).map((item: any) => ({
        id: String(item.id),
        name: item.company_name || item.name,
        creditCode: item.credit_code || '',
        type: 'enterprise' as const,
        riskStatus: (item.is_high_risk ? 'high' : 'normal') as Enterprise['riskStatus'],
        registerDate: item.created_at || '-',
        lastDetectionDate: item.last_detection_time || '-',
        hasRelations: false,
      }));

      const logistics = (logisticsRes.data || []).map((item: any) => ({
        id: String(item.id),
        name: item.provider_name || item.name,
        creditCode: item.business_license_no || item.code || '',
        type: 'logistics' as const,
        riskStatus: (item.is_high_risk ? 'high' : 'normal') as Enterprise['riskStatus'],
        registerDate: item.created_at || '-',
        lastDetectionDate: item.last_detection_time || '-',
        hasRelations: false,
      }));

      const customs = (customsRes.data || []).map((item: any) => ({
        id: String(item.id),
        name: item.customs_name || item.name,
        creditCode: item.customs_code || item.code || '',
        type: 'customs' as const,
        riskStatus: 'normal' as const,
        registerDate: item.created_at || '-',
        lastDetectionDate: '-',
        hasRelations: false,
      }));

      setEnterprises([...companies, ...logistics, ...customs]);
    } catch (err) {
      console.error(err);
      setError('主体数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnterprises();
  }, []);

  const filtered = useMemo(() => {
    return enterprises.filter((x) => {
      const matchSearch = !searchText || x.name.includes(searchText) || x.creditCode.includes(searchText);
      const matchType = filterType === 'all' || x.type === filterType;
      const matchRisk = filterRiskStatus === 'all' || x.riskStatus === filterRiskStatus;
      return matchSearch && matchType && matchRisk;
    });
  }, [enterprises, searchText, filterType, filterRiskStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleAdd = async (data: any) => {
    try {
      let resp: any;
      if (data.type === 'enterprise') {
        resp = await apiService.createCompany({
          name: data.name,
          region: data.region || '未知',
          industry: data.industry || '未知',
          credit_code: data.creditCode,
          phone: data.phone || '00000000000',
          email: data.email || 'noreply@example.com',
          address: data.address || '未知',
        });
      } else if (data.type === 'logistics') {
        resp = await apiService.createLogistics({
          name: data.name,
          code: data.creditCode,
          phone: data.phone || '00000000000',
          email: data.email || 'noreply@example.com',
          address: data.address || '未知',
          service_regions: ['默认'],
        });
      } else {
        resp = await apiService.createCustoms({
          name: data.name,
          code: data.creditCode,
          region: data.region || '默认',
          phone: data.phone || '00000000000',
          address: data.address || '未知',
        });
      }

      if (resp.code === 200) {
        setShowAddModal(false);
        await loadEnterprises();
      } else {
        alert(resp.message || '新增失败');
      }
    } catch {
      alert('新增失败，请稍后重试');
    }
  };

  const handleEdit = async (data: any) => {
    if (!currentEnterprise) return;
    try {
      let resp: any;
      if (currentEnterprise.type === 'enterprise') {
        resp = await apiService.updateCompany(Number(currentEnterprise.id), {
          company_name: data.name,
          credit_code: data.creditCode,
        });
      } else if (currentEnterprise.type === 'logistics') {
        resp = await apiService.updateLogistics(Number(currentEnterprise.id), {
          provider_name: data.name,
          business_license_no: data.creditCode,
        });
      } else {
        resp = await apiService.updateCustoms(Number(currentEnterprise.id), {
          customs_name: data.name,
          customs_code: data.creditCode,
        });
      }

      if (resp.code === 200) {
        setShowEditModal(false);
        setCurrentEnterprise(null);
        await loadEnterprises();
      } else {
        alert(resp.message || '编辑失败');
      }
    } catch {
      alert('编辑失败，请稍后重试');
    }
  };

  const openDeleteModal = async (item: Enterprise) => {
    let hasRelations = false;
    try {
      const rel = await apiService.getRelations({ page: 1, page_size: 1000 });
      const list = rel.data || [];
      hasRelations = list.some((r: any) => String(r.source_id) === item.id || String(r.target_id) === item.id);
    } catch {
      hasRelations = false;
    }

    setCurrentEnterprise({ ...item, hasRelations });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!currentEnterprise) return;
    if (currentEnterprise.hasRelations) {
      alert('该主体存在关联关系，不可删除');
      return;
    }

    let resp: any;
    if (currentEnterprise.type === 'enterprise') resp = await apiService.deleteCompany(Number(currentEnterprise.id));
    if (currentEnterprise.type === 'logistics') resp = await apiService.deleteLogistics(Number(currentEnterprise.id));
    if (currentEnterprise.type === 'customs') resp = await apiService.deleteCustoms(Number(currentEnterprise.id));

    if (resp?.code === 200) {
      setShowDeleteModal(false);
      setCurrentEnterprise(null);
      await loadEnterprises();
    } else {
      alert(resp?.message || '删除失败');
    }
  };

  return (
    <div className="enterprises-page">
      <div className="enterprises-container">
        <div className="enterprises-header">
          <div className="enterprises-header-left">
            <h1 className="enterprises-title">主体管理</h1>
            <p className="enterprises-subtitle">企业 / 物流商 / 海关</p>
          </div>
          <button className="enterprises-add-btn" onClick={() => setShowAddModal(true)}>+ 新增</button>
        </div>

        <div className="enterprises-card">
          <div className="enterprises-filter-bar">
            <input className="enterprises-search-input" placeholder="搜索名称/编码" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            <select className="enterprises-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">所有类型</option><option value="enterprise">企业</option><option value="logistics">物流商</option><option value="customs">海关</option>
            </select>
            <select className="enterprises-filter-select" value={filterRiskStatus} onChange={(e) => setFilterRiskStatus(e.target.value)}>
              <option value="all">所有风险状态</option><option value="high">高风险</option><option value="medium">中风险</option><option value="low">低风险</option><option value="normal">正常</option>
            </select>
          </div>

          {loading && <div style={{ padding: 24 }}>加载中...</div>}
          {error && <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>}

          {!loading && !error && (
            <>
              <div className="enterprises-table-container">
                <table className="enterprises-table">
                  <thead><tr><th>名称</th><th>编码</th><th>类型</th><th>风险</th><th>操作</th></tr></thead>
                  <tbody>
                    {pageItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.creditCode}</td>
                        <td>{typeLabels[item.type]}</td>
                        <td>{item.riskStatus}</td>
                        <td>
                          <Link href={`/enterprises/${item.id}`} className="enterprises-link">详情</Link>
                          <button className="enterprises-link" onClick={() => router.push(`/graph?enterprise=${item.id}`)}>查看图谱</button>
                          <button className="enterprises-link" onClick={() => { setCurrentEnterprise(item); setShowEditModal(true); }}>编辑</button>
                          <button className="enterprises-link-danger" onClick={() => openDeleteModal(item)}>删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="enterprises-pagination-buttons">
                <button className="enterprises-pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>上一页</button>
                <span style={{ padding: '0 10px' }}>{currentPage}/{totalPages}</span>
                <button className="enterprises-pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>下一页</button>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddModal && <EnterpriseModal title="新增主体" onClose={() => setShowAddModal(false)} onSubmit={handleAdd} />}
      {showEditModal && currentEnterprise && <EnterpriseModal title="编辑主体" initialData={currentEnterprise} onClose={() => setShowEditModal(false)} onSubmit={handleEdit} />}
      {showDeleteModal && currentEnterprise && <DeleteModal enterprise={currentEnterprise} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} />}
    </div>
  );
}

function EnterpriseModal({ title, initialData, onClose, onSubmit }: { title: string; initialData?: Enterprise; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    creditCode: initialData?.creditCode || '',
    type: initialData?.type || 'enterprise',
    region: '',
    industry: '',
    phone: '',
    email: '',
    address: '',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2 className="modal-title">{title}</h2><button className="modal-close" onClick={onClose}>×</button></div>
        <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <input className="form-input" placeholder="主体名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input className="form-input" placeholder="编码" value={formData.creditCode} onChange={(e) => setFormData({ ...formData, creditCode: e.target.value })} required />
          <select className="form-input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}><option value="enterprise">企业</option><option value="logistics">物流商</option><option value="customs">海关</option></select>
          <div className="modal-actions"><button type="button" className="btn-cancel" onClick={onClose}>取消</button><button type="submit" className="btn-primary">提交</button></div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ enterprise, onClose, onConfirm }: { enterprise: Enterprise; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2 className="modal-title">确认删除</h2><button className="modal-close" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <p>确定删除 <strong>{enterprise.name}</strong> 吗？</p>
          {enterprise.hasRelations ? <div className="delete-error">该主体存在关联关系，不可删除</div> : <div className="delete-hint">删除后不可恢复</div>}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          {!enterprise.hasRelations && <button className="btn-danger" onClick={onConfirm}>确认删除</button>}
        </div>
      </div>
    </div>
  );
}
