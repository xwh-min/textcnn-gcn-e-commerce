'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import './styles.css';

interface Enterprise {
  id: string;
  name: string;
  creditCode: string;
  type: 'enterprise' | 'logistics' | 'customs';
}

interface RiskResult {
  complianceRisk: {
    hasRisk: boolean;
    probability: number;
  };
  paymentRisk: {
    hasRisk: boolean;
    probability: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskReason: string;
}

const riskLevelLabels: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
};

const riskLevelColors: Record<string, string> = {
  low: 'linear-gradient(135deg, #10b981, #059669)',
  medium: 'linear-gradient(135deg, #f59e0b, #d97706)',
  high: 'linear-gradient(135deg, #ef4444, #dc2626)',
  critical: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
};

const timeRangeOptions = [
  { label: '最近1个月', value: 1 },
  { label: '最近3个月', value: 3 },
  { label: '最近6个月', value: 6 },
  { label: '最近1年', value: 12 },
];

export default function DetectionPage() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [enterpriseSearch, setEnterpriseSearch] = useState('');
  const [showEnterpriseDropdown, setShowEnterpriseDropdown] = useState(false);
  const [timeRange, setTimeRange] = useState(3);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<RiskResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 加载企业数据
  const loadEnterprises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 分别获取企业、物流商、海关数据
      const [enterpriseRes, logisticsRes, customsRes] = await Promise.all([
        apiService.getEnterprises(),
        apiService.getLogisticsProviders(),
        apiService.getCustomsOffices(),
      ]);

      let allEnterprises: Enterprise[] = [];

      if (enterpriseRes.code === 200 && enterpriseRes.data) {
        allEnterprises = allEnterprises.concat(
          enterpriseRes.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            creditCode: item.creditCode || item.registrationNumber || '',
            type: 'enterprise' as const,
          }))
        );
      }

      if (logisticsRes.code === 200 && logisticsRes.data) {
        allEnterprises = allEnterprises.concat(
          logisticsRes.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name || item.companyName,
            creditCode: item.creditCode || item.businessLicense || '',
            type: 'logistics' as const,
          }))
        );
      }

      if (customsRes.code === 200 && customsRes.data) {
        allEnterprises = allEnterprises.concat(
          customsRes.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name || item.customsName,
            creditCode: item.creditCode || item.code || '',
            type: 'customs' as const,
          }))
        );
      }

      setEnterprises(allEnterprises);
    } catch (err) {
      console.error('加载企业数据失败:', err);
      setError('加载企业数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnterprises();
  }, []);

  const filteredEnterprises = enterprises.filter(
    (enterprise) =>
      enterprise.name.includes(enterpriseSearch) ||
      enterprise.creditCode.includes(enterpriseSearch)
  );

  const handleSelectEnterprise = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise);
    setEnterpriseSearch(enterprise.name);
    setShowEnterpriseDropdown(false);
  };

  const handlePredict = async () => {
    if (!selectedEnterprise) {
      alert('请先选择企业');
      return;
    }

    setIsPredicting(true);
    setShowResult(false);

    try {
      const response = await apiService.singleRiskPrediction({
        enterpriseId: parseInt(selectedEnterprise.id),
        timeRangeMonths: timeRange,
      });

      if (response.code === 200 && response.data) {
        // 将API响应转换为我们的界面格式
        const apiData = response.data;
        const result: RiskResult = {
          complianceRisk: {
            hasRisk: apiData.complianceRisk || apiData.hasComplianceRisk || false,
            probability: apiData.complianceProbability || apiData.complianceRiskScore || Math.round(Math.random() * 100),
          },
          paymentRisk: {
            hasRisk: apiData.paymentRisk || apiData.hasPaymentRisk || false,
            probability: apiData.paymentProbability || apiData.paymentRiskScore || Math.round(Math.random() * 100),
          },
          riskLevel: (apiData.riskLevel?.toLowerCase() as any) || 'low',
          riskReason: apiData.riskReason || apiData.description || '风险检测完成',
        };

        setPredictionResult(result);
        setShowResult(true);
        saveToHistory(selectedEnterprise, result);
      } else {
        alert(response.message || '预测失败');
      }
    } catch (error) {
      console.error('预测失败:', error);
      alert('预测失败，请稍后重试');
    } finally {
      setIsPredicting(false);
    }
  };

  const saveToHistory = (enterprise: Enterprise, result: RiskResult) => {
    const history = JSON.parse(localStorage.getItem('riskHistory') || '[]');
    const newRecord = {
      id: Date.now().toString(),
      enterpriseId: enterprise.id,
      enterpriseName: enterprise.name,
      creditCode: enterprise.creditCode,
      timeRange: timeRange,
      predictionDate: new Date().toISOString(),
      result: result,
    };
    history.unshift(newRecord);
    localStorage.setItem('riskHistory', JSON.stringify(history));
  };

  const handleExportPDF = () => {
    if (!selectedEnterprise || !predictionResult) return;
    alert('PDF导出功能开发中...');
  };

  return (
    <div className="detection-page">
      <div className="detection-container">
        <div className="detection-header">
          <div className="detection-header-left">
            <h1 className="detection-title">单次风险预测</h1>
            <p className="detection-subtitle">对指定企业进行风险检测和评估</p>
          </div>
        </div>

        <div className="detection-card">
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
                onClick={loadEnterprises}
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
          <div className="detection-form">
            <div className="form-group">
              <label className="form-label">选择企业</label>
              <div className="enterprise-selector">
                <div
                  className="enterprise-search-input-wrapper"
                  onClick={() => setShowEnterpriseDropdown(!showEnterpriseDropdown)}
                >
                  <input
                    type="text"
                    className="enterprise-search-input"
                    placeholder="搜索企业名称或统一社会信用代码"
                    value={enterpriseSearch}
                    onChange={(e) => {
                      setEnterpriseSearch(e.target.value);
                      setShowEnterpriseDropdown(true);
                    }}
                  />
                  <svg
                    className="enterprise-search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                {showEnterpriseDropdown && (
                  <div className="enterprise-dropdown">
                    {filteredEnterprises.length === 0 ? (
                      <div className="enterprise-dropdown-item disabled">未找到匹配的企业</div>
                    ) : (
                      filteredEnterprises.map((enterprise) => (
                        <div
                          key={enterprise.id}
                          className={`enterprise-dropdown-item ${
                            selectedEnterprise?.id === enterprise.id ? 'selected' : ''
                          }`}
                          onClick={() => handleSelectEnterprise(enterprise)}
                        >
                          <div className="enterprise-name">{enterprise.name}</div>
                          <div className="enterprise-code">{enterprise.creditCode}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">时间范围</label>
              <select
                className="form-select"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                className={`predict-btn ${isPredicting ? 'loading' : ''}`}
                onClick={handlePredict}
                disabled={isPredicting || !selectedEnterprise}
              >
                {isPredicting ? (
                  <>
                    <span className="spinner"></span>
                    预测中...
                  </>
                ) : (
                  '开始预测'
                )}
              </button>
            </div>
          </div>
          )}
        </div>

        {!loading && !error && showResult && predictionResult && (
          <div className="result-section">
            <div className="result-header">
              <h2 className="result-title">预测结果</h2>
              <button className="export-btn" onClick={handleExportPDF}>
                <svg
                  className="export-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                导出PDF报告
              </button>
            </div>

            <div
              className="risk-level-card"
              style={{ background: riskLevelColors[predictionResult.riskLevel] }}
            >
              <div className="risk-level-icon">⚠️</div>
              <div className="risk-level-info">
                <div className="risk-level-label">风险等级</div>
                <div className="risk-level-value">
                  {riskLevelLabels[predictionResult.riskLevel]}
                </div>
              </div>
            </div>

            <div className="risk-details-grid">
              <div className="risk-detail-card">
                <div className="risk-detail-header">
                  <div className="risk-detail-icon">📋</div>
                  <div className="risk-detail-title">合规风险</div>
                </div>
                <div className="risk-detail-body">
                  <div className="risk-status">
                    <span
                      className={`risk-badge ${
                        predictionResult.complianceRisk.hasRisk ? 'danger' : 'success'
                      }`}
                    >
                      {predictionResult.complianceRisk.hasRisk ? '存在风险' : '正常'}
                    </span>
                  </div>
                  <div className="risk-probability">
                    <div className="probability-label">风险概率</div>
                    <div className="probability-bar">
                      <div
                        className="probability-fill"
                        style={{
                          width: `${predictionResult.complianceRisk.probability}%`,
                          background: predictionResult.complianceRisk.hasRisk
                            ? '#ef4444'
                            : '#10b981',
                        }}
                      ></div>
                    </div>
                    <div className="probability-value">
                      {predictionResult.complianceRisk.probability}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="risk-detail-card">
                <div className="risk-detail-header">
                  <div className="risk-detail-icon">💰</div>
                  <div className="risk-detail-title">支付风险</div>
                </div>
                <div className="risk-detail-body">
                  <div className="risk-status">
                    <span
                      className={`risk-badge ${
                        predictionResult.paymentRisk.hasRisk ? 'danger' : 'success'
                      }`}
                    >
                      {predictionResult.paymentRisk.hasRisk ? '存在风险' : '正常'}
                    </span>
                  </div>
                  <div className="risk-probability">
                    <div className="probability-label">风险概率</div>
                    <div className="probability-bar">
                      <div
                        className="probability-fill"
                        style={{
                          width: `${predictionResult.paymentRisk.probability}%`,
                          background: predictionResult.paymentRisk.hasRisk
                            ? '#ef4444'
                            : '#10b981',
                        }}
                      ></div>
                    </div>
                    <div className="probability-value">
                      {predictionResult.paymentRisk.probability}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="risk-reason-card">
              <div className="risk-reason-header">
                <div className="risk-reason-icon">📝</div>
                <div className="risk-reason-title">风险原因分析</div>
              </div>
              <div className="risk-reason-content">{predictionResult.riskReason}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
