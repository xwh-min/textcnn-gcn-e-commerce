import torch
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np

class RiskDataset(Dataset):
    def __init__(self, text_data, graph_data, compliance_labels, payment_labels, edge_data=None):
        self.text_data = text_data
        self.graph_data = graph_data
        self.compliance_labels = compliance_labels
        self.payment_labels = payment_labels
        self.edge_data = edge_data
        
        # 构建节点映射
        if edge_data is not None:
            self.node_to_idx = self._build_node_mapping()
    
    def _build_node_mapping(self):
        """
        构建节点到索引的映射
        """
        nodes = set()
        for _, row in self.edge_data.iterrows():
            nodes.add(row['source'])
            nodes.add(row['target'])
        return {node: i for i, node in enumerate(nodes)}
    
    def __len__(self):
        return len(self.text_data)
    
    def __getitem__(self, idx):
        # 构建图结构
        if self.edge_data is not None:
            # 为当前样本构建边索引
            edge_index = self._build_edge_index(idx)
        else:
            # 如果没有边数据，使用自环边
            edge_index = torch.tensor([[0], [0]], dtype=torch.long)
        
        return (
            self.text_data[idx],  # 直接返回原始文本
            torch.tensor(self.graph_data[idx], dtype=torch.float),
            edge_index,
            torch.tensor(self.compliance_labels[idx], dtype=torch.long),
            torch.tensor(self.payment_labels[idx], dtype=torch.long)
        )
    
    def _build_edge_index(self, idx):
        """
        为当前样本构建边索引
        """
        # 这里简化处理，为每个样本创建基于客户ID的边
        # 实际应用中，可能需要根据具体的样本ID构建对应的边
        edges = []
        
        # 假设每个样本对应一个客户
        # 从文本数据中提取客户ID
        text = self.text_data[idx]
        customer_id = None
        
        # 简单的客户ID提取逻辑
        for token in text.split():
            if token.startswith('customer_'):
                customer_id = token
                break
        
        if customer_id:
            # 查找与该客户相关的边
            for _, row in self.edge_data.iterrows():
                if row['source'] == customer_id:
                    source_idx = self.node_to_idx.get(row['source'], 0)
                    target_idx = self.node_to_idx.get(row['target'], 1)
                    edges.append([source_idx, target_idx])
        
        if not edges:
            # 如果没有找到边，使用自环边
            edges = [[0, 0]]
        
        # 转换为边索引格式 [2, num_edges]
        edge_index = torch.tensor(edges, dtype=torch.long).t()
        return edge_index

def create_data_loaders(train_dataset, val_dataset, test_dataset, batch_size):
    """
    创建数据加载器
    """
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader, test_loader
