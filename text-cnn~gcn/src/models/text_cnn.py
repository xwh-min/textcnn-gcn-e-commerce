import torch
import torch.nn as nn
import torch.nn.functional as F

class TextCNN(nn.Module):
    def __init__(self, vocab_size, embedding_dim, kernel_sizes, num_filters, dropout=0.5):
        super(TextCNN, self).__init__()
        
        # 词嵌入层
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        
        # 卷积层
        self.convs = nn.ModuleList([
            nn.Conv2d(1, num_filters, (k, embedding_dim)) for k in kernel_sizes
        ])
        
        #  dropout层
        self.dropout = nn.Dropout(dropout)
        
        # 输出层
        self.fc = nn.Linear(num_filters * len(kernel_sizes), 128)  # 输出128维特征
    
    def forward(self, x):
        # x: [batch_size, seq_len]
        x = self.embedding(x)  # [batch_size, seq_len, embedding_dim]
        x = x.unsqueeze(1)  # [batch_size, 1, seq_len, embedding_dim]
        
        # 卷积 + 池化
        x = [F.relu(conv(x)).squeeze(3) for conv in self.convs]  # [batch_size, num_filters, seq_len - kernel_size + 1]
        x = [F.max_pool1d(conv, conv.size(2)).squeeze(2) for conv in x]  # [batch_size, num_filters]
        
        # 拼接
        x = torch.cat(x, 1)  # [batch_size, num_filters * len(kernel_sizes)]
        
        # dropout
        x = self.dropout(x)
        
        # 输出特征
        x = self.fc(x)  # [batch_size, 128]
        
        return x
