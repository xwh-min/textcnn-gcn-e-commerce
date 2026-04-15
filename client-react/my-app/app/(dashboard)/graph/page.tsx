'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import HeterogeneousGraph from '@/components/business/HeterogeneousGraph';
import MultimodalFusion from '@/components/business/MultimodalFusion';
import Link from 'next/link';
import { apiService } from '@/src/services/api';
import '../graph/styles.css';

type GraphNodeType = 'enterprise' | 'logistics' | 'customs';
type GraphRiskLevel = 'high' | 'medium' | 'low';

interface GraphNode {
  id: string;
  name: string;
  type: GraphNodeType;
  riskLevel?: GraphRiskLevel;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'cooperation' | 'compliance' | 'logistics' | 'customs';
  weight?: number;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const relationTypeLabel: Record<string, string> = {
  cooperation: '合作关系',
  compliance: '合规关系',
  logistics: '物流关系',
  customs: '报关关系',
};

export default function GraphPage() {
  const searchParams = useSearchParams();
  const enterpriseId = searchParams?.get('enterprise') || undefined;

  const [activeView, setActiveView] = useState<'graph' | 'fusion'>('graph');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [graphData, setGraphData] = useState<GraphData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGraph = async () => {
      if (!enterpriseId) {
        setGraphData(undefined);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getCompanyGraph(Number(enterpriseId));
        if (response.code !== 200 || !response.data) {
          setError(response.message || '加载图谱数据失败');
          return;
        }

        const raw = response.data as any;
        const nodes: GraphNode[] = (raw.nodes || []).map((n: any) => ({
          id: String(n.id),
          name: n.name || n.label || `节点-${n.id}`,
          type: (n.type || n.node_type || 'enterprise') as GraphNodeType,
          riskLevel: n.risk_level || n.riskLevel,
        }));

        const edges: GraphEdge[] = (raw.edges || raw.relations || []).map((e: any) => {
          const edgeType = (e.type || e.relation_type || 'cooperation') as GraphEdge['type'];
          const weight = typeof e.weight === 'number' ? e.weight : 0;
          return {
            source: String(e.source || e.source_id),
            target: String(e.target || e.target_id),
            type: edgeType,
            weight,
            label: `${relationTypeLabel[edgeType] || '关系'}${weight ? `(${weight})` : ''}`,
          };
        });

        setGraphData({ nodes, edges });
      } catch (err) {
        console.error(err);
        setError('加载图谱数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, [enterpriseId]);

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
            {enterpriseId ? '查看选中企业的关联关系网络' : '跨境电商企业、物流商、海关之间的合作与合规关系可视化'}
          </p>
          {enterpriseId && (
            <div className="graph-enterprise-info">
              <span className="graph-enterprise-badge">🔍 当前查看企业 ID: {enterpriseId}</span>
              <Link href="/graph" className="graph-clear-link">
                查看完整网络
              </Link>
            </div>
          )}
        </div>

        <div className="graph-tabs">
          <button className={`graph-tab ${activeView === 'graph' ? 'active' : ''}`} onClick={() => setActiveView('graph')}>
            关系网络图
          </button>
          <button className={`graph-tab ${activeView === 'fusion' ? 'active' : ''}`} onClick={() => setActiveView('fusion')}>
            多模态特征融合
          </button>
        </div>

        {activeView === 'graph' && (
          <div className="graph-view">
            <div className="graph-main">
              {loading && <div style={{ padding: 24 }}>图谱数据加载中...</div>}
              {error && <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>}
              {!loading && !error && (
                <HeterogeneousGraph
                  width={900}
                  height={650}
                  onNodeClick={setSelectedNode}
                  selectedEnterpriseId={enterpriseId}
                  data={graphData}
                />
              )}
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
                        {selectedNode.type === 'enterprise' ? '跨境电商企业' : selectedNode.type === 'logistics' ? '物流商' : '海关'}
                      </span>
                    </div>
                    {selectedNode.riskLevel && (
                      <div className="detail-row">
                        <span className="detail-label">风险等级:</span>
                        <span className={`detail-value risk-${selectedNode.riskLevel}`}>
                          {selectedNode.riskLevel === 'high' ? '高风险' : selectedNode.riskLevel === 'medium' ? '中风险' : '低风险'}
                        </span>
                      </div>
                    )}
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
              <p>通过TextCNN提取政策新闻、用户投诉文本风险语义，通过GCN提取图结构特征并融合预测。</p>
            </div>
            <MultimodalFusion />
          </div>
        )}
      </div>
    </div>
  );
}
