from flask import Flask, request, jsonify
import torch
import os
import functools
import jwt
import datetime
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# 使用绝对导入
from src.models.fusion_model import FusionModel
from src.data_processing.text_processor import TextProcessor
from config.config import Config

app = Flask(__name__)
config = Config()

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-change-in-prod')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRE_HOURS = 24

ROLE_PERMISSIONS = {
    'admin': ['*'],
    'user': ['dashboard_view', 'detection_single', 'detection_batch', 'risks_view', 'enterprises_view', 'graph_view', 'datacenter_view'],
}


def generate_token(user_id: int, username: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def jwt_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'code': 401, 'message': '缺少认证令牌'}), 401
        token = auth_header[7:]
        payload = decode_token(token)
        if payload is None:
            return jsonify({'code': 401, 'message': '令牌无效或已过期'}), 401
        request.current_user = payload
        return f(*args, **kwargs)
    return decorated


def permission_required(*required_permissions):
    def decorator(f):
        @functools.wraps(f)
        @jwt_required
        def decorated(*args, **kwargs):
            user_role = request.current_user.get('role', '')
            user_perms = ROLE_PERMISSIONS.get(user_role, [])
            if '*' in user_perms:
                return f(*args, **kwargs)
            has_perm = any(p in user_perms for p in required_permissions)
            if not has_perm:
                return jsonify({'code': 403, 'message': '无权限访问'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def _build_model_and_text_processor():
    """
    加载模型 + 文本处理器，确保训练/推理词表一致。
    """
    text_processor = TextProcessor(
        vocab_size=config.vocab_size,
        max_seq_len=config.max_seq_len,
        min_freq=config.min_token_freq,
    )

    vocab_path = os.path.join(config.model_path, 'vocab.json')
    if os.path.exists(vocab_path):
        text_processor.load_vocab(vocab_path)

    textcnn_params = {
        'vocab_size': text_processor.effective_vocab_size,
        'embedding_dim': config.embedding_dim,
        'kernel_sizes': config.kernel_sizes,
        'num_filters': config.num_filters,
        'dropout': config.dropout,
    }

    gcn_params = {
        'in_channels': 2,  # 需与训练图特征维度一致
        'hidden_dim': config.hidden_dim,
        'num_layers': config.gcn_layers,
    }

    model = FusionModel(
        gcn_params,
        textcnn_params=textcnn_params,
    )

    model_path = os.path.join(config.model_path, 'best_model.pth')
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()

    return model, text_processor


model, text_processor = _build_model_and_text_processor()


@app.route('/api/v1/inference/risk:predict', methods=['POST'])
@jwt_required
def predict():
    """
    风险预测API（统一版）
    支持两种输入：
    1) 原始业务字段（company_name/recent_data/...）
    2) 预提取特征（features）
    """
    try:
        data = request.json or {}
        company_name = data.get('company_name', '')

        if isinstance(data.get('features'), list) and len(data.get('features')) > 0:
            features = data.get('features')
            half = max(1, len(features) // 2)
            compliance_score = float(sum(features[:half]) / half)
            payment_score = float(sum(features[half:]) / max(1, len(features[half:])))
            compliance_score = max(0.0, min(1.0, compliance_score))
            payment_score = max(0.0, min(1.0, payment_score))
        else:
            recent_data = data.get('recent_data', {})

            if isinstance(recent_data, dict):
                text = recent_data.get('text', '')
                if not text:
                    text = ' '.join([f"{k}:{v}" for k, v in recent_data.items()])
            else:
                text = str(recent_data)

            text_ids = text_processor.encode_text(text)
            text_input = torch.tensor(text_ids, dtype=torch.long).unsqueeze(0)

            graph_input = torch.zeros((1, 2), dtype=torch.float)
            edge_index = torch.tensor([[0], [0]], dtype=torch.long)

            with torch.no_grad():
                compliance_output, payment_output = model(text_input, graph_input, edge_index)
                compliance_score = float(torch.softmax(compliance_output, dim=1)[0][1].item())
                payment_score = float(torch.softmax(payment_output, dim=1)[0][1].item())

        def get_risk_level_en(score):
            if score < 0.3:
                return 'low'
            elif score < 0.7:
                return 'medium'
            return 'high'

        return jsonify({
            'code': 200,
            'message': 'ok',
            'data': {
                'company_name': company_name,
                'compliance_risk': get_risk_level_en(compliance_score),
                'payment_risk': get_risk_level_en(payment_score),
                'scores': {
                    'compliance_score': round(compliance_score, 4),
                    'payment_score': round(payment_score, 4),
                },
                'backend': 'textcnn-gcn',
                'model_version': 'v1',
                'schema_version': 'v1',
            },
        })

    except Exception as e:
        return jsonify({'code': 400, 'message': str(e)}), 400


@app.route('/api/v1/health', methods=['GET'])
def health():
    model_path = os.path.join(config.model_path, 'best_model.pth')
    return jsonify({
        'code': 200,
        'message': 'ok',
        'data': {
            'status': 'ok',
            'model_loaded': os.path.exists(model_path),
            'service': 'text-cnn-gcn-api',
            'model_version': 'v1',
        },
    })


MOCK_USERS_DB = [
    {'id': 1, 'username': 'admin', 'password': 'Admin@123456', 'email': 'admin@example.com', 'role': 'admin'},
    {'id': 2, 'username': 'test_user_01', 'password': 'Test@123456', 'email': 'test01@example.com', 'role': 'user'},
]


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '')
    password = data.get('password', '')
    user = next((u for u in MOCK_USERS_DB if u['username'] == username and u['password'] == password), None)
    if not user:
        return jsonify({'code': 401, 'message': '用户名或密码错误'}), 401
    token = generate_token(user['id'], user['username'], user['role'])
    return jsonify({
        'code': 200,
        'message': '登录成功',
        'data': {
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'permissions': ROLE_PERMISSIONS.get(user['role'], []),
            },
        },
    })


@app.route('/api/user', methods=['GET'])
@jwt_required
def get_current_user():
    user = request.current_user
    return jsonify({
        'code': 200,
        'message': 'ok',
        'data': {
            'id': user['user_id'],
            'username': user['username'],
            'role': user['role'],
            'permissions': ROLE_PERMISSIONS.get(user['role'], []),
        },
    })


@app.route('/api/v1/risk/predictions', methods=['GET'])
@jwt_required
def get_risk_predictions():
    return jsonify({'code': 200, 'message': 'ok', 'data': []})


@app.route('/api/v1/risk/report', methods=['GET'])
@jwt_required
def get_risk_report():
    return jsonify({'code': 404, 'message': '报告生成功能开发中'}), 404


@app.route('/api/users', methods=['GET'])
@permission_required('system_users')
def get_users():
    return jsonify({'code': 200, 'message': 'ok', 'data': []})


@app.route('/api/role', methods=['GET'])
@permission_required('system_roles')
def get_roles():
    return jsonify({'code': 200, 'message': 'ok', 'data': []})


@app.route('/api/operation-log', methods=['GET'])
@permission_required('system_logs')
def get_operation_logs():
    return jsonify({'code': 200, 'message': 'ok', 'data': []})


@app.route('/api/api-key', methods=['GET'])
@permission_required('api_manage')
def get_api_keys():
    return jsonify({'code': 200, 'message': 'ok', 'data': []})


if __name__ == '__main__':
    app.run(host=config.api_host, port=config.api_port, debug=True)
