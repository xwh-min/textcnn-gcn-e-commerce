'use client';

import { useState, useEffect } from 'react';
import DataList from '@/components/common/DataList';
import { apiService } from '@/src/services/api';

interface Logistics {
  id: string;
  waybillNo: string;
  enterpriseName: string;
  enterpriseId: string;
  logisticsCompany: string;
  origin: string;
  destination: string;
  shippingTime: string;
  status: 'pending' | 'in_transit' | 'customs' | 'delivered' | 'exception';
}

interface ImportItem {
  row: number;
  enterpriseName: string;
  trackingNo: string;
  valid: boolean;
  reason?: string;
}

const statusLabels: Record<string, string> = {
  pending: '待发货',
  in_transit: '运输中',
  customs: '清关中',
  delivered: '已签收',
  exception: '异常',
};

const statusClasses: Record<string, string> = {
  pending: 'badge-yellow',
  in_transit: 'badge-blue',
  customs: 'badge-yellow',
  delivered: 'badge-green',
  exception: 'badge-red',
};

export default function LogisticsPage() {
  const [logistics, setLogistics] = useState<Logistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);

  const loadLogistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getLogisticsRecords();
      if (response.code === 200 && response.data) {
        const list: Logistics[] = response.data.map((item: any) => ({
          id: String(item.id),
          waybillNo: item.tracking_no || item.waybillNo || '',
          enterpriseName: item.enterpriseName || '',
          enterpriseId: String(item.enterpriseId || ''),
          logisticsCompany: item.logisticsCompany || '',
          origin: item.origin || '',
          destination: item.destination || '',
          shippingTime: item.shipment_date || item.shippingTime || '',
          status: (item.status?.toLowerCase() as any) || 'pending',
        }));
        setLogistics(list);
      } else {
        setError(response.message || '加载物流数据失败');
      }
    } catch {
      setError('加载物流数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogistics();
  }, []);

  const handleDelete = async (record: any) => {
    if (!confirm('确定删除该物流记录吗？')) return;
    const response = await apiService.deleteLogisticsRecord(Number(record.id));
    if (response.code === 200) await loadLogistics();
    else alert(response.message || '删除失败');
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1);

    const companiesResp = await apiService.getCompanies({ page: 1, page_size: 1000 });
    const companyNames = new Set((companiesResp.data || []).map((c: any) => c.company_name || c.name));

    const parsed = rows.map((line, idx) => {
      const [enterpriseName, trackingNo] = line.split(',').map((x) => (x || '').trim());
      const valid = !!enterpriseName && !!trackingNo && companyNames.has(enterpriseName);
      return {
        row: idx + 2,
        enterpriseName,
        trackingNo,
        valid,
        reason: valid ? undefined : companyNames.has(enterpriseName) ? '字段缺失/格式不正确' : '企业不存在',
      };
    });

    setImportItems(parsed);
  };

  const columns = [
    { key: 'waybillNo', title: '运单号' },
    { key: 'enterpriseName', title: '企业名称' },
    { key: 'logisticsCompany', title: '物流公司' },
    { key: 'origin', title: '起点' },
    { key: 'destination', title: '终点' },
    { key: 'shippingTime', title: '发货时间' },
    { key: 'status', title: '状态', render: (value: string) => <span className={`badge ${statusClasses[value]}`}>{statusLabels[value]}</span> },
  ];

  return (
    <div className="datatype-page">
      {!loading && !error && (
        <DataList
          title="物流数据"
          subtitle="支持筛选分页、企业关联、批量导入"
          columns={columns}
          data={logistics}
          pageSize={10}
          showAddBtn
          showImportBtn
          backLink="/datacenter"
          onAdd={() => alert('新增物流（需关联企业）')}
          onImport={() => setShowImportModal(true)}
          onEdit={(record) => alert('编辑物流: ' + record.waybillNo)}
          onView={(record) => alert('查看物流详情: ' + record.waybillNo)}
          onDelete={handleDelete}
        />
      )}

      {loading && <div style={{ padding: 24 }}>加载中...</div>}
      {error && <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>}

      {showImportModal && (
        <div className="import-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="import-modal-title">批量导入物流数据</h2>
            <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])} />
            <p>模板列：企业名称,运单号</p>

            {importItems.length > 0 && (
              <div style={{ maxHeight: 240, overflow: 'auto', marginTop: 12 }}>
                {importItems.map((item) => (
                  <div key={item.row} style={{ fontSize: 13, color: item.valid ? '#065f46' : '#991b1b' }}>
                    第{item.row}行 - {item.enterpriseName} - {item.valid ? '通过' : `失败：${item.reason}`}
                  </div>
                ))}
              </div>
            )}

            <div className="import-modal-actions">
              <button className="import-btn-cancel" onClick={() => setShowImportModal(false)}>取消</button>
              <button
                className="import-btn-primary"
                onClick={() => {
                  const ok = importItems.filter((x) => x.valid).length;
                  const bad = importItems.length - ok;
                  alert(`校验完成：成功 ${ok} 条，失败 ${bad} 条`);
                  setShowImportModal(false);
                }}
              >
                开始导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
