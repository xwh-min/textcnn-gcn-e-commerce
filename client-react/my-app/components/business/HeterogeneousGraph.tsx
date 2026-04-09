'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  type: 'enterprise' | 'logistics' | 'customs';
  riskLevel?: 'high' | 'medium' | 'low';
  x?: number;
  y?: number;
}

interface Edge {
  source: string;
  target: string;
  type: 'cooperation' | 'compliance' | 'logistics' | 'customs';
  weight?: number;
  label?: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface HeterogeneousGraphProps {
  data?: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: Node) => void;
  selectedEnterpriseId?: string;
}

// 根据设计图的节点颜色：
// - 企业：蓝色
// - 物流商：绿色
// - 海关：灰色
// - 高风险：红色
const nodeColors = {
  enterprise: '#3b82f6', // 蓝色
  logistics: '#10b981',  // 绿色
  customs: '#6b7280',    // 灰色
};

const riskColors = {
  high: '#ef4444',       // 红色
  medium: '#f59e0b',     // 橙色
  low: '#10b981',        // 绿色
};

// 默认数据
const defaultData: GraphData = {
  nodes: [
    // 跨境电商企业
    { id: 'e1', name: '跨境通A', type: 'enterprise', riskLevel: 'high' },
    { id: 'e2', name: '跨境通B', type: 'enterprise', riskLevel: 'medium' },
    { id: 'e3', name: '跨境通C', type: 'enterprise', riskLevel: 'low' },
    { id: 'e4', name: '跨境通D', type: 'enterprise' },
    // 物流商
    { id: 'l1', name: '顺丰国际', type: 'logistics' },
    { id: 'l2', name: 'DHL', type: 'logistics' },
    { id: 'l3', name: 'FedEx', type: 'logistics' },
    // 海关
    { id: 'c1', name: '深圳海关', type: 'customs' },
    { id: 'c2', name: '上海海关', type: 'customs' },
    { id: 'c3', name: '广州海关', type: 'customs' },
  ],
  edges: [
    // 企业与物流商的合作关系
    { source: 'e1', target: 'l1', type: 'cooperation', weight: 0.8, label: '物流合作(0.8)' },
    { source: 'e1', target: 'l2', type: 'cooperation', weight: 0.6, label: '物流合作(0.6)' },
    { source: 'e2', target: 'l1', type: 'cooperation', weight: 0.9, label: '物流合作(0.9)' },
    { source: 'e3', target: 'l3', type: 'cooperation', weight: 0.7, label: '物流合作(0.7)' },
    { source: 'e4', target: 'l2', type: 'cooperation', weight: 0.5, label: '物流合作(0.5)' },
    // 企业与海关的合规关系
    { source: 'e1', target: 'c1', type: 'compliance', weight: 0.3, label: '报关关系(0.3)' },
    { source: 'e2', target: 'c2', type: 'compliance', weight: 0.8, label: '报关关系(0.8)' },
    { source: 'e3', target: 'c3', type: 'compliance', weight: 0.9, label: '报关关系(0.9)' },
    { source: 'e4', target: 'c1', type: 'compliance', weight: 0.6, label: '报关关系(0.6)' },
  ],
};

export default function HeterogeneousGraph({
  data = defaultData,
  width = 900,
  height = 650,
  onNodeClick,
  selectedEnterpriseId,
}: HeterogeneousGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = d3.select(containerRef.current);
    svg.selectAll('*').remove();

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform;
        setTransform({ x, y, k });
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 创建主组
    const g = svg.append('g');

    // 如果有选中企业，高亮其关联关系
    let graphData = data;
    if (selectedEnterpriseId) {
      const centerNode = data.nodes.find(n => n.id === selectedEnterpriseId);
      if (centerNode) {
        // 找出所有关联的节点和边
        const relatedEdges = data.edges.filter(e => 
          e.source === selectedEnterpriseId || e.target === selectedEnterpriseId
        );
        const relatedNodeIds = new Set<string>([selectedEnterpriseId]);
        relatedEdges.forEach(e => {
          relatedNodeIds.add(e.source as string);
          relatedNodeIds.add(e.target as string);
        });
        const relatedNodes = data.nodes.filter(n => relatedNodeIds.has(n.id));
        
        graphData = {
          nodes: relatedNodes,
          edges: relatedEdges,
        };
      }
    }

    // 创建力导向模拟
    const simulation = d3
      .forceSimulation(graphData.nodes as any)
      .force(
        'link',
        d3
          .forceLink(graphData.edges as any)
          .id((d: any) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45));

    // 绘制边
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('g')
      .data(graphData.edges)
      .enter()
      .append('g');

    // 边的连线
    link
      .append('line')
      .attr('stroke', (d) => {
        if (d.type === 'cooperation') return '#6366f1';
        if (d.type === 'compliance') return '#f59e0b';
        return '#9ca3af';
      })
      .attr('stroke-width', (d) => (d.weight ? d.weight * 4 + 1 : 2))
      .attr('stroke-opacity', 0.7)
      .attr('stroke-dasharray', (d) => (d.type === 'compliance' ? '6,6' : '0'));

    // 边的标签（展示关系类型 + 权重）
    link
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', '#6b7280')
      .attr('text-anchor', 'middle')
      .text((d) => d.label || '');

    // 绘制节点
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.x = d.x || 0;
            d.y = d.y || 0;
          })
          .on('drag', (event, d) => {
            d.x = event.x;
            d.y = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        onNodeClick?.(d);
      })
      .on('mouseover', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseout', () => {
        setHoveredNode(null);
      });

    // 节点圆形背景
    node
      .append('circle')
      .attr('r', 28)
      .attr('fill', (d) => {
        // 高风险企业显示红色
        if (d.type === 'enterprise' && d.riskLevel === 'high') {
          return riskColors.high;
        }
        return nodeColors[d.type];
      })
      .attr('stroke', (d) => {
        // 中低风险企业用风险颜色描边
        if (d.type === 'enterprise' && d.riskLevel && d.riskLevel !== 'high') {
          return riskColors[d.riskLevel];
        }
        // 选中企业高亮
        if (selectedEnterpriseId === d.id) {
          return '#fbbf24';
        }
        return '#fff';
      })
      .attr('stroke-width', (d) => {
        if (d.type === 'enterprise' && d.riskLevel) return 5;
        if (selectedEnterpriseId === d.id) return 6;
        return 3;
      });

    // 节点图标
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '20px')
      .attr('fill', '#fff')
      .text((d) => {
        if (d.type === 'enterprise') return '🏢';
        if (d.type === 'logistics') return '🚚';
        return '🏛️';
      });

    // 节点标签
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 48)
      .attr('font-size', '12px')
      .attr('fill', '#1f2937')
      .attr('font-weight', '600')
      .text((d) => d.name);

    // 更新位置
    simulation.on('tick', () => {
      link
        .selectAll('line')
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      link
        .selectAll('text')
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick, selectedEnterpriseId]);

  return (
    <div className="heterogeneous-graph" ref={containerRef}>
      {/* 图例 */}
      <div className="graph-legend">
        <div className="legend-section">
          <h4>节点类型</h4>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: nodeColors.enterprise }}></span>
            <span>企业 (蓝色)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: nodeColors.logistics }}></span>
            <span>物流商 (绿色)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: nodeColors.customs }}></span>
            <span>海关 (灰色)</span>
          </div>
        </div>
        <div className="legend-section">
          <h4>风险等级</h4>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: riskColors.high }}></span>
            <span>高风险 (红色)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: riskColors.medium }}></span>
            <span>中风险 (橙色)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: riskColors.low }}></span>
            <span>低风险 (绿色)</span>
          </div>
        </div>
        <div className="legend-section">
          <h4>关系类型</h4>
          <div className="legend-item">
            <span className="legend-line cooperation"></span>
            <span>合作关系</span>
          </div>
          <div className="legend-item">
            <span className="legend-line compliance"></span>
            <span>合规/报关关系</span>
          </div>
        </div>
        <div className="legend-section">
          <h4>操作提示</h4>
          <div className="legend-hint">🖱️ 拖拽节点</div>
          <div className="legend-hint">🔍 滚轮缩放</div>
          <div className="legend-hint">👆 点击查看</div>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px',
          background: '#fafafa'
        }}
      />

      {/* Hover 详情 */}
      {hoveredNode && (
        <div className="node-hover-panel">
          <h4>{hoveredNode.name}</h4>
          <p><strong>类型:</strong> {
            hoveredNode.type === 'enterprise' ? '企业' :
            hoveredNode.type === 'logistics' ? '物流商' : '海关'
          }</p>
          {hoveredNode.riskLevel && (
            <p>
              <strong>风险:</strong>
              <span style={{ 
                color: riskColors[hoveredNode.riskLevel],
                fontWeight: 600
              }}>
                {hoveredNode.riskLevel === 'high' ? '高风险' :
                 hoveredNode.riskLevel === 'medium' ? '中风险' : '低风险'}
              </span>
            </p>
          )}
        </div>
      )}

      {/* 选中节点详情 */}
      {selectedNode && (
        <div className="node-info-panel">
          <h3>节点详情</h3>
          <p><strong>名称:</strong> {selectedNode.name}</p>
          <p><strong>ID:</strong> {selectedNode.id}</p>
          <p><strong>类型:</strong> {
            selectedNode.type === 'enterprise' ? '跨境电商企业' :
            selectedNode.type === 'logistics' ? '物流商' : '海关'
          }</p>
          {selectedNode.riskLevel && (
            <p>
              <strong>风险等级:</strong>
              <span style={{ color: riskColors[selectedNode.riskLevel], fontWeight: 600 }}>
                {selectedNode.riskLevel === 'high' ? '高风险' :
                 selectedNode.riskLevel === 'medium' ? '中风险' : '低风险'}
              </span>
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .heterogeneous-graph {
          position: relative;
          width: 100%;
        }
        .graph-legend {
          position: absolute;
          top: 15px;
          left: 15px;
          background: white;
          padding: 18px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          z-index: 10;
          max-height: calc(100% - 30px);
          overflow-y: auto;
        }
        .legend-section {
          margin-bottom: 18px;
        }
        .legend-section:last-child {
          margin-bottom: 0;
        }
        .legend-section h4 {
          margin: 0 0 10px 0;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #374151;
        }
        .legend-hint {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .legend-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .legend-line {
          width: 24px;
          height: 3px;
          border-radius: 2px;
        }
        .legend-line.cooperation {
          background-color: #6366f1;
        }
        .legend-line.compliance {
          background-color: #f59e0b;
          background-image: repeating-linear-gradient(90deg, #f59e0b, #f59e0b 6px, transparent 6px, transparent 12px);
        }
        .node-hover-panel {
          position: fixed;
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          z-index: 100;
          pointer-events: none;
          max-width: 220px;
        }
        .node-hover-panel h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .node-hover-panel p {
          margin: 4px 0;
          font-size: 12px;
          color: #4b5563;
        }
        .node-info-panel {
          position: absolute;
          top: 15px;
          right: 15px;
          background: white;
          padding: 18px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          z-index: 10;
          min-width: 220px;
        }
        .node-info-panel h3 {
          margin: 0 0 12px 0;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .node-info-panel p {
          margin: 8px 0;
          font-size: 13px;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}
