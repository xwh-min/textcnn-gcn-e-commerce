from flask import Flask, request, jsonify
import torch
import os
from ..models.fusion_model import FusionModel
from ..config.config import Config

app = Flask(__name__)
config = Config()

# 加载模型
def load_model():
    # 初始化模型参数
    text_cnn_params = {
        'vocab_size': 5000,
        'embedding_dim': config.embedding_dim,
        'kernel_sizes': config.kernel_sizes,
        'num_filters': config.num_filters
    }
    
    gcn_params = {
        'in_channels': 100,  # 假设节点特征维度为100
        'hidden_dim': config.hidden_dim,
        'num_layers': config.gcn_layers
    }
    
    # 创建模型
    model = FusionModel(text_cnn_params, gcn_params)
    
    # 加载预训练模型
    model_path = os.path.join(config.model_path, 'best_model.pth')
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path))
        model.eval()
    
    return model

model = load_model()

@app.route('/predict', methods=['POST'])
def predict():
    """
    风险预测API
    输入：企业名称 + 近3个月数据
    输出：风险等级
    """
    try:
        # 获取输入数据
        data = request.json
        company_name = data.get('company_name')
        recent_data = data.get('recent_data')  # 近3个月数据
        
        # 数据预处理（这里需要根据实际数据格式进行处理）
        # 示例：将数据转换为模型所需的格式
        text_input = torch.tensor([[1, 2, 3, 4, 5]], dtype=torch.long)  # 示例文本输入
        graph_input = torch.tensor([[0.1, 0.2, 0.3, 0.4, 0.5]], dtype=torch.float)  # 示例图输入
        edge_index = torch.tensor([[0, 1], [1, 0]], dtype=torch.long)  # 示例边索引
        
        # 模型预测
        with torch.no_grad():
            compliance_output, payment_output = model(text_input, graph_input, edge_index)
            
            # 计算风险等级
            compliance_score = torch.softmax(compliance_output, dim=1)[0][1].item()  # 合规风险概率
            payment_score = torch.softmax(payment_output, dim=1)[0][1].item()  # 支付风险概率
            
            # 转换为风险等级
            def get_risk_level(score):
                if score < 0.3:
                    return '低风险'
                elif score < 0.7:
                    return '中风险'
                else:
                    return '高风险'
            
            compliance_level = get_risk_level(compliance_score)
            payment_level = get_risk_level(payment_score)
        
        # 返回结果
        return jsonify({
            'company_name': company_name,
            'compliance_risk': {
                'level': compliance_level,
                'score': round(compliance_score, 4)
            },
            'payment_risk': {
                'level': payment_level,
                'score': round(payment_score, 4)
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host=config.api_host, port=config.api_port, debug=True)
