from transformers import BertTokenizer, BertModel
import torch

class BertTextExtractor:
    def __init__(self, model_path):
        self.tokenizer = BertTokenizer.from_pretrained(model_path)
        self.model = BertModel.from_pretrained(model_path)
        self.model.eval()
    
    def extract_features(self, text):
        inputs = self.tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=128)
        with torch.no_grad():
            outputs = self.model(**inputs)
        # 使用[CLS] token的输出作为文本特征
        return outputs.last_hidden_state[:, 0, :].squeeze()
