import torch
import torch.optim as optim
from sklearn.metrics import accuracy_score, f1_score
import os

class Trainer:
    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.optimizer = optim.Adam(model.parameters(), lr=config.learning_rate)
        self.criterion = torch.nn.CrossEntropyLoss()
    
    def train_epoch(self, data_loader):
        self.model.train()
        total_loss = 0
        
        for batch in data_loader:
            text_input, graph_input, edge_index, compliance_labels, payment_labels = batch
            
            # 处理每个样本的边索引
            # 由于每个样本的边索引是独立的，我们需要逐个处理
            batch_loss = 0
            for i in range(len(text_input)):
                # 获取单个样本的输入
                single_text_input = text_input[i]  # 直接使用原始文本
                single_graph_input = graph_input[i].unsqueeze(0)
                single_edge_index = edge_index
                single_compliance_label = compliance_labels[i].unsqueeze(0)
                single_payment_label = payment_labels[i].unsqueeze(0)
                
                # 前向传播
                compliance_output, payment_output = self.model(single_text_input, single_graph_input, single_edge_index)
                
                # 计算损失
                compliance_loss = self.criterion(compliance_output, single_compliance_label)
                payment_loss = self.criterion(payment_output, single_payment_label)
                single_loss = compliance_loss + payment_loss
                
                # 反向传播
                self.optimizer.zero_grad()
                single_loss.backward()
                self.optimizer.step()
                
                batch_loss += single_loss.item()
            
            total_loss += batch_loss
        
        return total_loss / len(data_loader)
    
    def evaluate(self, data_loader):
        self.model.eval()
        compliance_preds = []
        payment_preds = []
        compliance_labels = []
        payment_labels = []
        
        with torch.no_grad():
            for batch in data_loader:
                text_input, graph_input, edge_index, comp_labels, pay_labels = batch
                
                # 处理每个样本的边索引
                for i in range(len(text_input)):
                    # 获取单个样本的输入
                    single_text_input = text_input[i]  # 直接使用原始文本
                    single_graph_input = graph_input[i].unsqueeze(0)
                    single_edge_index = edge_index
                    single_compliance_label = comp_labels[i]
                    single_payment_label = pay_labels[i]
                    
                    # 前向传播
                    compliance_output, payment_output = self.model(single_text_input, single_graph_input, single_edge_index)
                    
                    # 预测
                    compliance_pred = torch.argmax(compliance_output, dim=1).item()
                    payment_pred = torch.argmax(payment_output, dim=1).item()
                    
                    # 收集预测结果和真实标签
                    compliance_preds.append(compliance_pred)
                    payment_preds.append(payment_pred)
                    compliance_labels.append(single_compliance_label.item())
                    payment_labels.append(single_payment_label.item())
        
        # 计算评估指标
        compliance_acc = accuracy_score(compliance_labels, compliance_preds)
        payment_acc = accuracy_score(payment_labels, payment_preds)
        compliance_f1 = f1_score(compliance_labels, compliance_preds, average='macro')
        payment_f1 = f1_score(payment_labels, payment_preds, average='macro')
        
        return {
            'compliance_accuracy': compliance_acc,
            'payment_accuracy': payment_acc,
            'compliance_f1': compliance_f1,
            'payment_f1': payment_f1
        }
    
    def train(self, train_loader, val_loader, epochs=None):
        if epochs is None:
            epochs = self.config.epochs
        
        best_val_acc = 0
        
        for epoch in range(epochs):
            # 训练
            train_loss = self.train_epoch(train_loader)
            
            # 评估
            val_metrics = self.evaluate(val_loader)
            
            # 打印结果
            print(f"Epoch {epoch+1}/{epochs}")
            print(f"Train Loss: {train_loss:.4f}")
            print(f"Validation Metrics:")
            print(f"  Compliance Accuracy: {val_metrics['compliance_accuracy']:.4f}")
            print(f"  Payment Accuracy: {val_metrics['payment_accuracy']:.4f}")
            print(f"  Compliance F1: {val_metrics['compliance_f1']:.4f}")
            print(f"  Payment F1: {val_metrics['payment_f1']:.4f}")
            print()
            
            # 保存最佳模型
            avg_val_acc = (val_metrics['compliance_accuracy'] + val_metrics['payment_accuracy']) / 2
            if avg_val_acc > best_val_acc:
                best_val_acc = avg_val_acc
                self.save_model(f"{self.config.model_path}best_model.pth")
        
        return best_val_acc
    
    def save_model(self, path):
        """
        保存模型
        """
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save(self.model.state_dict(), path)
        print(f"Model saved to {path}")
    
    def load_model(self, path):
        """
        加载模型
        """
        self.model.load_state_dict(torch.load(path))
        print(f"Model loaded from {path}")
