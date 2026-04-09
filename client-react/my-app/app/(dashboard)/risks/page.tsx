'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import './styles.css';

interface RiskRecord {
  id: string;
  enterpriseName: string;
  creditCode: string;
  predictionDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceRisk: { hasRisk: boolean; probability: number };
  paymentRisk: { hasRisk: boolean; probability: number };
  riskReason: string;
  relations: { type: string; name: string }[];
  textData: string[];
  orderData: { id: string; amount: number; date: string }[];
}

const riskLevelLabels: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
};

const riskLevelColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#991b1b',
};

const riskLevelClasses: Record<string, string> = {
  low: 'risk-low',
  medium: 'risk-medium',
  high: 'risk-high',
  critical: 'risk-critical',
};

export default function RisksPage() {
  const [records, setRecords] = useState<RiskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RiskRecord | null>(null);
  const pageSize = 10;

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPredictionHistory();
      
      if (response.code === 200 && response.data) {
        const formattedRecords: RiskRecord[] = response.data.map((item: any) => ({
          id: item.id.toString(),
          enterpriseName: item.enterpriseName || item.companyName || '',
          creditCode: item.creditCode || item.registrationCode || '',
          predictionDate: item.predictionDate || item.createTime || '',
          riskLevel: (item.riskLevel?.toLowerCase() as any) || 'low',
          complianceRisk: {
            hasRisk: item.complianceRisk || item.hasComplianceRisk || false,
            probability: item.complianceProbability || item.complianceScore || 0,
          },
          paymentRisk: {
            hasRisk: item.paymentRisk || item.hasPaymentRisk || false,
            probability: item.paymentProbability || item.paymentScore || 0,
          },
          riskReason: item.riskReason || item.description || '',
          relations: item.relations || [],
          textData: item.textData || [],
          orderData: item.orderData || [],
        }));
        setRecords(formattedRecords);
      } else {
        setError(response.message || '加载风险历史失败');
      }
    } catch (err) {
      console.error('加载风险历史失败:', err);
      setError('加载风险历史失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = records.filter((item) => {
    const matchSearch = item.enterpriseName.includes(searchText);
    const matchRisk = filterRiskLevel === 'all' || item.riskLevel === filterRiskLevel;
    const matchDate = 
      (!startDate || new Date(item.predictionDate) >= new Date(startDate)) &&
      (!endDate || new Date(item.predictionDate) <= new Date(endDate + ' 23:59:59'));
    return matchSearch && matchRisk && matchDate;
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  const handleViewDetail = (record: RiskRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const handleExportReport = (record: RiskRecord) => {
    alert(`正在导出 ${record.enterpriseName} 的风险报告...`);
  };

  return (
    <div className="risks-page">
      <div className="risks-container">
        <div className="risks-header">
          <div className="risks-header-left">
            <h1 className="risks-title">风险预测历史</h1>
            <p className="risks-subtitle">历史风险记录管理与报告导出</p>
          </div>
        </div>

        <div className="risks-card">
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
                onClick={loadRecords}
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
            <>
              <div className="risks-filter-bar">
                <div className="risks-search">
                  <div className="risks-search-container">
                    <svg className="risks-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="text"
                      className="risks-search-input"
                      placeholder="搜索企业名称"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                </div>

                <div className="risks-filter-actions">
                  <select
                    className="risks-filter-select"
                    value={filterRiskLevel}
                    onChange={(e) => setFilterRiskLevel(e.target.value)}
                  >
                    <option value="all">所有风险等级</option>
                    <option value="low">低风险</option>
                    <option value="medium">中风险</option>
                    <option value="high">高风险</option>
                    <option value="critical">严重风险</option>
                  </select>

                  <div className="date-filter">
                    <input
                      type="date"
                      className="risks-filter-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="date-separator">至</span>
                    <input
                      type="date"
                      className="risks-filter-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="risks-table-container">
                <table className="risks-table">
                  <thead>
                    <tr>
                      <th>企业名称</th>
                      <th>预测时间</th>
                      <th>风险等级</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          暂无风险记录
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((item) => (
                        <tr key={item.id}>
                          <td className="enterprise-name">
                            <div>{item.enterpriseName}</div>
                            <div className="credit-code">{item.creditCode}</div>
                          </td>
                          <td>{item.predictionDate}</td>
                          <td>
                            <span
                              className={`risks-badge ${riskLevelClasses[item.riskLevel]}`}
                              style={{
                                backgroundColor: riskLevelColors[item.riskLevel] + '20',
                                color: riskLevelColors[item.riskLevel],
                              }}
                            >
                              {riskLevelLabels[item.riskLevel]}
                            </span>
                          </td>
                          <td>
                            <button
                              className="risks-link"
                              onClick={() => handleViewDetail(item)}
                            >
                              查看详情
                            </button>
                            <button
                              className="risks-link-success"
                              onClick={() => handleExportReport(item)}
                            >
                              导出报告
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="risks-pagination">
                  <div className="risks-pagination-info">
                    显示 <span>{startIndex + 1}</span> 到{' '}
                    <span>{Math.min(startIndex + pageSize, filteredRecords.length)}</span> 共{' '}
                    <span>{filteredRecords.length}</span> 条记录
                  </div>
                  <div className="risks-pagination-buttons">
                    <button
                      className="risks-pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      上一页
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`risks-pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="risks-pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDetailModal && selectedRecord && (
        <DetailModal
          record={selectedRecord}
          onClose={() => setShowDetailModal(false)}
          onExport={() => handleExportReport(selectedRecord)}
        />
      )}
    </div>
  );
}

function DetailModal({
  record,
  onClose,
  onExport,
}: {
  record: RiskRecord;
  onClose: () => void;
  onExport: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">风险预测详情</h2>
          <div className="modal-actions">
            <button className="export-btn" onClick={onExport}>
              <svg className="export-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              导出报告
            </button>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3 className="detail-section-title">基础信息</h3>
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span className="detail-label">企业名称</span>
                <span className="detail-value">{record.enterpriseName}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-label">统一社会信用代码</span>
                <span className="detail-value">{record.creditCode}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-label">预测时间</span>
                <span className="detail-value">{record.predictionDate}</span>
              </div>
              <div className="detail-info-item">
                <span className="detail-label">风险等级</span>
                <span
                  className="detail-value"
                  style={{
                    color: riskLevelColors[record.riskLevel],
                    fontWeight: 600,
                  }}
                >
                  {riskLevelLabels[record.riskLevel]}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">完整预测结果</h3>
            <div className="risk-results-grid">
              <div className="risk-result-card">
                <div className="risk-result-header">
                  <span className="risk-result-icon">📋</span>
                  <span className="risk-result-title">合规风险</span>
                </div>
                <div className="risk-result-status">
                  <span
                    className={`risk-result-badge ${
                      record.complianceRisk.hasRisk ? 'danger' : 'success'
                    }`}
                  >
                    {record.complianceRisk.hasRisk ? '存在风险' : '正常'}
                  </span>
                </div>
                <div className="risk-result-probability">
                  <div className="probability-bar">
                    <div
                      className="probability-fill"
                      style={{
                        width: `${record.complianceRisk.probability}%`,
                        background: record.complianceRisk.hasRisk ? '#ef4444' : '#10b981',
                      }}
                    ></div>
                  </div>
                  <span className="probability-value">{record.complianceRisk.probability}%</span>
                </div>
              </div>

              <div className="risk-result-card">
                <div className="risk-result-header">
                  <span className="risk-result-icon">💰</span>
                  <span className="risk-result-title">支付风险</span>
                </div>
                <div className="risk-result-status">
                  <span
                    className={`risk-result-badge ${
                      record.paymentRisk.hasRisk ? 'danger' : 'success'
                    }`}
                  >
                    {record.paymentRisk.hasRisk ? '存在风险' : '正常'}
                  </span>
                </div>
                <div className="risk-result-probability">
                  <div className="probability-bar">
                    <div
                      className="probability-fill"
                      style={{
                        width: `${record.paymentRisk.probability}%`,
                        background: record.paymentRisk.hasRisk ? '#ef4444' : '#10b981',
                      }}
                    ></div>
                  </div>
                  <span className="probability-value">{record.paymentRisk.probability}%</span>
                </div>
              </div>
            </div>

            <div className="risk-reason-box">
              <div className="risk-reason-label">风险原因分析</div>
              <div className="risk-reason-text">{record.riskReason}</div>
            </div>
          </div>

          {record.relations.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-section-title">关联关系</h3>
              <div className="relations-list">
                {record.relations.map((relation, index) => (
                  <div key={index} className="relation-item">
                    <span className="relation-type">{relation.type}</span>
                    <span className="relation-name">{relation.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.textData.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-section-title">文本数据摘要</h3>
              <div className="text-data-list">
                {record.textData.map((text, index) => (
                  <div key={index} className="text-data-item">
                    <span className="text-data-icon">📄</span>
                    <span className="text-data-text">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.orderData.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-section-title">订单数据摘要</h3>
              <div className="order-data-table">
                <table>
                  <thead>
                    <tr>
                      <th>订单号</th>
                      <th>金额</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.orderData.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>¥{order.amount.toLocaleString()}</td>
                        <td>{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            padding: 1rem;
          }

          .detail-modal-content {
            background: white;
            border-radius: 1rem;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
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
            margin: 0;
          }

          .modal-actions {
            display: flex;
            gap: 0.75rem;
            align-items: center;
          }

          .export-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: white;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .export-btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }

          .export-icon {
            width: 1.125rem;
            height: 1.125rem;
          }

          .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
            padding: 0.25rem;
            line-height: 1;
          }

          .modal-body {
            padding: 1.5rem;
          }

          .detail-section {
            margin-bottom: 1.5rem;
          }

          .detail-section:last-child {
            margin-bottom: 0;
          }

          .detail-section-title {
            font-size: 1rem;
            font-weight: 600;
            color: #111827;
            margin: 0 0 1rem 0;
          }

          .detail-info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .detail-info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .detail-label {
            font-size: 0.8125rem;
            color: #6b7280;
          }

          .detail-value {
            font-size: 0.9375rem;
            color: #111827;
            font-weight: 500;
          }

          .risk-results-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .risk-result-card {
            background: #f9fafb;
            border-radius: 0.75rem;
            padding: 1rem;
          }

          .risk-result-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          }

          .risk-result-icon {
            font-size: 1.25rem;
          }

          .risk-result-title {
            font-size: 0.9375rem;
            font-weight: 600;
            color: #111827;
          }

          .risk-result-status {
            margin-bottom: 0.75rem;
          }

          .risk-result-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }

          .risk-result-badge.success {
            background: #d1fae5;
            color: #065f46;
          }

          .risk-result-badge.danger {
            background: #fee2e2;
            color: #991b1b;
          }

          .risk-result-probability {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .probability-bar {
            flex: 1;
            height: 0.625rem;
            background: #e5e7eb;
            border-radius: 9999px;
            overflow: hidden;
          }

          .probability-fill {
            height: 100%;
            border-radius: 9999px;
            transition: width 0.3s ease;
          }

          .probability-value {
            font-size: 0.9375rem;
            font-weight: 700;
            color: #111827;
            min-width: 3rem;
            text-align: right;
          }

          .risk-reason-box {
            background: #fef3c7;
            border-radius: 0.5rem;
            padding: 1rem;
            border-left: 4px solid #f59e0b;
          }

          .risk-reason-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 0.5rem;
          }

          .risk-reason-text {
            font-size: 0.9375rem;
            line-height: 1.6;
            color: #78350f;
          }

          .relations-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .relation-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 0.5rem;
          }

          .relation-type {
            padding: 0.25rem 0.75rem;
            background: #dbeafe;
            color: #1e40af;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }

          .relation-name {
            font-size: 0.9375rem;
            color: #111827;
            font-weight: 500;
          }

          .text-data-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .text-data-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 0.5rem;
          }

          .text-data-icon {
            font-size: 1.125rem;
          }

          .text-data-text {
            font-size: 0.875rem;
            color: #374151;
          }

          .order-data-table {
            overflow-x: auto;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
          }

          .order-data-table table {
            width: 100%;
            border-collapse: collapse;
          }

          .order-data-table th {
            background: #f9fafb;
            padding: 0.75rem 1rem;
            text-align: left;
            font-size: 0.8125rem;
            font-weight: 600;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
          }

          .order-data-table td {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
          }

          .order-data-table tr:last-child td {
            border-bottom: none;
          }

          @media (max-width: 768px) {
            .detail-info-grid {
              grid-template-columns: 1fr;
            }

            .risk-results-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
