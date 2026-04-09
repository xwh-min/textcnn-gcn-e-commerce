import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv

class LightGCN(nn.Module):
    def __init__(self, in_channels, hidden_dim, num_layers):
        super(LightGCN, self).__init__()
        
        self.num_layers = num_layers
        self.convs = nn.ModuleList()
        
        # LightGCN只使用简单的图卷积，没有非线性激活和dropout
        for i in range(num_layers):
            if i == 0:
                self.convs.append(GCNConv(in_channels, hidden_dim, add_self_loops=False))
            else:
                self.convs.append(GCNConv(hidden_dim, hidden_dim, add_self_loops=False))
        
        # 输出层
        self.output_layer = nn.Linear(hidden_dim, 128)
    
    def forward(self, x, edge_index):
        # x: [num_nodes, in_channels]
        # edge_index: [2, num_edges]
        
        # 保存各层的输出用于最终融合
        layer_outputs = []
        
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)
            layer_outputs.append(x)
        
        # 对各层输出进行平均融合
        final_output = torch.mean(torch.stack(layer_outputs, dim=0), dim=0)
        
        # 输出层
        final_output = self.output_layer(final_output)
        
        return final_output
