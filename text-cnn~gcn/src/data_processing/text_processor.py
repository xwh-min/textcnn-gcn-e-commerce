import json
import os
from collections import Counter

import jieba
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder


class TextProcessor:
    """
    统一文本处理器：
    1) 支持传统TF-IDF流程（兼容已有逻辑）
    2) 支持TextCNN使用的固定词表编码（训练/推理一致）
    """

    def __init__(self, vocab_size=5000, max_seq_len=64, min_freq=1):
        self.vectorizer = TfidfVectorizer(max_features=vocab_size)
        self.label_encoder = LabelEncoder()

        self.vocab_size = vocab_size
        self.max_seq_len = max_seq_len
        self.min_freq = min_freq

        self.pad_token = "<PAD>"
        self.unk_token = "<UNK>"
        self.pad_idx = 0
        self.unk_idx = 1

        # 固定词表：token -> id
        self.word_to_idx = {
            self.pad_token: self.pad_idx,
            self.unk_token: self.unk_idx,
        }

    def tokenize(self, text):
        """中文分词，返回token列表"""
        if text is None:
            return []
        text = str(text).strip()
        if not text:
            return []
        return [tok.strip() for tok in jieba.cut(text) if tok.strip()]

    def process_texts(self, texts):
        """
        传统TF-IDF处理（兼容旧代码）
        """
        tokenized_texts = [' '.join(self.tokenize(text)) for text in texts]
        X = self.vectorizer.fit_transform(tokenized_texts).toarray()
        return X

    def process_labels(self, labels):
        y = self.label_encoder.fit_transform(labels)
        return y

    def load_text_data(self, data_path):
        import pandas as pd
        df = pd.read_csv(data_path + 'text_data.csv')
        texts = df['text'].tolist()
        labels = df['label'].tolist()
        return texts, labels

    # ------------------------
    # TextCNN统一词表编码流程
    # ------------------------
    def build_vocab(self, texts):
        counter = Counter()
        for text in texts:
            counter.update(self.tokenize(text))

        valid_tokens = [
            tok for tok, freq in counter.items() if freq >= self.min_freq and tok not in {self.pad_token, self.unk_token}
        ]
        valid_tokens = sorted(valid_tokens, key=lambda t: (-counter[t], t))

        max_tokens = max(0, self.vocab_size - 2)
        valid_tokens = valid_tokens[:max_tokens]

        self.word_to_idx = {
            self.pad_token: self.pad_idx,
            self.unk_token: self.unk_idx,
        }

        for idx, tok in enumerate(valid_tokens, start=2):
            self.word_to_idx[tok] = idx

        return self.word_to_idx

    def encode_text(self, text):
        tokens = self.tokenize(text)
        ids = [self.word_to_idx.get(tok, self.unk_idx) for tok in tokens]

        if len(ids) < self.max_seq_len:
            ids = ids + [self.pad_idx] * (self.max_seq_len - len(ids))
        else:
            ids = ids[:self.max_seq_len]

        return np.asarray(ids, dtype=np.int64)

    def encode_texts(self, texts):
        return np.stack([self.encode_text(t) for t in texts], axis=0)

    def save_vocab(self, vocab_path):
        os.makedirs(os.path.dirname(vocab_path), exist_ok=True)
        payload = {
            "vocab_size": self.vocab_size,
            "max_seq_len": self.max_seq_len,
            "min_freq": self.min_freq,
            "pad_token": self.pad_token,
            "unk_token": self.unk_token,
            "word_to_idx": self.word_to_idx,
        }
        with open(vocab_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

    def load_vocab(self, vocab_path):
        with open(vocab_path, 'r', encoding='utf-8') as f:
            payload = json.load(f)

        self.vocab_size = payload.get("vocab_size", self.vocab_size)
        self.max_seq_len = payload.get("max_seq_len", self.max_seq_len)
        self.min_freq = payload.get("min_freq", self.min_freq)
        self.pad_token = payload.get("pad_token", self.pad_token)
        self.unk_token = payload.get("unk_token", self.unk_token)

        word_to_idx = payload.get("word_to_idx", None)
        if not isinstance(word_to_idx, dict) or len(word_to_idx) == 0:
            raise ValueError(f"Invalid vocab file: {vocab_path}")

        self.word_to_idx = {str(k): int(v) for k, v in word_to_idx.items()}
        self.pad_idx = self.word_to_idx.get(self.pad_token, 0)
        self.unk_idx = self.word_to_idx.get(self.unk_token, 1)

    @property
    def effective_vocab_size(self):
        return len(self.word_to_idx)
