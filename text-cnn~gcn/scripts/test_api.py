import requests
import json

def test_api():
    """
    测试API接口
    """
    # API地址
    url = 'http://localhost:5000/predict'
    
    # 测试数据
    test_data = {
        'company_name': '测试企业',
        'recent_data': {
            'policy_news': '跨境电商企业需要遵守海关监管规定',
            'user_complaints': '用户投诉该电商平台存在支付问题'
        }
    }
    
    # 发送请求
    try:
        response = requests.post(url, json=test_data)
        response.raise_for_status()  # 检查响应状态码
        
        # 打印结果
        result = response.json()
        print("API Response:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        return result
    
    except requests.exceptions.RequestException as e:
        print(f"API调用失败: {e}")
        return None

if __name__ == '__main__':
    test_api()
