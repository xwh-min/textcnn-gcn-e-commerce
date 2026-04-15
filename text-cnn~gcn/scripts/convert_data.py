import pandas as pd
import json
import os

# 读取原始数据（优先使用标准路径，其次兼容 legacy 路径）
RAW_DATA_CANDIDATES = [
    'data/raw/E-commerce.csv',
    'data/archive (2)/E-commerce.csv',
]

raw_data_path = None
for candidate in RAW_DATA_CANDIDATES:
    if os.path.exists(candidate):
        raw_data_path = candidate
        break

if raw_data_path is None:
    raise FileNotFoundError(
        '未找到原始数据文件，请将 E-commerce.csv 放到 data/raw/ 或 data/archive (2)/ 下'
    )

data = pd.read_csv(raw_data_path)
print(f'使用原始数据文件: {raw_data_path}')

# 处理文本数据（产品评论）
text_data = []
for _, row in data.iterrows():
    review = row['Product Reviews']
    # 简单处理，实际应用中可以更复杂
    text_data.append({
        'text': review,
        'label': '合规风险' if 'Great' in review or 'Excellent' in review else '支付风险'
    })

# 保存文本数据
text_df = pd.DataFrame(text_data)
text_df.to_csv('data/text_data.csv', index=False)

# 构建节点数据
nodes = []
# 客户节点
for _, row in data.iterrows():
    customer_id = f"customer_{row['Customer ID']}"
    nodes.append({
        'id': customer_id,
        'type': '客户',
        'features': [row['Age'], row['Annual Income']]
    })

# 产品节点（从购买历史中提取）
product_ids = set()
for _, row in data.iterrows():
    try:
        purchase_history = json.loads(row['Purchase History'].replace("'", '"'))
        if isinstance(purchase_history, list):
            for item in purchase_history:
                if 'Category' in item:
                    product_ids.add(item['Category'])
                elif 'Product Category' in item:
                    product_ids.add(item['Product Category'])
    except:
        pass

for product in product_ids:
    nodes.append({
        'id': f"product_{product}",
        'type': '产品',
        'features': [1.0, 1.0]  # 示例特征
    })

# 保存节点数据
nodes_df = pd.DataFrame(nodes)
nodes_df['features'] = nodes_df['features'].apply(str)
nodes_df.to_csv('data/nodes.csv', index=False)

# 构建边数据
edges = []
# 客户-产品边
for _, row in data.iterrows():
    customer_id = f"customer_{row['Customer ID']}"
    try:
        purchase_history = json.loads(row['Purchase History'].replace("'", '"'))
        if isinstance(purchase_history, list):
            for item in purchase_history:
                if 'Category' in item:
                    product_id = f"product_{item['Category']}"
                elif 'Product Category' in item:
                    product_id = f"product_{item['Product Category']}"
                edges.append({
                    'source': customer_id,
                    'target': product_id,
                    'type': '购买'
                })
    except:
        pass

# 保存边数据
edges_df = pd.DataFrame(edges)
edges_df.to_csv('data/edges.csv', index=False)

print("数据转换完成！")
