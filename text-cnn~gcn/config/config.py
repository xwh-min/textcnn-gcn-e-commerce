# 模型配置
class Config:
    # 图神经网络参数
    hidden_dim = 128
    gcn_layers = 2
    dropout = 0.5
    
    # TextCNN参数
    embedding_dim = 100
    kernel_sizes = [3, 4, 5]
    num_filters = 128
    vocab_size = 5000
    max_seq_len = 64
    min_token_freq = 1
    
    # 训练参数
    batch_size = 32
    learning_rate = 0.001
    epochs = 100
    
    # 数据路径
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data/')
    model_path = os.path.join(base_dir, 'models/')
    
    # API配置
    api_host = '0.0.0.0'
    api_port = 5000
