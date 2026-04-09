'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import HeterogeneousGraph from '@/components/business/HeterogeneousGraph';
import MultimodalFusion from '@/components/business/MultimodalFusion';
import Link from 'next/link';
import '../graph/styles.css';

export default function GraphPage() {
  const searchParams = useSearchParams();
  const enterpriseId = searchParams?.get('enterprise') || undefined;
  
  const [activeView, setActiveView] = useState<'graph' | 'fusion'>('graph');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  return (
    <div className="graph-page">
      <div className="graph-container">
        <div className="graph-header">
          <div className="graph-header-top">
            <Link href="/enterprises" className="graph-back-link">
              ← 返回企业列表
            </Link>
          </div>
          <h1 className="graph-title">异构图网络分析</h1>
          <p className="graph-subtitle">
            {enterpriseId 
              ? '查看选中企业的关联关系网络' 
              : '跨境电商企业、物流商、海关之间的合作与合规关系可视化'}
          </p>
          {enterpriseId && (
            <div className="graph-enterprise-info">
              <span className="graph-enterprise-badge">
                🔍 当前查看企业 ID: {enterpriseId}
              </span>
              <Link href="/graph" className="graph-clear-link">
                查看完整网络
              </Link>
            </div>
          )}
        </div>

        <div className="graph-tabs">
          <button
            className={`graph-tab ${activeView === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveView('graph')}
          >
            关系网络图
          </button>
          <button
            className={`graph-tab ${activeView === 'fusion' ? 'active' : ''}`}
            onClick={() => setActiveView('fusion')}
          >
            多模态特征融合
          </button>
        </div>

        {activeView === 'graph' && (
          <div className="graph-view">
            <div className="graph-main">
              <HeterogeneousGraph
                width={900}
                height={650}
                onNodeClick={setSelectedNode}
                selectedEnterpriseId={enterpriseId}
              />
            </div>

            {selectedNode && (
              <div className="graph-sidebar">
                <div className="node-detail-card">
                  <h3>节点详情</h3>
                  <div className="node-detail-content">
                    <div className="detail-row">
                      <span className="detail-label">节点ID:</span>
                      <span className="detail-value">{selectedNode.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">节点名称:</span>
                      <span className="detail-value">{selectedNode.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">节点类型:</span>
                      <span className="detail-value">
                        {selectedNode.type === 'enterprise'
                          ? '跨境电商企业'
                          : selectedNode.type === 'logistics'
                          ? '物流商'
                          : '海关'}
                      </span>
                    </div>
                    {selectedNode.riskLevel && (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">风险等级:</span>
                          <span
                            className={`detail-value risk-${selectedNode.riskLevel}`}
                          >
                            {selectedNode.riskLevel === 'high'
                              ? '高风险'
                              : selectedNode.riskLevel === 'medium'
                              ? '中风险'
                              : '低风险'}
                          </span>
                        </div>
                        <div className="detail-actions">
                          <button className="btn-primary">查看风险详情</button>
                          <button className="btn-secondary">生成风险报告</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="graph-stats-card">
                  <h3>网络统计</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-value">4</span>
                      <span className="stat-label">企业节点</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">3</span>
                      <span className="stat-label">物流节点</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">3</span>
                      <span className="stat-label">海关节点</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">9</span>
                      <span className="stat-label">关系边</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'fusion' && (
          <div className="fusion-view">
            <div className="fusion-description">
              <h3>多模态特征融合分析</h3>
              <p>
                通过TextCNN提取政策新闻、用户投诉文本的风险语义，
                通过GCN提取图结构特征，通过拼接层融合实现风险预测。
              </p>
            </div>
            <MultimodalFusion />
          </div>
        )}
      </div>
    </div>
  );
}
