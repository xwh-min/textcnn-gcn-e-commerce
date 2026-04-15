'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/src/services/api';
import { notifyError, notifySuccess, notifyInfo } from '@/src/utils/notify';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  rateLimit: number;
  createdAt: string;
}

interface ApiStatItem {
  appName: string;
  calls: number;
  successRate: number;
}

export default function ApiManagementPage() {
  const [tab, setTab] = useState<'keys' | 'stats' | 'docs'>('keys');

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [stats, setStats] = useState<ApiStatItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState(100);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appName, setAppName] = useState('');

  const docs = useMemo(
    () => [
      {
        path: '/api/v1/risk/predict',
        method: 'POST',
        params: '{ company_name: string, recent_data: { policy_news?: string[], user_complaints?: string[], text?: string } }',
        sample: '{ "company_name": "示例企业A", "recent_data": { "text": "最近3个月", "policy_news": ["新规发布"], "user_complaints": ["物流延误"] } }',
      },
      {
        path: '/api/v1/risk/predictions',
        method: 'GET',
        params: 'query: company_name, limit',
        sample: '/api/v1/risk/predictions?company_name=示例企业A&limit=20',
      },
      {
        path: '/api/v1/risk/report',
        method: 'GET',
        params: 'query: prediction_id, company_name',
        sample: '/api/v1/risk/report?prediction_id=1&company_name=示例企业A',
      },
    ],
    []
  );

  const loadKeys = async () => {
    setLoading(true);
    try {
      const resp = await apiService.getApiKeys({ page: 1, page_size: 200 });
      const list = Array.isArray(resp.data) ? resp.data : [];
      setKeys(
        list.map((item: any) => ({
          id: String(item.id),
          name: item.name || item.app_name || '未命名应用',
          key: item.key || item.api_key || '******',
          enabled: item.enabled ?? item.status === 'enabled',
          rateLimit: Number(item.rate_limit || 100),
          createdAt: item.created_at || '-',
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const resp = await apiService.getApiStats({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        app_name: appName || undefined,
      });
      const list = Array.isArray(resp.data) ? resp.data : [];
      setStats(
        list.map((item: any) => ({
          appName: item.app_name || item.appName || '-',
          calls: Number(item.calls || item.total_calls || 0),
          successRate: Number(item.success_rate || item.successRate || 0),
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'keys') loadKeys();
    if (tab === 'stats') loadStats();
  }, [tab]);

  const handleCreateKey = async () => {
    const resp = await apiService.createApiKey({ name: newName, app_name: newName, rate_limit: Number(newRate) });
    if (resp.code === 200) {
      setShowCreate(false);
      setNewName('');
      setNewRate(100);
      notifySuccess('API密钥创建成功');
      await loadKeys();
    } else {
      notifyError(resp.message || '创建失败');
    }
  };

  const handleToggleKey = async (item: ApiKeyItem) => {
    const resp = await apiService.updateApiKey(Number(item.id), { enabled: !item.enabled });
    if (resp.code === 200) {
      notifySuccess('状态更新成功');
      await loadKeys();
    } else {
      notifyError(resp.message || '更新失败');
    }
  };

  const handleUpdateRate = async (item: ApiKeyItem) => {
    const input = prompt('请输入新的限流值（每分钟）', String(item.rateLimit));
    if (!input) return;
    const val = Number(input);
    if (Number.isNaN(val) || val <= 0) {
      alert('限流值不合法');
      return;
    }
    const resp = await apiService.updateApiKey(Number(item.id), { rate_limit: val });
    if (resp.code === 200) await loadKeys();
    else alert(resp.message || '更新失败');
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>API 密钥管理</h1>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>创建密钥、启用禁用、限流设置、调用统计与接口文档</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('keys')}>密钥管理</button>
        <button onClick={() => setTab('stats')}>调用统计</button>
        <button onClick={() => setTab('docs')}>接口文档</button>
      </div>

      {loading && <div>加载中...</div>}

      {!loading && tab === 'keys' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setShowCreate(true)}>创建密钥</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>应用</th>
                <th style={{ textAlign: 'left' }}>密钥</th>
                <th style={{ textAlign: 'left' }}>状态</th>
                <th style={{ textAlign: 'left' }}>限流</th>
                <th style={{ textAlign: 'left' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td>{k.key}</td>
                  <td>{k.enabled ? '启用' : '禁用'}</td>
                  <td>{k.rateLimit}/分钟</td>
                  <td>
                    <button onClick={() => handleToggleKey(k)}>{k.enabled ? '禁用' : '启用'}</button>
                    <button onClick={() => handleUpdateRate(k)} style={{ marginLeft: 8 }}>设置限流</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showCreate && (
            <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <input placeholder="应用名称" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <input type="number" placeholder="限流值" value={newRate} onChange={(e) => setNewRate(Number(e.target.value))} />
              </div>
              <button onClick={handleCreateKey}>确认创建</button>
              <button onClick={() => setShowCreate(false)} style={{ marginLeft: 8 }}>取消</button>
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'stats' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <input placeholder="应用名" value={appName} onChange={(e) => setAppName(e.target.value)} />
            <button onClick={loadStats}>查询</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={{ textAlign: 'left' }}>应用</th><th style={{ textAlign: 'left' }}>调用次数</th><th style={{ textAlign: 'left' }}>成功率</th></tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={i}><td>{s.appName}</td><td>{s.calls}</td><td>{s.successRate}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'docs' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          {docs.map((d) => (
            <div key={d.path} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px dashed #e5e7eb' }}>
              <div><strong>{d.method}</strong> {d.path}</div>
              <div style={{ color: '#6b7280' }}>参数：{d.params}</div>
              <div style={{ color: '#6b7280' }}>示例：{d.sample}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
