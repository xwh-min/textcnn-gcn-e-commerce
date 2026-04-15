'use client';

import { useState, useEffect } from 'react';
import DataList from '@/components/common/DataList';
import { apiService } from '@/services/api';

interface Complaint {
  id: string;
  orderNo: string;
  enterpriseName: string;
  complaintType: string;
  complaintTime: string;
  description: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

const statusClasses: Record<string, string> = {
  pending: 'badge-red',
  processing: 'badge-yellow',
  resolved: 'badge-green',
  closed: 'badge-gray',
};

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const priorityClasses: Record<string, string> = {
  high: 'badge-red',
  medium: 'badge-yellow',
  low: 'badge-green',
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getComplaints();
      
      if (response.code === 200 && response.data) {
        const formattedComplaints: Complaint[] = response.data.map((item: any) => ({
          id: item.id.toString(),
          orderNo: item.orderNo || item.orderNumber || '',
          enterpriseName: item.enterpriseName || item.companyName || '',
          complaintType: item.complaintType || item.type || '',
          complaintTime: item.complaintTime || item.createTime || '',
          description: item.description || item.content || '',
          status: (item.status?.toLowerCase() as any) || 'pending',
          priority: (item.priority?.toLowerCase() as any) || 'medium',
        }));
        setComplaints(formattedComplaints);
      } else {
        setError(response.message || '加载投诉数据失败');
      }
    } catch (err) {
      console.error('加载投诉数据失败:', err);
      setError('加载投诉数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleMarkResolved = async (record: any) => {
    try {
      const response = await apiService.markComplaintProcessed(parseInt(record.id));
      if (response.code === 200) {
        await loadComplaints();
      } else {
        alert(response.message || '操作失败');
      }
    } catch (err) {
      console.error('操作失败:', err);
      alert('操作失败，请稍后重试');
    }
  };

  const handleDelete = async (record: any) => {
    if (confirm('确定要删除这条投诉吗？')) {
      try {
        const response = await apiService.deleteComplaint(parseInt(record.id));
        if (response.code === 200) {
          await loadComplaints();
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
    { key: 'complaintType', title: '投诉类型' },
    { key: 'complaintTime', title: '投诉时间' },
    {
      key: 'priority',
      title: '优先级',
      render: (value: string) => (
        <span className={`badge ${priorityClasses[value]}`}>{priorityLabels[value]}</span>
      ),
    },
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
            onClick={loadComplaints}
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
        title="用户投诉"
        subtitle="用户投诉记录处理"
        columns={columns}
        data={complaints}
        pageSize={10}
        showAddBtn={true}
        backLink="/datacenter"
        onAdd={() => alert('新增投诉')}
        onEdit={(record) => alert('编辑投诉: ' + record.id)}
        onView={(record) => alert('查看投诉详情: ' + record.id)}
        onDelete={handleDelete}
        customActions={(record) => (
          record.status !== 'resolved' && record.status !== 'closed' && (
            <button
              onClick={() => handleMarkResolved(record)}
              style={{
                padding: '0.25rem 0.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                marginRight: '0.5rem'
              }}
            >
              标记已处理
            </button>
          )
        )}
      />
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

        .badge-red {
          background: #fee2e2;
          color: #991b1b;
        }

        .badge-yellow {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-green {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-gray {
          background: #f3f4f6;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
