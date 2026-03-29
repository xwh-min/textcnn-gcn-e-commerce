import torch
from torch.utils.data import Dataset, DataLoader

class RiskDataset(Dataset):
    def __init__(self, text_data, graph_data, compliance_labels, payment_labels):
        self.text_data = text_data
        self.graph_data = graph_data
        self.compliance_labels = compliance_labels
        self.payment_labels = payment_labels
    
    def __len__(self):
        return len(self.text_data)
    
    def __getitem__(self, idx):
        # 为每个样本创建一个简单的边索引（自环）
        # 注意：这里我们使用一个固定大小的边索引，确保批处理时能够正确拼接
        edge_index = torch.tensor([[0], [0]], dtype=torch.long)  # 自环边
        
        return (
            self.text_data[idx],  # 直接返回原始文本
            torch.tensor(self.graph_data[idx], dtype=torch.float),
            edge_index,
            torch.tensor(self.compliance_labels[idx], dtype=torch.long),
            torch.tensor(self.payment_labels[idx], dtype=torch.long)
        )

def create_data_loaders(train_dataset, val_dataset, test_dataset, batch_size):
    """
    创建数据加载器
    """
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader, test_loader
