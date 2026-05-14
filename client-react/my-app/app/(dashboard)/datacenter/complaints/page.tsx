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

const defaultComplaintsData: Complaint[] = [
  {
    id: '1',
    orderNo: 'ORD20240115001',
    enterpriseName: '重庆保税跨境电商',
    complaintType: '商品质量问题',
    complaintTime: '2024-01-15 09:30:00',
    description: '收到的商品与描述不符，存在明显质量问题。',
    status: 'pending',
    priority: 'high',
  },
  {
    id: '2',
    orderNo: 'ORD20240114002',
    enterpriseName: '阿里巴巴国际站',
    complaintType: '物流延迟',
    complaintTime: '2024-01-14 14:20:00',
    description: '订单超时未送达，物流信息更新不及时。',
    status: 'processing',
    priority: 'medium',
  },
  {
    id: '3',
    orderNo: 'ORD20240113003',
    enterpriseName: '京东国际',
    complaintType: '售后服务',
    complaintTime: '2024-01-13 11:15:00',
    description: '申请退货后，退款迟迟未到账。',
    status: 'resolved',
    priority: 'low',
  },
  {
    id: '4',
    orderNo: 'ORD20240112004',
    enterpriseName: '网易考拉',
    complaintType: '商品描述不符',
    complaintTime: '2024-01-12 16:45:00',
    description: '商品图片与实际收到的物品颜色差异较大。',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: '5',
    orderNo: 'ORD20240111005',
    enterpriseName: '重庆保税跨境电商',
    complaintType: '清关问题',
    complaintTime: '2024-01-11 10:00:00',
    description: '海关清关时间过长，影响收货体验。',
    status: 'processing',
    priority: 'high',
  },
];

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(defaultComplaintsData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getComplaints();
      
      if (response.code === 200 && response.data && Array.isArray(response.data) && response.data.length > 0) {
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
      }
    } catch (err) {
      console.error('加载投诉数据失败:', err);
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
