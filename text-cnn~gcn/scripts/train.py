import torch
import sys
import os
import json
from collections import Counter

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_processing.graph_builder import GraphBuilder
from src.data_processing.data_loader import RiskDataset, create_data_loaders
from src.data_processing.text_processor import TextProcessor
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
    merged_text_path = os.path.join(config.data_path, 'text_data_merged.csv')
    default_text_path = os.path.join(config.data_path, 'text_data.csv')
    text_path = merged_text_path if os.path.exists(merged_text_path) else default_text_path
    text_df = pd.read_csv(text_path)
    print(f"Using text data: {text_path}")
    texts = text_df['text'].tolist()
    
    # 准备训练数据
    print("Preparing training data...")
    # 这里简化处理，实际应该根据数据进行更复杂的处理
    raw_text_data = texts * (len(nodes) // len(texts) + 1)  # 重复文本数据以匹配节点数量
    raw_text_data = raw_text_data[:len(nodes)]  # 截断到节点数量

    # 统一文本处理：固定分词+固定词表+固定padding长度
    text_processor = TextProcessor(
        vocab_size=config.vocab_size,
        max_seq_len=config.max_seq_len,
        min_freq=config.min_token_freq,
    )
    text_processor.build_vocab(raw_text_data)
    text_data = text_processor.encode_texts(raw_text_data)

    # 保存词表，确保训练/推理一致
    vocab_path = os.path.join(config.model_path, 'vocab.json')
    text_processor.save_vocab(vocab_path)
    print(f"Saved vocab to {vocab_path}, size={text_processor.effective_vocab_size}")

    # 导出特征协议，确保训练/导出ONNX/线上推理可对齐
    feature_spec = {
        "schema_version": "v1",
        "text_feature_size": 128,
        "graph_feature_size": 64,
        "total_feature_size": 192,
        "feature_source": "heuristic-v1",
        "text_norm": "clip[0,1], denominator=(utf8_len(recent_data)+1)",
        "graph_norm": "derived stats + clip[0,1]",
        "missing_policy": "empty text/list/graph => zero-safe fallback",
    }
    feature_spec_path = os.path.join(config.model_path, 'feature_spec.json')
    with open(feature_spec_path, 'w', encoding='utf-8') as f:
        json.dump(feature_spec, f, ensure_ascii=False, indent=2)
    print(f"Saved feature spec to {feature_spec_path}")

    graph_data = graph.x.numpy().tolist()  # 节点特征

    # 构建标签（优先使用文本数据中的label字段；缺失时回退示例标签）
    if 'label' in text_df.columns:
        raw_labels = text_df['label'].astype(str).tolist()
        label_map = {
            '合规风险': 0,
            '支付风险': 1,
            '0': 0,
            '1': 1,
        }
        mapped = [label_map.get(v, 1) for v in raw_labels]
        mapped = mapped * (len(nodes) // len(mapped) + 1)
        compliance_labels = mapped[:len(nodes)]
    else:
        compliance_labels = [0 if i % 2 == 0 else 1 for i in range(len(nodes))]

    # 支付风险标签这里保留双任务格式，先与合规标签互补
    payment_labels = [1 - x for x in compliance_labels]
    
    # 加载边数据用于构建图结构
    edge_data = pd.read_csv(config.data_path + 'edges.csv')
    
    # 创建数据集
    dataset = RiskDataset(
        text_data,
        graph_data,
        compliance_labels,
        payment_labels,
        edge_data,
        text_already_encoded=True,
    )
    
    # 分割数据集（这里简化处理，实际应该使用更合理的分割方法）
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    test_dataset = val_dataset  # 简化处理

    # 为训练子集构建 WeightedRandomSampler 权重
    train_indices = train_dataset.indices
    train_comp_labels = [compliance_labels[i] for i in train_indices]
    train_counter = Counter(train_comp_labels)
    train_sample_weights = [1.0 / max(1, train_counter.get(lbl, 1)) for lbl in train_comp_labels]
    print(f"Train subset label counts: {dict(train_counter)}")
    print("WeightedRandomSampler enabled for train loader")
    
    # 创建数据加载器
    train_loader, val_loader, test_loader = create_data_loaders(
        train_dataset,
        val_dataset,
        test_dataset,
        config.batch_size,
        train_sample_weights=train_sample_weights,
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
        'vocab_size': text_processor.effective_vocab_size,  # 使用训练构建后的真实词表大小
        'embedding_dim': config.embedding_dim,
        'kernel_sizes': config.kernel_sizes,
        'num_filters': config.num_filters,
        'dropout': config.dropout
    }
    
    model = FusionModel(
        gcn_params,
        textcnn_params=textcnn_params,
    )

    # 基于训练标签统计类别权重（inverse frequency）
    label_counter = Counter(compliance_labels)
    total = len(compliance_labels)
    n_cls = 2
    compliance_weights = [0.0] * n_cls
    for cls_idx in range(n_cls):
        cnt = label_counter.get(cls_idx, 0)
        compliance_weights[cls_idx] = (total / (n_cls * cnt)) if cnt > 0 else 1.0

    pay_counter = Counter(payment_labels)
    payment_weights = [0.0] * n_cls
    for cls_idx in range(n_cls):
        cnt = pay_counter.get(cls_idx, 0)
        payment_weights[cls_idx] = (total / (n_cls * cnt)) if cnt > 0 else 1.0

    print(f"Compliance label counts: {dict(label_counter)}")
    print(f"Payment label counts: {dict(pay_counter)}")
    print(f"Compliance class weights: {compliance_weights}")
    print(f"Payment class weights: {payment_weights}")
    
    # 创建训练器
    trainer = Trainer(
        model,
        config,
        compliance_class_weights=compliance_weights,
        payment_class_weights=payment_weights,
    )
    
    # 训练模型
    print("Training model...")
    best_val_macro_f1 = trainer.train(train_loader, val_loader, config.epochs)
    print(f"Best validation macro-F1: {best_val_macro_f1:.4f}")
    
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
