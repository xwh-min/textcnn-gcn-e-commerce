import os
import pandas as pd
from sklearn.model_selection import train_test_split


def write_txt(df: pd.DataFrame, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        for _, row in df.iterrows():
            text = str(row['text']).replace('\n', ' ').replace('\t', ' ')
            label = str(row['label'])
            f.write(f"{text}\t{label}\n")


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base, 'data')

    merged_path = os.path.join(data_dir, 'text_data_merged.csv')
    if not os.path.exists(merged_path):
        raise FileNotFoundError(f'未找到 {merged_path}，请先运行 merge_downloaded_data.py')

    df = pd.read_csv(merged_path)
    if not {'text', 'label'}.issubset(df.columns):
        raise ValueError('text_data_merged.csv 必须包含 text,label 字段')

    df = df[['text', 'label']].dropna()
    df['text'] = df['text'].astype(str).str.strip()
    df['label'] = df['label'].astype(str).str.strip()
    df = df[(df['text'] != '') & (df['label'] != '')].reset_index(drop=True)

    # 分层切分：80/10/10
    train_df, temp_df = train_test_split(
        df,
        test_size=0.2,
        random_state=42,
        stratify=df['label'],
    )

    dev_df, test_df = train_test_split(
        temp_df,
        test_size=0.5,
        random_state=42,
        stratify=temp_df['label'],
    )

    train_path = os.path.join(data_dir, 'train.txt')
    dev_path = os.path.join(data_dir, 'dev.txt')
    test_path = os.path.join(data_dir, 'test.txt')

    write_txt(train_df, train_path)
    write_txt(dev_df, dev_path)
    write_txt(test_df, test_path)

    print('切分完成:')
    print(f'train: {len(train_df)} -> {train_path}')
    print(f'dev:   {len(dev_df)} -> {dev_path}')
    print(f'test:  {len(test_df)} -> {test_path}')
    print('\n标签分布:')
    print('train:')
    print(train_df['label'].value_counts())
    print('dev:')
    print(dev_df['label'].value_counts())
    print('test:')
    print(test_df['label'].value_counts())


if __name__ == '__main__':
    main()
