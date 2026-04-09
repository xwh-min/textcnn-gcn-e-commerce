import torch
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.models.fusion_model import FusionModel
from config.config import Config

def export_model_to_onnx():
    # 加载配置
    config = Config()
    
    # 初始化模型
    gcn_params = {
        'in_channels': 2,  # 节点特征维度
        'hidden_dim': config.hidden_dim,
        'num_layers': config.gcn_layers
    }
    
    # BERT模型路径
    bert_model_path = 'data/bert-base-chinese/bert-base-chinese'
    
    # 创建模型
    model = FusionModel(gcn_params, bert_model_path)
    
    # 加载训练好的权重
    model.load_state_dict(torch.load('models/best_model.pth'))
    model.eval()
    
    # 创建示例输入
    text_input = "跨境电商企业需要遵守海关监管规定"  # 示例文本输入
    graph_input = torch.randn(1, 2)  # 示例图输入
    edge_index = torch.tensor([[0], [0]], dtype=torch.long)  # 示例边索引
    
    # 导出为ONNX格式
    # 使用传统的导出方法，不使用dynamic_axes，因为字符串输入不能设置动态轴
    torch.onnx.export(
        model,
        (text_input, graph_input, edge_index),
        'models/model.onnx',
        input_names=['text_input', 'graph_input', 'edge_index'],
        output_names=['compliance_output', 'payment_output'],
        verbose=True,
        opset_version=13
    )
    
    print("模型已成功导出为ONNX格式: models/model.onnx")

if __name__ == '__main__':
    export_model_to_onnx()
