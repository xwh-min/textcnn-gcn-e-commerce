import torch
import torch.nn as nn
import torch.nn.functional as F
from .gcn import GCN
from .bert_text_extractor import BertTextExtractor

class FusionModel(nn.Module):
    def __init__(self, gcn_params, bert_model_path):
        super(FusionModel, self).__init__()
        
        # BERT文本特征提取器
        self.bert_extractor = BertTextExtractor(bert_model_path)
        
        # GCN模型
        self.gcn = GCN(**gcn_params)
        
        # 融合层
        self.fusion = nn.Linear(768 + 128, 256)  # 768是BERT的输出维度，128是GCN的输出维度
        
        # 分类层 - 两个二分类任务
        self.compliance_classifier = nn.Linear(256, 2)  # 合规风险
        self.payment_classifier = nn.Linear(256, 2)  # 支付风险
    
    def forward(self, text_input, graph_input, edge_index):
        # 提取文本特征
        text_features = self.bert_extractor.extract_features(text_input)
        text_features = text_features.unsqueeze(0)  # 添加批次维度
        
        # 提取图结构特征
        graph_features = self.gcn(graph_input, edge_index)
        
        # 融合特征
        fused_features = torch.cat([text_features, graph_features], dim=1)
        fused_features = F.relu(self.fusion(fused_features))
        
        # 分类预测
        compliance_output = self.compliance_classifier(fused_features)
        payment_output = self.payment_classifier(fused_features)
        
        return compliance_output, payment_output
