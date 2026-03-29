import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv

class GCN(nn.Module):
    def __init__(self, in_channels, hidden_dim, num_layers, dropout=0.5):
        super(GCN, self).__init__()
        
        self.layers = nn.ModuleList()
        # 输入层
        self.layers.append(GCNConv(in_channels, hidden_dim))
        # 隐藏层
        for _ in range(num_layers - 2):
            self.layers.append(GCNConv(hidden_dim, hidden_dim))
        # 输出层
        self.layers.append(GCNConv(hidden_dim, 128))  # 输出128维特征
        
        self.dropout = dropout
    
    def forward(self, x, edge_index):
        # x: [num_nodes, in_channels]
        # edge_index: [2, num_edges]
        
        # 确保边索引的大小与节点数量匹配
        # 对于单个节点的情况，使用自环边
        num_nodes = x.size(0)
        if num_nodes == 1:
            # 为单个节点创建自环边
            edge_index = torch.tensor([[0], [0]], dtype=torch.long, device=x.device)
        
        for i, layer in enumerate(self.layers):
            x = layer(x, edge_index)
            if i < len(self.layers) - 1:
                x = F.relu(x)
                x = F.dropout(x, p=self.dropout, training=self.training)
        
        return x
