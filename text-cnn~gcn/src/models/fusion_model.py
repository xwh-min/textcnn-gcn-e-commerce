import torch
import torch.nn as nn
import torch.nn.functional as F
from .gcn import LightGCN
from .text_cnn import TextCNN


class FusionModel(nn.Module):
    def __init__(self, gcn_params, textcnn_params=None):
        super(FusionModel, self).__init__()

        assert textcnn_params is not None, "TextCNN params must be provided"
        self.text_extractor = TextCNN(**textcnn_params)
        self.text_feature_dim = 128
        
        # LightGCN模型
        self.gcn = LightGCN(**gcn_params)
        self.graph_feature_dim = 128
        
        # 融合层 - 高效门控融合机制
        self.fusion_gate = nn.Linear(self.text_feature_dim + self.graph_feature_dim, self.text_feature_dim + self.graph_feature_dim)
        self.fusion = nn.Linear(self.text_feature_dim + self.graph_feature_dim, 256)
        
        # 分类层 - 两个二分类任务
        self.compliance_classifier = nn.Linear(256, 2)  # 合规风险
        self.payment_classifier = nn.Linear(256, 2)  # 支付风险
    
    def forward(self, text_input, graph_input, edge_index):
        # 提取文本特征（TextCNN）
        text_features = self.text_extractor(text_input)
        
        # 提取图结构特征
        graph_features = self.gcn(graph_input, edge_index)
        
        # 融合特征 - 门控机制
        combined = torch.cat([text_features, graph_features], dim=1)
        gate = torch.sigmoid(self.fusion_gate(combined))
        gated_combined = gate * combined
        fused_features = F.relu(self.fusion(gated_combined))
        
        # 分类预测
        compliance_output = self.compliance_classifier(fused_features)
        payment_output = self.payment_classifier(fused_features)
        
        return compliance_output, payment_output
