import numpy as np
import pandas as pd
import torch
from torch_geometric.data import Data

class GraphBuilder:
    def __init__(self):
        pass
    
    def build_heterogeneous_graph(self, nodes, edges):
        """
        构建异构图
        nodes: 节点列表，每个节点包含id、类型、特征
        edges: 边列表，每条边包含源节点、目标节点、关系类型
        """
        # 为每个节点分配唯一的索引
        node_id_map = {}
        node_features = []
        node_types = []
        current_id = 0
        
        for node in nodes:
            node_id_map[node['id']] = current_id
            node_features.append(node['features'])
            node_types.append(node['type'])
            current_id += 1
        
        # 构建边
        edge_index = []
        edge_types = []
        
        for edge in edges:
            source = node_id_map[edge['source']]
            target = node_id_map[edge['target']]
            edge_index.append([source, target])
            edge_types.append(edge['type'])
        
        # 转换为PyTorch Geometric格式
        edge_index = torch.tensor(edge_index, dtype=torch.long).t()
        x = torch.tensor(node_features, dtype=torch.float)
        
        # 创建数据对象
        data = Data(x=x, edge_index=edge_index)
        data.node_types = node_types
        data.edge_types = edge_types
        
        return data
    
    def load_data(self, data_path):
        """
        加载数据
        """
        # 这里可以根据实际数据格式进行修改
        # 示例：加载CSV文件
        nodes_df = pd.read_csv(data_path + 'nodes.csv')
        edges_df = pd.read_csv(data_path + 'edges.csv')
        
        # 处理节点数据
        nodes = []
        for _, row in nodes_df.iterrows():
            node = {
                'id': row['id'],
                'type': row['type'],
                'features': eval(row['features'])  # 假设features是字符串形式的列表
            }
            nodes.append(node)
        
        # 处理边数据
        edges = []
        for _, row in edges_df.iterrows():
            edge = {
                'source': row['source'],
                'target': row['target'],
                'type': row['type']
            }
            edges.append(edge)
        
        return nodes, edges
