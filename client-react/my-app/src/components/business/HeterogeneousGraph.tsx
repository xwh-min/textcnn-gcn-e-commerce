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
  type: 'cooperation' | 'compliance';
  weight?: number;
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
}

const defaultData: GraphData = {
  nodes: [
    // 跨境电商企业
    { id: 'e1', name: '跨境通A', type: 'enterprise', riskLevel: 'high' },
    { id: 'e2', name: '跨境通B', type: 'enterprise', riskLevel: 'medium' },
    { id: 'e3', name: '跨境通C', type: 'enterprise', riskLevel: 'low' },
    { id: 'e4', name: '跨境通D', type: 'enterprise', riskLevel: 'medium' },
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
    { source: 'e1', target: 'l1', type: 'cooperation', weight: 0.8 },
    { source: 'e1', target: 'l2', type: 'cooperation', weight: 0.6 },
    { source: 'e2', target: 'l1', type: 'cooperation', weight: 0.9 },
    { source: 'e3', target: 'l3', type: 'cooperation', weight: 0.7 },
    { source: 'e4', target: 'l2', type: 'cooperation', weight: 0.5 },
    // 企业与海关的合规关系
    { source: 'e1', target: 'c1', type: 'compliance', weight: 0.3 },
    { source: 'e2', target: 'c2', type: 'compliance', weight: 0.8 },
    { source: 'e3', target: 'c3', type: 'compliance', weight: 0.9 },
    { source: 'e4', target: 'c1', type: 'compliance', weight: 0.6 },
  ],
};

const nodeColors = {
  enterprise: '#3b82f6',
  logistics: '#10b981',
  customs: '#f59e0b',
};

const riskColors = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export default function HeterogeneousGraph({
  data = defaultData,
  width = 800,
  height = 600,
  onNodeClick,
}: HeterogeneousGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 创建力导向模拟
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        'link',
        d3
          .forceLink(data.edges as any)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // 绘制边
    const link = svg
      .append('g')
      .selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('stroke', (d) => (d.type === 'cooperation' ? '#6366f1' : '#f59e0b'))
      .attr('stroke-width', (d) => (d.weight ? d.weight * 3 : 2))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', (d) => (d.type === 'compliance' ? '5,5' : '0'));

    // 绘制节点
    const node = svg
      .append('g')
      .selectAll('g')
      .data(data.nodes)
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
        setSelectedNode(d);
        onNodeClick?.(d);
      });

    // 节点圆形
    node
      .append('circle')
      .attr('r', 25)
      .attr('fill', (d) => nodeColors[d.type])
      .attr('stroke', (d) => {
        if (d.type === 'enterprise' && d.riskLevel) {
          return riskColors[d.riskLevel];
        }
        return '#fff';
      })
      .attr('stroke-width', (d) => (d.type === 'enterprise' ? 4 : 2));

    // 节点图标
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '16px')
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
      .attr('dy', 40)
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .attr('font-weight', '500')
      .text((d) => d.name);

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick]);

  return (
    <div className="heterogeneous-graph">
      <div className="graph-legend">
        <div className="legend-section">
          <h4>节点类型</h4>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: nodeColors.enterprise }}></span>
            <span>跨境电商企业</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: nodeColors.logistics }}></span>
            <span>物流商</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: nodeColors.customs }}></span>
            <span>海关</span>
          </div>
        </div>
        <div className="legend-section">
          <h4>风险等级</h4>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: riskColors.high }}></span>
            <span>高风险</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: riskColors.medium }}></span>
            <span>中风险</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: riskColors.low }}></span>
            <span>低风险</span>
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
            <span>合规关系</span>
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
      />

      {selectedNode && (
        <div className="node-info-panel">
          <h3>节点信息</h3>
          <p><strong>名称:</strong> {selectedNode.name}</p>
          <p><strong>类型:</strong> {selectedNode.type === 'enterprise' ? '跨境电商企业' : selectedNode.type === 'logistics' ? '物流商' : '海关'}</p>
          {selectedNode.riskLevel && (
            <p>
              <strong>风险等级:</strong>
              <span style={{ color: riskColors[selectedNode.riskLevel] }}>
                {selectedNode.riskLevel === 'high' ? '高风险' : selectedNode.riskLevel === 'medium' ? '中风险' : '低风险'}
              </span>
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .heterogeneous-graph {
          position: relative;
        }
        .graph-legend {
          position: absolute;
          top: 10px;
          left: 10px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }
        .legend-section {
          margin-bottom: 15px;
        }
        .legend-section h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 12px;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .legend-line {
          width: 20px;
          height: 2px;
        }
        .legend-line.cooperation {
          background-color: #6366f1;
        }
        .legend-line.compliance {
          background-color: #f59e0b;
          background-image: repeating-linear-gradient(90deg, #f59e0b, #f59e0b 5px, transparent 5px, transparent 10px);
        }
        .node-info-panel {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 10;
          min-width: 200px;
        }
        .node-info-panel h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #111827;
        }
        .node-info-panel p {
          margin: 5px 0;
          font-size: 13px;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
}
