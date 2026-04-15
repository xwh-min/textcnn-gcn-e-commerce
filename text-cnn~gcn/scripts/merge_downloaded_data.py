import os
import pandas as pd


CHUNK_SIZE = 200_000


def available_files(paths):
    out = []
    for p in paths:
        if os.path.exists(p) and os.path.getsize(p) > 0:
            out.append(p)
    return out


def build_text_and_label(df: pd.DataFrame) -> pd.DataFrame:
    et = df['event_type'].astype(str).str.lower() if 'event_type' in df.columns else pd.Series([''] * len(df))
    cc = df['category_code'].fillna('unknown').astype(str) if 'category_code' in df.columns else pd.Series(['unknown'] * len(df))
    br = df['brand'].fillna('unknown').astype(str) if 'brand' in df.columns else pd.Series(['unknown'] * len(df))
    pr = pd.to_numeric(df['price'], errors='coerce').fillna(0.0) if 'price' in df.columns else pd.Series([0.0] * len(df))

    text = (
        'event=' + et +
        ' | category=' + cc +
        ' | brand=' + br +
        ' | price=' + pr.astype(str)
    )

    # 弱标注规则：可后续替换
    label = pd.Series(['支付风险'] * len(df))
    label[(et == 'purchase') & (pr > 0)] = '合规风险'

    out = pd.DataFrame({'text': text, 'label': label})
    out = out.dropna(subset=['text', 'label'])
    out['text'] = out['text'].astype(str).str.strip()
    out['label'] = out['label'].astype(str).str.strip()
    out = out[(out['text'] != '') & (out['label'] != '')]
    return out


def append_csv(df: pd.DataFrame, out_path: str, write_header: bool):
    df.to_csv(out_path, mode='a', index=False, header=write_header, encoding='utf-8-sig')


def merge_monthly_file(file_path: str, out_path: str, write_header: bool) -> bool:
    print(f'开始处理: {file_path}', flush=True)
    usecols = None
    try_cols = ['event_type', 'category_code', 'brand', 'price']

    processed_rows = 0
    chunk_idx = 0

    for chunk in pd.read_csv(file_path, chunksize=CHUNK_SIZE, usecols=usecols, low_memory=False):
        chunk_idx += 1
        # 若字段缺失，仍然可兼容
        converted = build_text_and_label(chunk)
        append_csv(converted, out_path, write_header)
        write_header = False

        processed_rows += len(chunk)
        print(f'  chunk={chunk_idx}, rows={len(chunk)}, total={processed_rows}', flush=True)

    print(f'完成处理: {file_path}, 总行数={processed_rows}', flush=True)
    return write_header


def main():
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base, 'data')

    existing_text_path = os.path.join(data_dir, 'text_data.csv')
    if not os.path.exists(existing_text_path):
        raise FileNotFoundError(f'未找到: {existing_text_path}')

    monthly_files = available_files([
        os.path.join(data_dir, '2019-Oct.csv'),
        os.path.join(data_dir, '2019-Nov.csv'),
    ])

    out_path = os.path.join(data_dir, 'text_data_merged.csv')
    if os.path.exists(out_path):
        os.remove(out_path)

    # 先写入现有 text_data
    base_df = pd.read_csv(existing_text_path)
    if not {'text', 'label'}.issubset(base_df.columns):
        raise ValueError('text_data.csv 必须包含 text,label 字段')

    base_df = base_df[['text', 'label']].dropna()
    base_df['text'] = base_df['text'].astype(str).str.strip()
    base_df['label'] = base_df['label'].astype(str).str.strip()
    base_df = base_df[(base_df['text'] != '') & (base_df['label'] != '')]

    append_csv(base_df, out_path, write_header=True)
    write_header = False
    print(f'已写入现有 text_data.csv: {len(base_df)} 行', flush=True)

    if not monthly_files:
        print('未发现可用月度数据，已仅输出现有 text_data 合并文件。', flush=True)
        print('输出:', out_path, flush=True)
        return

    for f in monthly_files:
        write_header = merge_monthly_file(f, out_path, write_header)

    # 简单统计
    merged_count = sum(1 for _ in open(out_path, 'r', encoding='utf-8-sig')) - 1
    print(f'合并完成，输出: {out_path}', flush=True)
    print(f'总记录数(估算): {merged_count}', flush=True)


if __name__ == '__main__':
    main()
