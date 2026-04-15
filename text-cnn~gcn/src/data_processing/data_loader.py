import torch
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler


class RiskDataset(Dataset):
    def __init__(
        self,
        text_data,
        graph_data,
        compliance_labels,
        payment_labels,
        edge_data=None,
        text_already_encoded=False,
        sample_to_node_id=None,
        source_col='source',
        target_col='target',
    ):
        self.text_data = text_data
        self.graph_data = graph_data
        self.compliance_labels = compliance_labels
        self.payment_labels = payment_labels
        self.edge_data = edge_data
        self.text_already_encoded = text_already_encoded

        self.sample_to_node_id = sample_to_node_id
        self.source_col = source_col
        self.target_col = target_col

        self.num_nodes = len(self.graph_data)

        if self.edge_data is not None:
            self.node_to_idx = self._build_node_mapping()
            self.global_edges = self._build_global_edges()
        else:
            self.node_to_idx = {i: i for i in range(self.num_nodes)}
            self.global_edges = self._build_chain_fallback_edge_pairs(self.num_nodes)

    def _build_node_mapping(self):
        nodes = set()
        for _, row in self.edge_data.iterrows():
            nodes.add(row[self.source_col])
            nodes.add(row[self.target_col])
        return {node: i for i, node in enumerate(sorted(nodes))}

    def _build_global_edges(self):
        edges = []
        for _, row in self.edge_data.iterrows():
            src = row[self.source_col]
            tgt = row[self.target_col]
            if src in self.node_to_idx and tgt in self.node_to_idx:
                s_idx = self.node_to_idx[src]
                t_idx = self.node_to_idx[tgt]
                edges.append((s_idx, t_idx))
                edges.append((t_idx, s_idx))

        if not edges:
            return self._build_chain_fallback_edge_pairs(self.num_nodes)

        return edges

    @staticmethod
    def _build_chain_fallback_edge_pairs(num_nodes):
        if num_nodes <= 1:
            return [(0, 0)]

        edges = []
        for i in range(num_nodes - 1):
            edges.append((i, i + 1))
            edges.append((i + 1, i))
        return edges

    def __len__(self):
        return len(self.text_data)

    def _sample_node_index(self, idx):
        if self.sample_to_node_id is not None:
            node_id = self.sample_to_node_id[idx]
            return self.node_to_idx.get(node_id, idx % self.num_nodes)
        return idx % self.num_nodes

    def _build_local_subgraph(self, center_idx):
        # 以样本中心节点构造1-hop子图，避免全图退化/索引错位
        local_nodes = {center_idx}
        for s, t in self.global_edges:
            if s == center_idx:
                local_nodes.add(t)
            if t == center_idx:
                local_nodes.add(s)

        local_nodes = sorted(local_nodes)

        # 若仍只有一个节点，加入一个邻近节点构造最小双节点图
        if len(local_nodes) == 1 and self.num_nodes > 1:
            neighbor = (center_idx + 1) % self.num_nodes
            local_nodes.append(neighbor)
            local_nodes = sorted(set(local_nodes))

        local_map = {nid: i for i, nid in enumerate(local_nodes)}

        local_edges = []
        for s, t in self.global_edges:
            if s in local_map and t in local_map:
                local_edges.append([local_map[s], local_map[t]])

        if not local_edges:
            local_edges = [[0, 0]]

        edge_index = torch.tensor(local_edges, dtype=torch.long).t().contiguous()
        graph_feat = torch.tensor([self.graph_data[nid] for nid in local_nodes], dtype=torch.float)

        return graph_feat, edge_index

    def __getitem__(self, idx):
        text_item = self.text_data[idx]
        if self.text_already_encoded:
            text_item = torch.tensor(text_item, dtype=torch.long)

        node_idx = self._sample_node_index(idx)
        graph_feat, edge_index = self._build_local_subgraph(node_idx)

        return (
            text_item,
            graph_feat,
            edge_index,
            torch.tensor(self.compliance_labels[idx], dtype=torch.long),
            torch.tensor(self.payment_labels[idx], dtype=torch.long),
        )


def create_data_loaders(train_dataset, val_dataset, test_dataset, batch_size, train_sample_weights=None):
    # 子图大小不固定，使用 batch_size=1 可避免默认collate报错
    # 若后续需要更高吞吐，可改为自定义collate_fn。
    train_sampler = None
    if train_sample_weights is not None:
        train_sampler = WeightedRandomSampler(
            weights=torch.tensor(train_sample_weights, dtype=torch.double),
            num_samples=len(train_sample_weights),
            replacement=True,
        )

    train_loader = DataLoader(
        train_dataset,
        batch_size=1,
        shuffle=(train_sampler is None),
        sampler=train_sampler,
    )
    val_loader = DataLoader(val_dataset, batch_size=1, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)

    return train_loader, val_loader, test_loader
