import os
import torch
import torch.optim as optim
from sklearn.metrics import accuracy_score, f1_score

from src.data_processing.text_processor import TextProcessor


class Trainer:
    def __init__(self, model, config, compliance_class_weights=None, payment_class_weights=None):
        self.model = model
        self.config = config
        self.optimizer = optim.Adam(model.parameters(), lr=config.learning_rate)

        self.compliance_criterion = torch.nn.CrossEntropyLoss(
            weight=self._to_weight_tensor(compliance_class_weights)
        )
        self.payment_criterion = torch.nn.CrossEntropyLoss(
            weight=self._to_weight_tensor(payment_class_weights)
        )

        self.text_processor = TextProcessor(
            vocab_size=getattr(config, 'vocab_size', 5000),
            max_seq_len=getattr(config, 'max_seq_len', 64),
            min_freq=getattr(config, 'min_token_freq', 1),
        )

        vocab_path = os.path.join(config.model_path, 'vocab.json')
        if os.path.exists(vocab_path):
            self.text_processor.load_vocab(vocab_path)

    @staticmethod
    def _to_weight_tensor(weights):
        if weights is None:
            return None
        if isinstance(weights, torch.Tensor):
            return weights.float()
        return torch.tensor(weights, dtype=torch.float)

    def _prepare_text_input(self, text_input):
        """
        统一文本输入：
        - 若已是 [B, L] 的LongTensor，直接使用
        - 若是字符串列表，使用固定词表编码
        """
        if isinstance(text_input, torch.Tensor):
            return text_input.long()

        if isinstance(text_input, (list, tuple)) and len(text_input) > 0 and isinstance(text_input[0], str):
            encoded = self.text_processor.encode_texts(text_input)
            return torch.tensor(encoded, dtype=torch.long)

        raise ValueError('Unsupported text_input format. Expect LongTensor or list[str].')

    def _prepare_edge_index(self, edge_index):
        if isinstance(edge_index, torch.Tensor):
            return edge_index.long()

        if isinstance(edge_index, (list, tuple)) and len(edge_index) > 0 and isinstance(edge_index[0], torch.Tensor):
            # DataLoader默认collate下可能得到list[tensor]
            # 这里优先取第一个（通常数据集返回的是固定图结构）
            return edge_index[0].long()

        raise ValueError('Unsupported edge_index format.')

    def train_epoch(self, data_loader):
        self.model.train()
        total_loss = 0.0

        for batch in data_loader:
            text_input, graph_input, edge_index, compliance_labels, payment_labels = batch

            text_input = self._prepare_text_input(text_input)
            graph_input = graph_input.float()
            edge_index = self._prepare_edge_index(edge_index)
            compliance_labels = compliance_labels.long()
            payment_labels = payment_labels.long()

            self.optimizer.zero_grad()
            compliance_output, payment_output = self.model(text_input, graph_input, edge_index)

            compliance_loss = self.compliance_criterion(compliance_output, compliance_labels)
            payment_loss = self.payment_criterion(payment_output, payment_labels)
            loss = compliance_loss + payment_loss

            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()

        return total_loss / max(1, len(data_loader))

    def evaluate(self, data_loader):
        self.model.eval()
        compliance_preds = []
        payment_preds = []
        compliance_labels_all = []
        payment_labels_all = []

        with torch.no_grad():
            for batch in data_loader:
                text_input, graph_input, edge_index, compliance_labels, payment_labels = batch

                text_input = self._prepare_text_input(text_input)
                graph_input = graph_input.float()
                edge_index = self._prepare_edge_index(edge_index)
                compliance_labels = compliance_labels.long()
                payment_labels = payment_labels.long()

                compliance_output, payment_output = self.model(text_input, graph_input, edge_index)

                compliance_pred = torch.argmax(compliance_output, dim=1)
                payment_pred = torch.argmax(payment_output, dim=1)

                compliance_preds.extend(compliance_pred.cpu().tolist())
                payment_preds.extend(payment_pred.cpu().tolist())
                compliance_labels_all.extend(compliance_labels.cpu().tolist())
                payment_labels_all.extend(payment_labels.cpu().tolist())

        compliance_acc = accuracy_score(compliance_labels_all, compliance_preds)
        payment_acc = accuracy_score(payment_labels_all, payment_preds)
        compliance_f1 = f1_score(compliance_labels_all, compliance_preds, average='macro')
        payment_f1 = f1_score(payment_labels_all, payment_preds, average='macro')

        return {
            'compliance_accuracy': compliance_acc,
            'payment_accuracy': payment_acc,
            'compliance_f1': compliance_f1,
            'payment_f1': payment_f1,
        }

    def train(self, train_loader, val_loader, epochs=None):
        if epochs is None:
            epochs = self.config.epochs

        best_val_macro_f1 = -1.0
        best_epoch = -1

        for epoch in range(epochs):
            train_loss = self.train_epoch(train_loader)
            val_metrics = self.evaluate(val_loader)

            print(f"Epoch {epoch + 1}/{epochs}")
            print(f"Train Loss: {train_loss:.4f}")
            print('Validation Metrics:')
            print(f"  Compliance Accuracy: {val_metrics['compliance_accuracy']:.4f}")
            print(f"  Payment Accuracy: {val_metrics['payment_accuracy']:.4f}")
            print(f"  Compliance F1: {val_metrics['compliance_f1']:.4f}")
            print(f"  Payment F1: {val_metrics['payment_f1']:.4f}")
            print()

            avg_val_macro_f1 = (val_metrics['compliance_f1'] + val_metrics['payment_f1']) / 2
            if avg_val_macro_f1 > best_val_macro_f1:
                best_val_macro_f1 = avg_val_macro_f1
                best_epoch = epoch + 1
                self.save_model(f"{self.config.model_path}best_model.pth")

        print(f"Best epoch by macro-F1: {best_epoch}, score={best_val_macro_f1:.4f}")
        return best_val_macro_f1

    def save_model(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save(self.model.state_dict(), path)
        print(f"Model saved to {path}")

    def load_model(self, path):
        self.model.load_state_dict(torch.load(path))
        print(f"Model loaded from {path}")
