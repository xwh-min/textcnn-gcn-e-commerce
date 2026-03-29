'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import './styles.css';

// API返回的数据接口
interface RiskPredictionResponse {
  code: number;
  message: string;
  result: {
    compliance_risk: string;
    payment_risk: string;
    scores: {
      compliance_score: number;
      payment_score: number;
    };
  };
}

export default function DetectionContent() {
  const searchParams = useSearchParams();
  const company = searchParams.get('company') || '';
  const months = searchParams.get('months') || '3';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RiskPredictionResponse | null>(null);

  useEffect(() => {
    // 如果有企业名称，自动调用API
    if (company) {
      fetchRiskPrediction();
    }
  }, [company]);

  const fetchRiskPrediction = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:9090/api/risk/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: company,
          recent_data: months + "个月",
          policy_news: [],
          user_complaints: [],
          graph_structure: {}
        }),
      });

      if (!response.ok) {
        throw new Error('风险预测请求失败');
      }

      const data: RiskPredictionResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRiskPrediction();
  };

  // 获取风险等级颜色
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // 获取风险等级中文
  const getRiskLabel = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中风险';
      case 'low':
        return '低风险';
      default:
        return '未知';
    }
  };

  return (
    <div className="detection-page">
      <div className="detection-container">
        <div className="detection-header">
          <h1 className="detection-title">风险检测</h1>
          <p className="detection-subtitle">输入企业名称和数据周期进行风险检测</p>
        </div>

        <div className="detection-form-card">
          <h3 className="detection-form-title">检测表单</h3>
          <form className="detection-form" onSubmit={handleSubmit}>
            <div className="detection-form-group">
              <label htmlFor="enterpriseName" className="detection-form-label">企业名称</label>
              <input
                id="enterpriseName"
                name="enterpriseName"
                type="text"
                required
                className="detection-form-input"
                placeholder="请输入企业名称"
                defaultValue={company}
              />
            </div>
            <div className="detection-form-group">
              <label htmlFor="dataPeriod" className="detection-form-label">数据周期</label>
              <select
                id="dataPeriod"
                name="dataPeriod"
                required
                className="detection-form-select"
                defaultValue={months}
              >
                <option value="1">最近1个月</option>
                <option value="2">最近2个月</option>
                <option value="3">最近3个月</option>
                <option value="6">最近6个月</option>
                <option value="12">最近12个月</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="detection-form-button"
                disabled={loading}
              >
                {loading ? '检测中...' : '开始检测'}
              </button>
            </div>
          </form>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="detection-error-card">
            <p className="detection-error-text">{error}</p>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="detection-loading-card">
            <div className="detection-loading-spinner"></div>
            <p>正在分析企业风险数据...</p>
          </div>
        )}

        {/* 检测结果 */}
        {result && !loading && (
          <div className="detection-result-card">
            <h3 className="detection-result-title">检测结果</h3>
            <div className="detection-result-box">
              <div className="detection-result-header">
                <div className="detection-result-icon">
                  <span>📊</span>
                </div>
                <div className="detection-result-info">
                  <h4>{company}</h4>
                  <p>检测时间: {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* 风险评分 */}
              <div className="detection-section">
                <h5 className="detection-section-title">📈 风险评分</h5>
                <div className="detection-scores">
                  <div className="detection-score-item">
                    <span className="detection-score-label">合规风险评分:</span>
                    <span className="detection-score-value">
                      {(result.result.scores.compliance_score * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="detection-score-item">
                    <span className="detection-score-label">支付风险评分:</span>
                    <span className="detection-score-value">
                      {(result.result.scores.payment_score * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 风险等级 */}
              <div className="detection-section">
                <h5 className="detection-section-title">⚠️ 风险等级</h5>
                <div className="detection-risk-levels">
                  <div className="detection-risk-item">
                    <span className="detection-risk-label">合规风险:</span>
                    <span
                      className="detection-risk-badge"
                      style={{ backgroundColor: getRiskColor(result.result.compliance_risk) }}
                    >
                      {getRiskLabel(result.result.compliance_risk)}
                    </span>
                  </div>
                  <div className="detection-risk-item">
                    <span className="detection-risk-label">支付风险:</span>
                    <span
                      className="detection-risk-badge"
                      style={{ backgroundColor: getRiskColor(result.result.payment_risk) }}
                    >
                      {getRiskLabel(result.result.payment_risk)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detection-result-actions">
                <button className="detection-btn-secondary">
                  导出报告
                </button>
                <button className="detection-btn-primary">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
