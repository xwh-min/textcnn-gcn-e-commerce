'use client';

import { useState } from 'react';

interface TextFeature {
  type: 'policy' | 'complaint';
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  riskScore: number;
}

interface GraphFeature {
  nodeId: string;
  nodeType: string;
  centrality: number;
  neighborRisk: number;
}

interface FusionResult {
  textCNNFeatures: number[];
  gcnFeatures: number[];
  fusedFeatures: number[];
  complianceRisk: number;
  paymentRisk: number;
}

interface MultimodalFusionProps {
  textFeatures?: TextFeature[];
  graphFeatures?: GraphFeature[];
  fusionResult?: FusionResult;
}

const defaultTextFeatures: TextFeature[] = [
  {
    type: 'policy',
    content: '最新跨境电商政策调整，加强海关监管力度',
    sentiment: 'neutral',
    riskScore: 0.3,
  },
  {
    type: 'complaint',
    content: '用户投诉：物流延迟，商品质量问题',
    sentiment: 'negative',
    riskScore: 0.7,
  },
  {
    type: 'policy',
    content: '税收优惠政策延续，支持跨境电商发展',
    sentiment: 'positive',
    riskScore: 0.1,
  },
];

const defaultGraphFeatures: GraphFeature[] = [
  { nodeId: 'e1', nodeType: 'enterprise', centrality: 0.8, neighborRisk: 0.6 },
  { nodeId: 'l1', nodeType: 'logistics', centrality: 0.6, neighborRisk: 0.4 },
  { nodeId: 'c1', nodeType: 'customs', centrality: 0.9, neighborRisk: 0.3 },
];

const defaultFusionResult: FusionResult = {
  textCNNFeatures: [0.3, 0.7, 0.5, 0.2, 0.8],
  gcnFeatures: [0.6, 0.4, 0.7, 0.5, 0.3],
  fusedFeatures: [0.45, 0.55, 0.6, 0.35, 0.55],
  complianceRisk: 0.65,
  paymentRisk: 0.45,
};

export default function MultimodalFusion({
  textFeatures = defaultTextFeatures,
  graphFeatures = defaultGraphFeatures,
  fusionResult = defaultFusionResult,
}: MultimodalFusionProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'graph' | 'fusion'>('text');

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '正面';
      case 'negative':
        return '负面';
      default:
        return '中性';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return '#ef4444';
    if (score >= 0.4) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="multimodal-fusion">
      <div className="fusion-tabs">
        <button
          className={`fusion-tab ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          TextCNN文本特征
        </button>
        <button
          className={`fusion-tab ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          GCN图结构特征
        </button>
        <button
          className={`fusion-tab ${activeTab === 'fusion' ? 'active' : ''}`}
          onClick={() => setActiveTab('fusion')}
        >
          特征融合结果
        </button>
      </div>

      <div className="fusion-content">
        {activeTab === 'text' && (
          <div className="text-features">
            <h3>TextCNN提取的文本风险语义</h3>
            <div className="text-features-list">
              {textFeatures.map((feature, index) => (
                <div key={index} className="text-feature-card">
                  <div className="text-feature-header">
                    <span
                      className="text-feature-type"
                      style={{
                        backgroundColor:
                          feature.type === 'policy' ? '#3b82f6' : '#f59e0b',
                      }}
                    >
                      {feature.type === 'policy' ? '政策新闻' : '用户投诉'}
                    </span>
                    <span
                      className="text-feature-sentiment"
                      style={{ color: getSentimentColor(feature.sentiment) }}
                    >
                      {getSentimentLabel(feature.sentiment)}
                    </span>
                  </div>
                  <p className="text-feature-content">{feature.content}</p>
                  <div className="text-feature-risk">
                    <span>风险评分:</span>
                    <div className="risk-bar">
                      <div
                        className="risk-bar-fill"
                        style={{
                          width: `${feature.riskScore * 100}%`,
                          backgroundColor: getRiskColor(feature.riskScore),
                        }}
                      />
                    </div>
                    <span>{(feature.riskScore * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="graph-features">
            <h3>GCN提取的图结构特征</h3>
            <div className="graph-features-list">
              {graphFeatures.map((feature, index) => (
                <div key={index} className="graph-feature-card">
                  <div className="graph-feature-header">
                    <span className="graph-feature-id">{feature.nodeId}</span>
                    <span
                      className="graph-feature-type"
                      style={{
                        backgroundColor:
                          feature.nodeType === 'enterprise'
                            ? '#3b82f6'
                            : feature.nodeType === 'logistics'
                            ? '#10b981'
                            : '#f59e0b',
                      }}
                    >
                      {feature.nodeType === 'enterprise'
                        ? '企业'
                        : feature.nodeType === 'logistics'
                        ? '物流'
                        : '海关'}
                    </span>
                  </div>
                  <div className="graph-feature-metrics">
                    <div className="metric">
                      <span className="metric-label">中心性:</span>
                      <div className="metric-bar">
                        <div
                          className="metric-bar-fill"
                          style={{ width: `${feature.centrality * 100}%` }}
                        />
                      </div>
                      <span className="metric-value">
                        {(feature.centrality * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">邻域风险:</span>
                      <div className="metric-bar">
                        <div
                          className="metric-bar-fill"
                          style={{
                            width: `${feature.neighborRisk * 100}%`,
                            backgroundColor: getRiskColor(feature.neighborRisk),
                          }}
                        />
                      </div>
                      <span className="metric-value">
                        {(feature.neighborRisk * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fusion' && (
          <div className="fusion-result">
            <h3>多模态特征融合结果</h3>
            <div className="fusion-visualization">
              <div className="feature-vectors">
                <div className="vector-section">
                  <h4>TextCNN特征向量</h4>
                  <div className="vector-bars">
                    {fusionResult.textCNNFeatures.map((value, index) => (
                      <div key={index} className="vector-bar-item">
                        <span className="vector-label">T{index + 1}</span>
                        <div className="vector-bar">
                          <div
                            className="vector-bar-fill textcnn"
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                        <span className="vector-value">
                          {value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fusion-operator">+</div>

                <div className="vector-section">
                  <h4>GCN特征向量</h4>
                  <div className="vector-bars">
                    {fusionResult.gcnFeatures.map((value, index) => (
                      <div key={index} className="vector-bar-item">
                        <span className="vector-label">G{index + 1}</span>
                        <div className="vector-bar">
                          <div
                            className="vector-bar-fill gcn"
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                        <span className="vector-value">
                          {value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fusion-operator">=</div>

                <div className="vector-section">
                  <h4>融合特征向量</h4>
                  <div className="vector-bars">
                    {fusionResult.fusedFeatures.map((value, index) => (
                      <div key={index} className="vector-bar-item">
                        <span className="vector-label">F{index + 1}</span>
                        <div className="vector-bar">
                          <div
                            className="vector-bar-fill fused"
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                        <span className="vector-value">
                          {value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="risk-prediction">
                <h4>风险预测结果</h4>
                <div className="risk-cards">
                  <div className="risk-card">
                    <h5>合规风险</h5>
                    <div
                      className="risk-score"
                      style={{
                        color: getRiskColor(fusionResult.complianceRisk),
                      }}
                    >
                      {(fusionResult.complianceRisk * 100).toFixed(1)}%
                    </div>
                    <div className="risk-level">
                      {fusionResult.complianceRisk >= 0.7
                        ? '高风险'
                        : fusionResult.complianceRisk >= 0.4
                        ? '中风险'
                        : '低风险'}
                    </div>
                  </div>
                  <div className="risk-card">
                    <h5>支付风险</h5>
                    <div
                      className="risk-score"
                      style={{
                        color: getRiskColor(fusionResult.paymentRisk),
                      }}
                    >
                      {(fusionResult.paymentRisk * 100).toFixed(1)}%
                    </div>
                    <div className="risk-level">
                      {fusionResult.paymentRisk >= 0.7
                        ? '高风险'
                        : fusionResult.paymentRisk >= 0.4
                        ? '中风险'
                        : '低风险'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .multimodal-fusion {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .fusion-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }
        .fusion-tab {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }
        .fusion-tab:hover {
          background: #f9fafb;
        }
        .fusion-tab.active {
          color: #3b82f6;
          border-bottom: 2px solid #3b82f6;
        }
        .fusion-content {
          padding: 20px;
        }
        .text-features h3,
        .graph-features h3,
        .fusion-result h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #111827;
        }
        .text-features-list,
        .graph-features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .text-feature-card,
        .graph-feature-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
        }
        .text-feature-header,
        .graph-feature-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .text-feature-type,
        .graph-feature-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: white;
          font-weight: 500;
        }
        .text-feature-sentiment {
          font-size: 12px;
          font-weight: 500;
        }
        .text-feature-content {
          margin: 8px 0;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }
        .text-feature-risk {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .risk-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .risk-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .graph-feature-metrics {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .metric {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .metric-label {
          width: 60px;
          color: #6b7280;
        }
        .metric-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .metric-bar-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .metric-value {
          width: 50px;
          text-align: right;
          color: #374151;
          font-weight: 500;
        }
        .fusion-visualization {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .feature-vectors {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .vector-section {
          flex: 1;
          min-width: 200px;
        }
        .vector-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #374151;
        }
        .vector-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .vector-bar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .vector-label {
          width: 30px;
          color: #6b7280;
        }
        .vector-bar {
          flex: 1;
          height: 20px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .vector-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .vector-bar-fill.textcnn {
          background: #3b82f6;
        }
        .vector-bar-fill.gcn {
          background: #10b981;
        }
        .vector-bar-fill.fused {
          background: linear-gradient(90deg, #3b82f6, #10b981);
        }
        .vector-value {
          width: 40px;
          text-align: right;
          color: #374151;
          font-weight: 500;
        }
        .fusion-operator {
          font-size: 24px;
          font-weight: bold;
          color: #6b7280;
        }
        .risk-prediction {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        .risk-prediction h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #374151;
        }
        .risk-cards {
          display: flex;
          gap: 16px;
        }
        .risk-card {
          flex: 1;
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .risk-card h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #6b7280;
        }
        .risk-score {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .risk-level {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
