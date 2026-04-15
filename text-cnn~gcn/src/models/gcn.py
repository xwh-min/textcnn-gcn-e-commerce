import torch
import torch.nn as nn


class LightGCN(nn.Module):
    """
    更贴近经典 LightGCN 的实现：
    - 不使用特征变换/激活函数
    - 使用归一化邻接传播
    - 跨层embedding做平均
    """

    def __init__(self, in_channels, hidden_dim, num_layers):
        super(LightGCN, self).__init__()
        self.num_layers = num_layers

        # 若输入维度与隐藏维度不同，仅做一次线性对齐
        self.input_proj = None
        if in_channels != hidden_dim:
            self.input_proj = nn.Linear(in_channels, hidden_dim)

        self.output_layer = nn.Linear(hidden_dim, 128)

    @staticmethod
    def _normalize_edge_index(edge_index, num_nodes, device):
        """
        构造 D^{-1/2} A D^{-1/2} 的边权（稀疏边表示）
        """
        row, col = edge_index[0], edge_index[1]

        deg = torch.zeros(num_nodes, device=device)
        one = torch.ones(row.size(0), device=device)
        deg = deg.index_add(0, row, one)

        deg_inv_sqrt = deg.pow(-0.5)
        deg_inv_sqrt[torch.isinf(deg_inv_sqrt)] = 0.0

        edge_weight = deg_inv_sqrt[row] * deg_inv_sqrt[col]
        return edge_weight

    @staticmethod
    def _propagate(x, edge_index, edge_weight):
        row, col = edge_index[0], edge_index[1]
        out = torch.zeros_like(x)
        weighted_messages = x[col] * edge_weight.unsqueeze(-1)
        out.index_add_(0, row, weighted_messages)
        return out

    def forward(self, x, edge_index):
        # x: [num_nodes, in_channels]
        # edge_index: [2, num_edges]
        if x.dim() != 2:
            raise ValueError(f'Expected x shape [num_nodes, feat_dim], got {x.shape}')

        num_nodes = x.size(0)
        device = x.device

        edge_index = edge_index.to(device).long()
        if self.input_proj is not None:
            x = self.input_proj(x)

        embeddings = [x]
        edge_weight = self._normalize_edge_index(edge_index, num_nodes, device)

        h = x
        for _ in range(self.num_layers):
            h = self._propagate(h, edge_index, edge_weight)
            embeddings.append(h)

        final_output = torch.mean(torch.stack(embeddings, dim=0), dim=0)
        final_output = self.output_layer(final_output)

        return final_output
