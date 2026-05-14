'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/src/services/api';
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
  predictionId?: number;
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

const toPercent = (value: unknown): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value <= 1) return Math.round(value * 100);
  return Math.max(0, Math.min(100, Math.round(value)));
};

const toRiskLevel = (value?: string): RiskResult['riskLevel'] => {
  const level = (value || '').toLowerCase();
  if (level === 'high' || level === 'medium' || level === 'low' || level === 'critical') {
    return level;
  }
  return 'low';
};

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

  const loadEnterprises = async () => {
    try {
      setLoading(true);
      setError(null);

      const [enterpriseRes, logisticsRes, customsRes] = await Promise.all([
        apiService.getCompanies({ page: 1, page_size: 1000 }),
        apiService.getLogistics({ page: 1, page_size: 1000 }),
        apiService.getCustoms({ page: 1, page_size: 1000 }),
      ]);

      let allEnterprises: Enterprise[] = [];

      const enterpriseList = Array.isArray(enterpriseRes.data) ? enterpriseRes.data : [];
      const logisticsList = Array.isArray(logisticsRes.data) ? logisticsRes.data : [];
      const customsList = Array.isArray(customsRes.data) ? customsRes.data : [];

      allEnterprises = allEnterprises.concat(
        enterpriseList.map((item: any) => ({
          id: `enterprise-${String(item.id)}`,
          name: item.company_name || '',
          creditCode: item.credit_code || '',
          type: 'enterprise' as const,
        }))
      );

      allEnterprises = allEnterprises.concat(
        logisticsList.map((item: any) => ({
          id: `logistics-${String(item.id)}`,
          name: item.provider_name || '',
          creditCode: item.business_license_no || '',
          type: 'logistics' as const,
        }))
      );

      allEnterprises = allEnterprises.concat(
        customsList.map((item: any) => ({
          id: `customs-${String(item.id)}`,
          name: item.customs_name || '',
          creditCode: item.customs_code || '',
          type: 'customs' as const,
        }))
      );

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
    setEnterpriseSearch(enterprise.name || enterprise.creditCode);
    setShowEnterpriseDropdown(false);
  };

  const saveToHistory = async (enterprise: Enterprise, result: RiskResult) => {
    try {
      await apiService.getRiskHistory({ company_name: enterprise.name || enterprise.creditCode, limit: 1 });
    } catch {
      // 后端已自动保存预测记录，无需前端手动存储
    }
  };

  const handlePredict = async () => {
    const companyName = selectedEnterprise?.name || selectedEnterprise?.creditCode || enterpriseSearch.trim();
    
    if (!companyName) {
      alert('请输入或选择企业');
      return;
    }

    if (isPredicting) return;

    setIsPredicting(true);
    setShowResult(false);

    try {
      const response = await apiService.predictRisk({
        company_name: companyName,
        recent_data: {
          text: `最近${timeRange}个月`,
        },
      });

      const payload = response.data;
      if (response.code === 200 && payload) {
        const complianceScore = payload.scores?.compliance_score ?? payload.compliance_score ?? 0;
        const paymentScore = payload.scores?.payment_score ?? payload.payment_score ?? 0;

        const result: RiskResult = {
          complianceRisk: {
            hasRisk: (payload.compliance_risk || 'low') !== 'low',
            probability: toPercent(complianceScore),
          },
          paymentRisk: {
            hasRisk: (payload.payment_risk || 'low') !== 'low',
            probability: toPercent(paymentScore),
          },
          riskLevel: toRiskLevel(
            payload.analysis?.graph_analysis?.community_risk ||
              payload.compliance_risk ||
              payload.payment_risk ||
              'low'
          ),
          riskReason:
            payload.analysis?.text_analysis?.key_risk_factors?.join('；') ||
            '模型已完成风险预测，请结合详情进行研判。',
          predictionId: payload.prediction_id,
        };

        setPredictionResult(result);
        setShowResult(true);
        
        const currentEnterprise: Enterprise = {
          id: companyName,
          name: companyName,
          creditCode: companyName,
          type: 'enterprise',
        };
        await saveToHistory(currentEnterprise, result);
      } else {
        alert(response.message || '预测失败');
      }
    } catch (e) {
      console.error('预测失败:', e);
      alert('预测失败，请稍后重试');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!predictionResult) return;
    
    const companyName = selectedEnterprise?.name || selectedEnterprise?.creditCode || enterpriseSearch.trim();
    if (!companyName) return;

    try {
      const resp = await apiService.getRiskReport({
        prediction_id: predictionResult.predictionId ? String(predictionResult.predictionId) : undefined,
        company_name: companyName,
      });
      if (resp.code === 404) {
        alert('报告生成功能开发中，敬请期待');
        return;
      }
      if (resp.code !== 200) {
        alert(resp.message || '导出PDF失败');
        return;
      }
      alert('报告导出请求已提交');
    } catch (err) {
      console.error(err);
      alert('导出PDF失败，请稍后重试');
    }
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
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>加载中...</div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '1rem',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
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
                  cursor: 'pointer',
                }}
              >
                重试
              </button>
            </div>
          )}

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
                  </div>
                  {showEnterpriseDropdown && (
                    <div className="enterprise-dropdown">
                      {filteredEnterprises.length === 0 ? (
                        <div className="enterprise-dropdown-item disabled">未找到匹配的企业</div>
                      ) : (
                        filteredEnterprises.map((enterprise) => (
                          <div
                            key={enterprise.id}
                            className={`enterprise-dropdown-item ${selectedEnterprise?.id === enterprise.id ? 'selected' : ''}`}
                            onClick={() => handleSelectEnterprise(enterprise)}
                          >
                            <div className="enterprise-name">{enterprise.name || enterprise.creditCode}</div>
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
                  disabled={isPredicting}
                >
                  {isPredicting ? '预测中...' : '开始预测'}
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
                导出PDF报告
              </button>
            </div>

            <div
              className="risk-level-card"
              style={{ background: riskLevelColors[predictionResult.riskLevel] }}
            >
              <div className="risk-level-info">
                <div className="risk-level-label">风险等级</div>
                <div className="risk-level-value">{riskLevelLabels[predictionResult.riskLevel]}</div>
              </div>
            </div>

            <div className="risk-details-grid">
              <div className="risk-detail-card">
                <div className="risk-detail-title">合规风险</div>
                <span className={`risk-badge ${predictionResult.complianceRisk.hasRisk ? 'danger' : 'success'}`}>
                  {predictionResult.complianceRisk.hasRisk ? '存在风险' : '正常'}
                </span>
                <div className="probability-value">{predictionResult.complianceRisk.probability}%</div>
              </div>

              <div className="risk-detail-card">
                <div className="risk-detail-title">支付风险</div>
                <span className={`risk-badge ${predictionResult.paymentRisk.hasRisk ? 'danger' : 'success'}`}>
                  {predictionResult.paymentRisk.hasRisk ? '存在风险' : '正常'}
                </span>
                <div className="probability-value">{predictionResult.paymentRisk.probability}%</div>
              </div>
            </div>

            <div className="risk-reason-card">
              <div className="risk-reason-title">风险原因分析</div>
              <div className="risk-reason-content">{predictionResult.riskReason}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
