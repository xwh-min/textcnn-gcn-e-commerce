'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MultimodalFusion from '@/components/business/MultimodalFusion';
import { apiService } from '@/src/services/api';
import './styles.css';

// API返回的数据接口
interface RiskPredictionResult {
  compliance_risk: string;
  payment_risk: string;
  scores: {
    compliance_score: number;
    payment_score: number;
  };
  text_cnn_features?: number[];
  gcn_features?: number[];
  fused_features?: number[];
  analysis?: {
    text_analysis: {
      policy_sentiment: string;
      complaint_count: number;
      key_risk_factors: string[];
    };
    graph_analysis: {
      centrality_score: number;
      neighbor_risk_level: string;
      community_risk: string;
    };
  };
}


// 模拟数据
const mockPolicyNews = [
  '最新跨境电商政策调整，加强海关监管力度',
  '税收优惠政策延续，支持跨境电商发展',
  '海关查验率提升，加强商品质量监管',
];

const mockUserComplaints = [
  '用户投诉：物流延迟超过预期时间',
  '商品质量问题，与描述不符',
  '售后服务响应慢，退款处理不及时',
];

const mockGraphStructure = {
  nodes: [
    { id: 'e1', type: 'enterprise', riskLevel: 'medium' },
    { id: 'l1', type: 'logistics' },
    { id: 'c1', type: 'customs' },
  ],
  edges: [
    { source: 'e1', target: 'l1', type: 'cooperation', weight: 0.8 },
    { source: 'e1', target: 'c1', type: 'compliance', weight: 0.6 },
  ],
};

export default function DetectionContent() {
  const searchParams = useSearchParams();
  const company = searchParams.get('company') || '';
  const months = searchParams.get('months') || '3';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RiskPredictionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'result' | 'analysis'>('result');
  const [companyName, setCompanyName] = useState(company);
  const [dataPeriod, setDataPeriod] = useState(months);
  const [predictorHealth, setPredictorHealth] = useState<{
    healthy: boolean;
    backend?: string;
    is_mock?: boolean;
    strict?: boolean;
  } | null>(null);

  useEffect(() => {
    setCompanyName(company);
  }, [company]);

  useEffect(() => {
    setDataPeriod(months);
  }, [months]);

  useEffect(() => {
    fetchPredictorHealth();
  }, []);

  useEffect(() => {
    // 如果有企业名称，自动调用API
    if (company) {
      fetchRiskPrediction(company, months);
    }
  }, [company, months]);

  const fetchPredictorHealth = async () => {
    try {
      const healthData = await apiService.getRiskPredictorHealth();
      const healthResult = (healthData?.data || {}) as {
        healthy?: boolean;
        backend?: string;
        is_mock?: boolean;
        strict?: boolean;
      };

      setPredictorHealth({
        healthy: Boolean(healthResult.healthy),
        backend: healthResult.backend,
        is_mock: healthResult.is_mock,
        strict: healthResult.strict,
      });
    } catch {
      setPredictorHealth({ healthy: false });
    }
  };

  const fetchRiskPrediction = async (name: string, period: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await apiService.predictRisk({
        company_name: name,
        recent_data: {
          text: `${period}个月`,
          policy_news: mockPolicyNews,
          user_complaints: mockUserComplaints,
        },
        graph_structure: mockGraphStructure,
      });

      if (data?.data) {
        setResult(data.data as unknown as RiskPredictionResult);
        return;
      }

      setError(data?.message || '预测服务返回异常');
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('请输入企业名称');
      return;
    }
    fetchRiskPrediction(companyName.trim(), dataPeriod);
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

  // 准备多模态融合组件的数据
  const prepareFusionData = () => {
    if (!result) return null;

    const textFeatures = [
      {
        type: 'policy' as const,
        content: '最新跨境电商政策调整，加强海关监管力度',
        sentiment: (result.analysis?.text_analysis.policy_sentiment === 'negative' ? 'negative' : result.analysis?.text_analysis.policy_sentiment === 'positive' ? 'positive' : 'neutral') as 'negative' | 'positive' | 'neutral',
        riskScore: result.scores.compliance_score,
      },
      {
        type: 'complaint' as const,
        content: '用户投诉：物流延迟，商品质量问题',
        sentiment: 'negative' as const,
        riskScore: result.scores.payment_score,
      },
    ];

    const graphFeatures = [
      {
        nodeId: 'e1',
        nodeType: 'enterprise',
        centrality: result.analysis?.graph_analysis.centrality_score || 0.5,
        neighborRisk: result.analysis?.graph_analysis.neighbor_risk_level === 'high' ? 0.8 : 0.3,
      },
    ];

    const fusionResult = {
      textCNNFeatures: result.text_cnn_features || [0.3, 0.7, 0.5, 0.2, 0.8],
      gcnFeatures: result.gcn_features || [0.6, 0.4, 0.7, 0.5, 0.3],
      fusedFeatures: result.fused_features || [0.45, 0.55, 0.6, 0.35, 0.55],
      complianceRisk: result.scores.compliance_score,
      paymentRisk: result.scores.payment_score,
    };

    return { textFeatures, graphFeatures, fusionResult };
  };

  const fusionData = prepareFusionData();

  return (
    <div className="detection-page">
      <div className="detection-container">
        <div className="detection-header">
          <h1 className="detection-title">风险检测</h1>
          <p className="detection-subtitle">基于TextCNN与GCN的多模态风险预测</p>
          {predictorHealth && (
            <p className="detection-subtitle" style={{ marginTop: 8 }}>
              推理服务状态：
              <strong style={{ color: predictorHealth.healthy ? '#10b981' : '#ef4444', marginLeft: 6 }}>
                {predictorHealth.healthy ? '健康' : '异常'}
              </strong>
              {predictorHealth.backend ? ` | backend: ${predictorHealth.backend}` : ''}
              {predictorHealth.is_mock ? ' | mock' : ''}
              {predictorHealth.strict !== undefined ? ` | strict: ${predictorHealth.strict}` : ''}
            </p>
          )}
        </div>

        <div className="detection-form-card">
          <h3 className="detection-form-title">检测表单</h3>
          <form className="detection-form" onSubmit={handleSubmit}>
            <div className="detection-form-group">
              <label htmlFor="enterpriseName" className="detection-form-label">
                企业名称
              </label>
              <input
                id="enterpriseName"
                name="enterpriseName"
                type="text"
                required
                className="detection-form-input"
                placeholder="请输入企业名称"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="detection-form-group">
              <label htmlFor="dataPeriod" className="detection-form-label">
                数据周期
              </label>
              <select
                id="dataPeriod"
                name="dataPeriod"
                required
                className="detection-form-select"
                value={dataPeriod}
                onChange={(e) => setDataPeriod(e.target.value)}
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
            <p className="loading-subtitle">TextCNN提取文本特征 | GCN提取图结构特征 | 多模态融合预测</p>
          </div>
        )}

        {/* 检测结果 */}
        {result && !loading && (
          <>
            <div className="detection-tabs">
              <button
                className={`detection-tab ${activeTab === 'result' ? 'active' : ''}`}
                onClick={() => setActiveTab('result')}
              >
                检测结果
              </button>
              <button
                className={`detection-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                多模态分析
              </button>
            </div>

            {activeTab === 'result' && (
              <div className="detection-result-card">
                <h3 className="detection-result-title">检测结果</h3>
                <div className="detection-result-box">
                  <div className="detection-result-header">
                    <div className="detection-result-icon">
                      <span>📊</span>
                    </div>
                    <div className="detection-result-info">
                      <h4>{companyName}</h4>
                      <p>检测时间: {new Date().toLocaleString()}</p>
                      <p>数据周期: 最近{dataPeriod}个月</p>
                    </div>
                  </div>

                  {/* 风险评分 */}
                  <div className="detection-section">
                    <h5 className="detection-section-title">📈 风险评分</h5>
                    <div className="detection-scores">
                      <div className="detection-score-item">
                        <span className="detection-score-label">合规风险评分:</span>
                        <div className="detection-score-bar">
                          <div
                            className="detection-score-fill"
                            style={{
                              width: `${result.scores.compliance_score * 100}%`,
                              backgroundColor: getRiskColor(result.compliance_risk),
                            }}
                          />
                        </div>
                        <span className="detection-score-value">
                          {(result.scores.compliance_score * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="detection-score-item">
                        <span className="detection-score-label">支付风险评分:</span>
                        <div className="detection-score-bar">
                          <div
                            className="detection-score-fill"
                            style={{
                              width: `${result.scores.payment_score * 100}%`,
                              backgroundColor: getRiskColor(result.payment_risk),
                            }}
                          />
                        </div>
                        <span className="detection-score-value">
                          {(result.scores.payment_score * 100).toFixed(2)}%
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
                          style={{ backgroundColor: getRiskColor(result.compliance_risk) }}
                        >
                          {getRiskLabel(result.compliance_risk)}
                        </span>
                      </div>
                      <div className="detection-risk-item">
                        <span className="detection-risk-label">支付风险:</span>
                        <span
                          className="detection-risk-badge"
                          style={{ backgroundColor: getRiskColor(result.payment_risk) }}
                        >
                          {getRiskLabel(result.payment_risk)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 关键风险因素 */}
                  {result.analysis?.text_analysis.key_risk_factors && (
                    <div className="detection-section">
                      <h5 className="detection-section-title">🔍 关键风险因素</h5>
                      <div className="detection-risk-factors">
                        {result.analysis.text_analysis.key_risk_factors.map((factor, index) => (
                          <span key={index} className="risk-factor-tag">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="detection-result-actions">
                    <button className="detection-btn-secondary">导出报告</button>
                    <button className="detection-btn-primary">查看详情</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && fusionData && (
              <div className="detection-analysis-card">
                <h3 className="detection-result-title">多模态特征融合分析</h3>
                <MultimodalFusion
                  textFeatures={fusionData.textFeatures}
                  graphFeatures={fusionData.graphFeatures}
                  fusionResult={fusionData.fusionResult}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
