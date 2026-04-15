'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/src/services/api';
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

const normalizePercent = (v: unknown) => {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0;
  return v <= 1 ? Math.round(v * 100) : Math.max(0, Math.min(100, Math.round(v)));
};

const normalizeRiskLevel = (v?: string): RiskRecord['riskLevel'] => {
  const x = (v || '').toLowerCase();
  if (x === 'low' || x === 'medium' || x === 'high' || x === 'critical') return x;
  return 'low';
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

      const response = await apiService.getRiskHistory({
        company_name: searchText || undefined,
        limit: 200,
      });

      const list = Array.isArray(response.data) ? response.data : [];

      const formatted: RiskRecord[] = list.map((item: any, idx: number) => {
        const complianceScore = item.scores?.compliance_score ?? item.compliance_score ?? 0;
        const paymentScore = item.scores?.payment_score ?? item.payment_score ?? 0;

        return {
          id: String(item.prediction_id ?? item.id ?? idx + 1),
          enterpriseName: item.company_name || item.enterpriseName || '未知企业',
          creditCode: item.credit_code || item.creditCode || '-',
          predictionDate: item.created_at || item.predictionDate || '-',
          riskLevel: normalizeRiskLevel(item.compliance_risk || item.payment_risk),
          complianceRisk: {
            hasRisk: (item.compliance_risk || 'low') !== 'low',
            probability: normalizePercent(complianceScore),
          },
          paymentRisk: {
            hasRisk: (item.payment_risk || 'low') !== 'low',
            probability: normalizePercent(paymentScore),
          },
          riskReason: item.analysis?.text_analysis?.key_risk_factors?.join('；') || '暂无风险原因说明',
          relations: item.analysis?.graph_analysis?.high_risk_communities
            ? [{ type: '高风险社群', name: String(item.analysis.graph_analysis.high_risk_communities) }]
            : [],
          textData: item.analysis?.text_analysis?.key_risk_factors || [],
          orderData: [],
        };
      });

      setRecords(formatted);
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
    const matchSearch = !searchText || item.enterpriseName.includes(searchText);
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

  const handleExportReport = async (record: RiskRecord) => {
    try {
      const resp = await apiService.getRiskReport({
        prediction_id: record.id,
        company_name: record.enterpriseName,
      });
      if (resp.code === 404) {
        alert('报告生成功能开发中，敬请期待');
        return;
      }
      if (resp.code !== 200) {
        alert(resp.message || '导出报告失败');
        return;
      }
      alert('报告导出请求已提交');
    } catch {
      alert('导出报告失败，请稍后重试');
    }
  };

  return (
    <div className="risks-page">
      <div className="risks-container">
        <div className="risks-header">
          <div className="risks-header-left">
            <h1 className="risks-title">风险预测历史</h1>
            <p className="risks-subtitle">支持筛选、详情查看与报告导出</p>
          </div>
        </div>

        <div className="risks-card">
          {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>加载中...</div>}
          {error && <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b' }}>{error}</div>}

          {!loading && !error && (
            <>
              <div className="risks-filter-bar">
                <div className="risks-search">
                  <div className="risks-search-container">
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
                  <select className="risks-filter-select" value={filterRiskLevel} onChange={(e) => setFilterRiskLevel(e.target.value)}>
                    <option value="all">所有风险等级</option>
                    <option value="low">低风险</option>
                    <option value="medium">中风险</option>
                    <option value="high">高风险</option>
                    <option value="critical">严重风险</option>
                  </select>

                  <div className="date-filter">
                    <input type="date" className="risks-filter-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <span className="date-separator">至</span>
                    <input type="date" className="risks-filter-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>

                  <button className="risks-link" onClick={loadRecords}>刷新</button>
                </div>
              </div>

              <div className="risks-table-container">
                <table className="risks-table">
                  <thead>
                    <tr><th>企业名称</th><th>预测时间</th><th>风险等级</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length === 0 ? (
                      <tr><td colSpan={4} className="empty-state">暂无风险记录</td></tr>
                    ) : (
                      paginatedRecords.map((item) => (
                        <tr key={item.id}>
                          <td className="enterprise-name"><div>{item.enterpriseName}</div><div className="credit-code">{item.creditCode}</div></td>
                          <td>{item.predictionDate}</td>
                          <td>
                            <span className="risks-badge" style={{ backgroundColor: `${riskLevelColors[item.riskLevel]}20`, color: riskLevelColors[item.riskLevel] }}>
                              {riskLevelLabels[item.riskLevel]}
                            </span>
                          </td>
                          <td>
                            <button className="risks-link" onClick={() => handleViewDetail(item)}>查看详情</button>
                            <button className="risks-link-success" onClick={() => handleExportReport(item)}>导出报告</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="risks-pagination">
                  <div className="risks-pagination-buttons">
                    <button className="risks-pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>上一页</button>
                    <button className="risks-pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>下一页</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDetailModal && selectedRecord && (
        <DetailModal record={selectedRecord} onClose={() => setShowDetailModal(false)} onExport={() => handleExportReport(selectedRecord)} />
      )}
    </div>
  );
}

function DetailModal({ record, onClose, onExport }: { record: RiskRecord; onClose: () => void; onExport: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">风险预测详情</h2>
          <div className="modal-actions">
            <button className="export-btn" onClick={onExport}>导出报告</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3 className="detail-section-title">基础信息</h3>
            <div className="detail-info-grid">
              <div className="detail-info-item"><span className="detail-label">企业名称</span><span className="detail-value">{record.enterpriseName}</span></div>
              <div className="detail-info-item"><span className="detail-label">统一社会信用代码</span><span className="detail-value">{record.creditCode}</span></div>
              <div className="detail-info-item"><span className="detail-label">预测时间</span><span className="detail-value">{record.predictionDate}</span></div>
              <div className="detail-info-item"><span className="detail-label">风险等级</span><span className="detail-value" style={{ color: riskLevelColors[record.riskLevel], fontWeight: 600 }}>{riskLevelLabels[record.riskLevel]}</span></div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">完整预测结果</h3>
            <div>合规风险：{record.complianceRisk.hasRisk ? '存在风险' : '正常'}（{record.complianceRisk.probability}%）</div>
            <div>支付风险：{record.paymentRisk.hasRisk ? '存在风险' : '正常'}（{record.paymentRisk.probability}%）</div>
            <div style={{ marginTop: 8 }}>风险原因：{record.riskReason}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
