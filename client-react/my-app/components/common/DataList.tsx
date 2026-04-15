'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Column {
  key: string;
  title: string;
  render?: (value: any, record: any) => React.ReactNode;
}

interface DataListProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  pageSize?: number;
  showAddBtn?: boolean;
  showImportBtn?: boolean;
  onAdd?: () => void;
  onImport?: () => void;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onView?: (record: any) => void;
  backLink?: string;
  filters?: React.ReactNode;
}

export default function DataList({
  title,
  subtitle,
  columns,
  data,
  pageSize = 10,
  showAddBtn = false,
  showImportBtn = false,
  onAdd,
  onImport,
  onEdit,
  onDelete,
  onView,
  backLink,
  filters,
}: DataListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');

  // 搜索过滤
  const filteredData = data.filter((item) => {
    if (!searchText) return true;
    return Object.values(item).some(
      (value) =>
        typeof value === 'string' &&
        value.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  // 分页
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="data-list-page">
      <div className="data-list-container">
        {/* 页面头部 */}
        <div className="data-list-header">
          <div className="data-list-header-left">
            {backLink && (
              <Link href={backLink} className="data-list-back">
                ← 返回
              </Link>
            )}
            <div>
              <h1 className="data-list-title">{title}</h1>
              {subtitle && <p className="data-list-subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="data-list-actions">
            {showImportBtn && onImport && (
              <button className="data-list-btn-secondary" onClick={onImport}>
                📥 批量导入
              </button>
            )}
            {showAddBtn && onAdd && (
              <button className="data-list-btn-primary" onClick={onAdd}>
                + 新增
              </button>
            )}
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="data-list-filter-bar">
          <div className="data-list-search">
            <input
              type="text"
              className="data-list-search-input"
              placeholder="搜索..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          {filters && <div className="data-list-filters">{filters}</div>}
        </div>

        {/* 表格 */}
        <div className="data-list-card">
          <div className="data-list-table-container">
            <table className="data-list-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.title}</th>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <th>操作</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record, index) => (
                  <tr key={record.id || index}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(record[col.key], record)
                          : record[col.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <td>
                        {onView && (
                          <button
                            className="data-list-link"
                            onClick={() => onView(record)}
                          >
                            查看
                          </button>
                        )}
                        {onEdit && (
                          <button
                            className="data-list-link"
                            onClick={() => onEdit(record)}
                          >
                            编辑
                          </button>
                        )}
                        {onDelete && (
                          <button
                            className="data-list-link-danger"
                            onClick={() => onDelete(record)}
                          >
                            删除
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="data-list-pagination">
            <div className="data-list-pagination-info">
              显示 <span>{startIndex + 1}</span> 到{' '}
              <span>{Math.min(startIndex + pageSize, filteredData.length)}</span> 共{' '}
              <span>{filteredData.length}</span> 条记录
            </div>
            <div className="data-list-pagination-buttons">
              <button
                className="data-list-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`data-list-pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="data-list-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .data-list-page {
          padding: 1.5rem;
        }

        .data-list-container {
          max-width: 100%;
        }

        .data-list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .data-list-header-left {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .data-list-back {
          color: #6b7280;
          text-decoration: none;
          font-size: 0.875rem;
        }

        .data-list-back:hover {
          color: #374151;
        }

        .data-list-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .data-list-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .data-list-actions {
          display: flex;
          gap: 0.75rem;
        }

        .data-list-btn-primary,
        .data-list-btn-secondary {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .data-list-btn-primary {
          border: none;
          background: #3b82f6;
          color: white;
        }

        .data-list-btn-primary:hover {
          background: #2563eb;
        }

        .data-list-btn-secondary {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
        }

        .data-list-btn-secondary:hover {
          background: #f9fafb;
        }

        .data-list-filter-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        @media (min-width: 768px) {
          .data-list-filter-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .data-list-search {
          flex: 1;
          max-width: 400px;
        }

        .data-list-search-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .data-list-search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .data-list-filters {
          display: flex;
          gap: 0.75rem;
        }

        .data-list-card {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .data-list-table-container {
          overflow-x: auto;
        }

        .data-list-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-list-table thead {
          background: #f9fafb;
        }

        .data-list-table th {
          padding: 0.75rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .data-list-table td {
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          white-space: nowrap;
        }

        .data-list-table tbody tr {
          border-top: 1px solid #e5e7eb;
        }

        .data-list-table tbody tr:hover {
          background: #f9fafb;
        }

        .data-list-link,
        .data-list-link-danger {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          margin-right: 0.75rem;
        }

        .data-list-link {
          color: #3b82f6;
        }

        .data-list-link:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        .data-list-link-danger {
          color: #dc2626;
        }

        .data-list-link-danger:hover {
          color: #b91c1c;
          text-decoration: underline;
        }

        .data-list-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.5rem;
        }

        .data-list-pagination-info {
          font-size: 0.875rem;
          color: #374151;
        }

        .data-list-pagination-info span {
          font-weight: 500;
        }

        .data-list-pagination-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .data-list-pagination-btn {
          padding: 0.375rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .data-list-pagination-btn:hover:not(:disabled) {
          background: #f9fafb;
        }

        .data-list-pagination-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .data-list-pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
