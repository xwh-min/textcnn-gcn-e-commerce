import request from './request';

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RelationParams {
  source_id: string;
  source_type: string;
  target_id: string;
  target_type: string;
  relation_type: string;
  properties?: Record<string, any>;
}

export const graphService = {
  // 获取关系图谱数据
  getGraphData: (params?: { entity_id?: string; entity_type?: string; depth?: number }) => {
    return request.get<GraphData>('/graph', { params });
  },
  // 获取关系列表
  getRelations: (params?: { page?: number; size?: number; source_id?: string; target_id?: string }) => {
    return request.get<{ list: any[]; total: number }>('/graph/relations', { params });
  },
  // 新增关系
  createRelation: (params: RelationParams) => {
    return request.post('/graph/relations', params);
  },
  // 删除关系
  deleteRelation: (id: string) => {
    return request.delete(`/graph/relations/${id}`);
  },
};