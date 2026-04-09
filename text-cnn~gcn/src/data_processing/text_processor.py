import jieba
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder

class TextProcessor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=5000)
        self.label_encoder = LabelEncoder()
    
    def tokenize(self, text):
        """
        中文分词
        """
        return ' '.join(jieba.cut(text))
    
    def process_texts(self, texts):
        """
        处理文本数据，进行分词和向量化
        """
        # 分词
        tokenized_texts = [self.tokenize(text) for text in texts]
        
        # 向量化
        X = self.vectorizer.fit_transform(tokenized_texts).toarray()
        
        return X
    
    def process_labels(self, labels):
        """
        处理标签数据
        """
        y = self.label_encoder.fit_transform(labels)
        return y
    
    def load_text_data(self, data_path):
        """
        加载文本数据
        """
        import pandas as pd
        df = pd.read_csv(data_path + 'text_data.csv')
        texts = df['text'].tolist()
        labels = df['label'].tolist()
        
        return texts, labels
