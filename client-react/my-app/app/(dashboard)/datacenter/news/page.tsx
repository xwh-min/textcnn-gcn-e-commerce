'use client';

import { useState, useEffect } from 'react';
import DataList from '@/components/common/DataList';
import { apiService } from '@/services/api';
import './styles.css';

interface News {
  id: string;
  title: string;
  source: string;
  publishDate: string;
  category: 'policy' | 'industry' | 'other';
  content: string;
  status: 'published' | 'draft' | 'archived';
}

const categoryLabels: Record<string, string> = {
  policy: '监管政策',
  industry: '行业新闻',
  other: '其他',
};

const statusLabels: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const statusClasses: Record<string, string> = {
  published: 'badge-green',
  draft: 'badge-yellow',
  archived: 'badge-gray',
};

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);

  // 加载新闻数据
  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPolicyNews();
      
      if (response.code === 200 && response.data) {
        const formattedNews: News[] = response.data.map((item: any) => ({
          id: item.id.toString(),
          title: item.title || item.headline || '',
          source: item.source || item.publisher || '',
          publishDate: item.publishDate || item.releaseDate || '',
          category: (item.category?.toLowerCase() as any) || 'other',
          content: item.content || item.summary || '',
          status: (item.status?.toLowerCase() as any) || 'published',
        }));
        setNews(formattedNews);
      } else {
        setError(response.message || '加载新闻数据失败');
      }
    } catch (err) {
      console.error('加载新闻数据失败:', err);
      setError('加载新闻数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const columns = [
    { key: 'title', title: '新闻标题' },
    { key: 'source', title: '来源' },
    { key: 'publishDate', title: '发布日期' },
    {
      key: 'category',
      title: '分类',
      render: (value: string) => categoryLabels[value],
    },
    {
      key: 'status',
      title: '状态',
      render: (value: string) => (
        <span className={`badge ${statusClasses[value]}`}>{statusLabels[value]}</span>
      ),
    },
  ];

  // 处理新增
  const handleAdd = async (data: any) => {
    try {
      const response = await apiService.createPolicyNews(data);
      if (response.code === 200) {
        await loadNews();
        setShowModal(false);
      } else {
        alert(response.message || '新增失败');
      }
    } catch (err) {
      console.error('新增失败:', err);
      alert('新增失败，请稍后重试');
    }
  };

  // 处理编辑
  const handleEdit = async (data: any) => {
    if (!editingNews) return;
    try {
      const response = await apiService.updatePolicyNews(parseInt(editingNews.id), data);
      if (response.code === 200) {
        await loadNews();
        setShowModal(false);
        setEditingNews(null);
      } else {
        alert(response.message || '编辑失败');
      }
    } catch (err) {
      console.error('编辑失败:', err);
      alert('编辑失败，请稍后重试');
    }
  };

  // 处理删除
  const handleDelete = async (record: any) => {
    if (confirm('确定要删除这条新闻吗？')) {
      try {
        const response = await apiService.deletePolicyNews(parseInt(record.id));
        if (response.code === 200) {
          await loadNews();
        } else {
          alert(response.message || '删除失败');
        }
      } catch (err) {
        console.error('删除失败:', err);
        alert('删除失败，请稍后重试');
      }
    }
  };

  return (
    <div className="datatype-page">
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
            onClick={loadNews}
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
      <DataList
        title="政策新闻"
        subtitle="监管政策、行业新闻管理"
        columns={columns}
        data={news}
        pageSize={10}
        showAddBtn={true}
        backLink="/datacenter"
        onAdd={() => {
          setEditingNews(null);
          setShowModal(true);
        }}
        onEdit={(record) => {
          setEditingNews(record);
          setShowModal(true);
        }}
        onView={(record) => {
          alert('查看新闻详情: ' + record.title);
        }}
        onDelete={handleDelete}
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

        .badge-green {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-yellow {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-gray {
          background: #f3f4f6;
          color: #374151;
        }
      `}</style>
    </div>
  );
}
