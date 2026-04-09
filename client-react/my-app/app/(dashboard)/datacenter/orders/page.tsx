'use client';

import { useState, useEffect } from 'react';
import DataList from '@/components/common/DataList';
import { apiService } from '@/services/api';

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

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getOrders();
      
      if (response.code === 200 && response.data) {
        const formattedOrders: Order[] = response.data.map((item: any) => ({
          id: item.id.toString(),
          orderNo: item.orderNo || item.orderNumber || '',
          enterpriseName: item.enterpriseName || item.companyName || '',
          enterpriseId: item.enterpriseId?.toString() || '',
          productName: item.productName || item.product || '',
          quantity: item.quantity || 0,
          amount: item.amount || item.totalAmount || 0,
          orderTime: item.orderTime || item.createTime || '',
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
    if (confirm('确定要删除这个订单吗？')) {
      try {
        const response = await apiService.deleteOrder(parseInt(record.id));
        if (response.code === 200) {
          await loadOrders();
        } else {
          alert(response.message || '删除失败');
        }
      } catch (err) {
        console.error('删除失败:', err);
        alert('删除失败，请稍后重试');
      }
    }
  };

  const columns = [
    { key: 'orderNo', title: '订单号' },
    { key: 'enterpriseName', title: '企业名称' },
    { key: 'productName', title: '商品名称' },
    { key: 'quantity', title: '数量' },
    {
      key: 'amount',
      title: '金额',
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    { key: 'orderTime', title: '下单时间' },
    {
      key: 'status',
      title: '状态',
      render: (value: string) => (
        <span className={`badge ${statusClasses[value]}`}>{statusLabels[value]}</span>
      ),
    },
  ];

  return (
    <div className="datatype-page">
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>加载中...</div>
        </div>
      )}
      
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
            onClick={loadOrders}
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
      
      {!loading && !error && (
      <DataList
        title="订单数据"
        subtitle="跨境电商订单数据管理"
        columns={columns}
        data={orders}
        pageSize={10}
        showAddBtn={true}
        showImportBtn={true}
        backLink="/datacenter"
        onAdd={() => alert('新增订单')}
        onImport={() => setShowImportModal(true)}
        onEdit={(record) => alert('编辑订单: ' + record.orderNo)}
        onView={(record) => alert('查看订单详情: ' + record.orderNo)}
        onDelete={handleDelete}
      />
      )}

      {showImportModal && (
        <div className="import-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="import-modal-title">批量导入订单</h2>
            <div className="import-modal-content">
              <div className="import-upload-area">
                <div className="import-upload-icon">📥</div>
                <p className="import-upload-text">点击或拖拽上传 Excel 文件</p>
                <p className="import-upload-hint">支持 .xlsx, .xls 格式</p>
                <input type="file" className="import-upload-input" accept=".xlsx,.xls" />
              </div>
              <div className="import-tips">
                <h4>导入说明：</h4>
                <ul>
                  <li>必须包含企业信息（企业名称或企业ID）</li>
                  <li>系统会自动校验企业是否存在</li>
                  <li>导入后会显示成功/失败清单</li>
                </ul>
              </div>
            </div>
            <div className="import-modal-actions">
              <button className="import-btn-cancel" onClick={() => setShowImportModal(false)}>
                取消
              </button>
              <button className="import-btn-primary" onClick={() => setShowImportModal(false)}>
                开始导入
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .datatype-page {
          padding: 0;
        }

        .badge {
          display: inline-flex;
          padding: 0.25rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 9999px;
        }

        .badge-green {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-blue {
          background: #dbeafe;
          color: #1e40af;
        }

        .badge-yellow {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-gray {
          background: #f3f4f6;
          color: #374151;
        }

        .import-modal-overlay {
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

        .import-modal {
          background: white;
          border-radius: 0.75rem;
          width: 100%;
          max-width: 500px;
          padding: 1.5rem;
        }

        .import-modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .import-modal-content {
          margin-bottom: 1.5rem;
        }

        .import-upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          background: #f9fafb;
          margin-bottom: 1rem;
        }

        .import-upload-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .import-upload-text {
          font-size: 1rem;
          color: #374151;
          margin: 0 0 0.25rem 0;
        }

        .import-upload-hint {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .import-upload-input {
          display: none;
        }

        .import-tips {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .import-tips h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.5rem 0;
        }

        .import-tips ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .import-tips li {
          margin: 0.25rem 0;
        }

        .import-modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .import-btn-cancel {
          padding: 0.625rem 1.25rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .import-btn-primary {
          padding: 0.625rem 1.25rem;
          border: none;
          border-radius: 0.5rem;
          background: #3b82f6;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .import-btn-primary:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}
