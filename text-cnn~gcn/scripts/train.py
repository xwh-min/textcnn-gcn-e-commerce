import torch
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_processing.graph_builder import GraphBuilder
from src.data_processing.data_loader import RiskDataset, create_data_loaders
from src.models.fusion_model import FusionModel
from src.models.trainer import Trainer
from config.config import Config

def main():
    # 加载配置
    config = Config()
    
    # 加载数据
    print("Loading data...")
    graph_builder = GraphBuilder()
    
    # 加载图数据
    nodes, edges = graph_builder.load_data(config.data_path)
    graph = graph_builder.build_heterogeneous_graph(nodes, edges)
    
    # 加载文本数据（直接使用原始文本）
    import pandas as pd
    text_df = pd.read_csv(config.data_path + 'text_data.csv')
    texts = text_df['text'].tolist()
    
    # 准备训练数据
    print("Preparing training data...")
    # 这里简化处理，实际应该根据数据进行更复杂的处理
    text_data = texts * (len(nodes) // len(texts) + 1)  # 重复文本数据以匹配节点数量
    text_data = text_data[:len(nodes)]  # 截断到节点数量
    graph_data = graph.x.numpy().tolist()  # 节点特征
    # 确保标签列表的长度与数据列表的长度一致
    compliance_labels = [0 if i % 2 == 0 else 1 for i in range(len(nodes))]  # 示例标签
    payment_labels = [1 if i % 2 == 0 else 0 for i in range(len(nodes))]  # 示例标签
    
    # 加载边数据用于构建图结构
    edge_data = pd.read_csv(config.data_path + 'edges.csv')
    
    # 创建数据集
    dataset = RiskDataset(text_data, graph_data, compliance_labels, payment_labels, edge_data)
    
    # 分割数据集（这里简化处理，实际应该使用更合理的分割方法）
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    test_dataset = val_dataset  # 简化处理
    
    # 创建数据加载器
    train_loader, val_loader, test_loader = create_data_loaders(
        train_dataset, val_dataset, test_dataset, config.batch_size
    )
    
    # 初始化模型
    print("Initializing model...")
    gcn_params = {
        'in_channels': graph.x.shape[1],  # 节点特征维度
        'hidden_dim': config.hidden_dim,
        'num_layers': config.gcn_layers
    }
    
    # TextCNN参数
    textcnn_params = {
        'vocab_size': 5000,  # 词汇表大小
        'embedding_dim': 128,  # 词嵌入维度
        'kernel_sizes': [3, 4, 5],  # 卷积核大小
        'num_filters': 128,  # 每个卷积核的数量
        'dropout': 0.5
    }
    
    # 文本提取器类型
    text_extractor_type = 'textcnn'  # 可选: 'bert', 'textcnn', 'both'
    
    # 语言类型
    language = 'zh'  # 可选: 'zh', 'en', 'multilang'
    
    # BERT模型路径
    bert_model_path = None  # 使用默认模型
    
    model = FusionModel(
        gcn_params, 
        text_extractor_type=text_extractor_type, 
        bert_model_path=bert_model_path, 
        textcnn_params=textcnn_params,
        language=language
    )
    
    # 创建训练器
    trainer = Trainer(model, config)
    
    # 训练模型
    print("Training model...")
    best_val_acc = trainer.train(train_loader, val_loader, config.epochs)
    print(f"Best validation accuracy: {best_val_acc:.4f}")
    
    # 评估模型
    print("Evaluating model...")
    test_metrics = trainer.evaluate(test_loader)
    print("Test Metrics:")
    print(f"  Compliance Accuracy: {test_metrics['compliance_accuracy']:.4f}")
    print(f"  Payment Accuracy: {test_metrics['payment_accuracy']:.4f}")
    print(f"  Compliance F1: {test_metrics['compliance_f1']:.4f}")
    print(f"  Payment F1: {test_metrics['payment_f1']:.4f}")
    
    # 保存模型
    print("Saving model...")
    trainer.save_model(os.path.join(config.model_path, 'best_model.pth'))
    print("Model training completed!")

if __name__ == '__main__':
    main()
