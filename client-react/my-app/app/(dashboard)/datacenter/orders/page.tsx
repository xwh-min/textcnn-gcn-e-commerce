'use client';

import { useState, useEffect } from 'react';
import DataList from '@/components/common/DataList';
import { apiService } from '@/src/services/api';

interface Order {
  id: string;
  orderNo: string;
  enterpriseName: string;
  enterpriseId: string;
  productName: string;
  quantity: number;
  amount: number;
  orderTime: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
}

interface ImportItem {
  row: number;
  enterpriseName: string;
  productName: string;
  quantity: number;
  amount: number;
  valid: boolean;
  reason?: string;
}

const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const statusClasses: Record<string, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  shipped: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-gray',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getOrders();

      if (response.code === 200 && response.data) {
        const formattedOrders: Order[] = response.data.map((item: any) => ({
          id: item.id.toString(),
          orderNo: item.order_no || item.orderNo || '',
          enterpriseName: item.company_name || item.enterpriseName || '',
          enterpriseId: String(item.company_id || item.enterpriseId || ''),
          productName: item.product_name || item.productName || '',
          quantity: item.quantity || 0,
          amount: item.amount || 0,
          orderTime: item.order_date || item.orderTime || '',
          status: (item.status?.toLowerCase() as any) || 'pending',
        }));
        setOrders(formattedOrders);
      } else {
        setError(response.message || '加载订单数据失败');
      }
    } catch (err) {
      console.error('加载订单数据失败:', err);
      setError('加载订单数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDelete = async (record: any) => {
    if (!confirm('确定要删除这个订单吗？')) return;
    const response = await apiService.deleteOrder(parseInt(record.id));
    if (response.code === 200) await loadOrders();
    else alert(response.message || '删除失败');
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1);

    const companiesResp = await apiService.getCompanies({ page: 1, page_size: 1000 });
    const companyNames = new Set((companiesResp.data || []).map((c: any) => c.name));

    const parsed: ImportItem[] = rows.map((line, idx) => {
      const [enterpriseName, productName, quantity, amount] = line.split(',').map((x) => (x || '').trim());
      const valid = !!enterpriseName && !!productName && !!quantity && !!amount && companyNames.has(enterpriseName);
      return {
        row: idx + 2,
        enterpriseName,
        productName,
        quantity: Number(quantity || 0),
        amount: Number(amount || 0),
        valid,
        reason: valid ? undefined : companyNames.has(enterpriseName) ? '字段缺失/格式不正确' : '企业不存在',
      };
    });

    setImportItems(parsed);
  };

  const handleConfirmImport = async () => {
    const validRows = importItems.filter((x) => x.valid);
    if (validRows.length === 0) {
      alert('没有可导入的有效数据');
      return;
    }

    const payload = validRows.map((x, i) => ({
      order_no: `BATCH-${Date.now()}-${i}`,
      company_id: 1,
      product_name: x.productName,
      quantity: x.quantity,
      amount: x.amount,
      order_date: new Date().toISOString().slice(0, 10),
      destination: '未知',
    }));

    const resp = await apiService.batchImportOrders(payload);
    if (resp.code === 200) {
      alert(`导入完成：成功 ${validRows.length} 条，失败 ${importItems.length - validRows.length} 条`);
      setShowImportModal(false);
      setImportItems([]);
      await loadOrders();
    } else {
      alert(resp.message || '导入失败');
    }
  };

  const columns = [
    { key: 'orderNo', title: '订单号' },
    { key: 'enterpriseName', title: '企业名称' },
    { key: 'productName', title: '商品名称' },
    { key: 'quantity', title: '数量' },
    { key: 'amount', title: '金额', render: (value: number) => `¥${value.toLocaleString()}` },
    { key: 'orderTime', title: '下单时间' },
    { key: 'status', title: '状态', render: (value: string) => <span className={`badge ${statusClasses[value]}`}>{statusLabels[value]}</span> },
  ];

  return (
    <div className="datatype-page">
      {!loading && !error && (
        <DataList
          title="订单数据"
          subtitle="支持筛选分页、企业关联、批量导入"
          columns={columns}
          data={orders}
          pageSize={10}
          showAddBtn
          showImportBtn
          backLink="/datacenter"
          onAdd={() => alert('新增订单（需关联企业）')}
          onImport={() => setShowImportModal(true)}
          onEdit={(record) => alert('编辑订单: ' + record.orderNo)}
          onView={(record) => alert('查看订单详情: ' + record.orderNo)}
          onDelete={handleDelete}
        />
      )}

      {loading && <div style={{ padding: 24 }}>加载中...</div>}
      {error && <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>}

      {showImportModal && (
        <div className="import-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="import-modal-title">批量导入订单</h2>
            <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])} />
            <p>模板列：企业名称,商品名称,数量,金额</p>

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
              <button className="import-btn-primary" onClick={handleConfirmImport}>开始导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
