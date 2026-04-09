import { NextRequest, NextResponse } from 'next/server';

interface RiskPredictionRequest {
  company_name: string;
  recent_data: string;
  policy_news?: string[];
  user_complaints?: string[];
  graph_structure?: {
    nodes?: Array<{
      id: string;
      type: 'enterprise' | 'logistics' | 'customs';
      riskLevel?: 'high' | 'medium' | 'low';
    }>;
    edges?: Array<{
      source: string;
      target: string;
      type: 'cooperation' | 'compliance';
      weight?: number;
    }>;
  };
}

interface RiskPredictionResponse {
  code: number;
  message: string;
  result: {
    compliance_risk: 'high' | 'medium' | 'low';
    payment_risk: 'high' | 'medium' | 'low';
    scores: {
      compliance_score: number;
      payment_score: number;
    };
    text_cnn_features?: number[];
    gcn_features?: number[];
    fused_features?: number[];
    analysis?: {
      text_analysis: {
        policy_sentiment: string;
        complaint_count: number;
        key_risk_factors: string[];
      };
      graph_analysis: {
        centrality_score: number;
        neighbor_risk_level: string;
        community_risk: string;
      };
    };
  };
}

// 模拟TextCNN文本特征提取
function extractTextCNNFeatures(
  policyNews: string[],
  userComplaints: string[]
): { features: number[]; sentiment: string; riskFactors: string[] } {
  // 简单的文本分析模拟
  const sentimentKeywords = {
    positive: ['优惠', '支持', '发展', '便利', '增长'],
    negative: ['投诉', '延迟', '问题', '违规', '处罚', '风险'],
    neutral: ['调整', '监管', '政策', '规定'],
  };

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  const riskFactors: string[] = [];

  const allTexts = [...policyNews, ...userComplaints];

  allTexts.forEach((text) => {
    sentimentKeywords.positive.forEach((keyword) => {
      if (text.includes(keyword)) positiveCount++;
    });
    sentimentKeywords.negative.forEach((keyword) => {
      if (text.includes(keyword)) {
        negativeCount++;
        riskFactors.push(keyword);
      }
    });
    sentimentKeywords.neutral.forEach((keyword) => {
      if (text.includes(keyword)) neutralCount++;
    });
  });

  const total = positiveCount + negativeCount + neutralCount || 1;

  // 生成5维特征向量
  const features = [
    positiveCount / total,
    negativeCount / total,
    neutralCount / total,
    userComplaints.length / 10, // 投诉密度
    policyNews.length / 10, // 政策关注度
  ];

  let sentiment = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  if (negativeCount > positiveCount) sentiment = 'negative';

  return { features, sentiment, riskFactors: [...new Set(riskFactors)] };
}

// 模拟GCN图特征提取
function extractGCNFeatures(graphStructure: any): {
  features: number[];
  centrality: number;
  neighborRisk: string;
} {
  const nodes = graphStructure?.nodes || [];
  const edges = graphStructure?.edges || [];

  // 计算节点中心性（简单的度中心性）
  const nodeDegrees: { [key: string]: number } = {};
  nodes.forEach((node: any) => {
    nodeDegrees[node.id] = 0;
  });

  edges.forEach((edge: any) => {
    if (nodeDegrees[edge.source] !== undefined) nodeDegrees[edge.source]++;
    if (nodeDegrees[edge.target] !== undefined) nodeDegrees[edge.target]++;
  });

  const maxDegree = Math.max(...Object.values(nodeDegrees), 1);
  const avgDegree =
    Object.values(nodeDegrees).reduce((a, b) => a + b, 0) / nodes.length || 0;

  // 分析邻居风险
  const enterpriseNodes = nodes.filter((n: any) => n.type === 'enterprise');
  const highRiskCount = enterpriseNodes.filter(
    (n: any) => n.riskLevel === 'high'
  ).length;
  const mediumRiskCount = enterpriseNodes.filter(
    (n: any) => n.riskLevel === 'medium'
  ).length;

  let neighborRisk = 'low';
  if (highRiskCount > enterpriseNodes.length * 0.3) neighborRisk = 'high';
  else if (mediumRiskCount > enterpriseNodes.length * 0.3) neighborRisk = 'medium';

  // 生成5维图特征向量
  const features = [
    avgDegree / maxDegree, // 归一化平均度
    highRiskCount / (enterpriseNodes.length || 1), // 高风险邻居比例
    mediumRiskCount / (enterpriseNodes.length || 1), // 中风险邻居比例
    edges.length / (nodes.length * nodes.length || 1), // 网络密度
    enterpriseNodes.length / (nodes.length || 1), // 企业节点比例
  ];

  return {
    features,
    centrality: avgDegree / maxDegree,
    neighborRisk,
  };
}

// 特征融合和风险预测
function fuseFeaturesAndPredict(
  textFeatures: number[],
  graphFeatures: number[]
): {
  fusedFeatures: number[];
  complianceRisk: 'high' | 'medium' | 'low';
  paymentRisk: 'high' | 'medium' | 'low';
  complianceScore: number;
  paymentScore: number;
} {
  // 简单的特征拼接融合
  const fusedFeatures = textFeatures.map((tf, i) => {
    const gf = graphFeatures[i] || 0;
    return (tf + gf) / 2; // 平均融合
  });

  // 基于融合特征计算风险分数
  const textRiskScore =
    textFeatures[1] * 0.4 + textFeatures[3] * 0.6; // 负面情感 + 投诉密度
  const graphRiskScore =
    graphFeatures[1] * 0.5 + graphFeatures[2] * 0.3 + graphFeatures[3] * 0.2;

  const complianceScore = Math.min(
    1,
    textRiskScore * 0.6 + graphRiskScore * 0.4
  );
  const paymentScore = Math.min(
    1,
    textRiskScore * 0.4 + graphRiskScore * 0.6
  );

  const getRiskLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  };

  return {
    fusedFeatures,
    complianceRisk: getRiskLevel(complianceScore),
    paymentRisk: getRiskLevel(paymentScore),
    complianceScore,
    paymentScore,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RiskPredictionRequest = await request.json();

    // 验证必填字段
    if (!body.company_name) {
      return NextResponse.json(
        {
          code: 400,
          message: '企业名称不能为空',
          result: null,
        },
        { status: 400 }
      );
    }

    // 提取文本特征
    const textAnalysis = extractTextCNNFeatures(
      body.policy_news || [],
      body.user_complaints || []
    );

    // 提取图特征
    const graphAnalysis = extractGCNFeatures(body.graph_structure || {});

    // 特征融合和风险预测
    const prediction = fuseFeaturesAndPredict(
      textAnalysis.features,
      graphAnalysis.features
    );

    const response: RiskPredictionResponse = {
      code: 200,
      message: '风险预测成功',
      result: {
        compliance_risk: prediction.complianceRisk,
        payment_risk: prediction.paymentRisk,
        scores: {
          compliance_score: prediction.complianceScore,
          payment_score: prediction.paymentScore,
        },
        text_cnn_features: textAnalysis.features,
        gcn_features: graphAnalysis.features,
        fused_features: prediction.fusedFeatures,
        analysis: {
          text_analysis: {
            policy_sentiment: textAnalysis.sentiment,
            complaint_count: body.user_complaints?.length || 0,
            key_risk_factors: textAnalysis.riskFactors,
          },
          graph_analysis: {
            centrality_score: graphAnalysis.centrality,
            neighbor_risk_level: graphAnalysis.neighborRisk,
            community_risk: prediction.complianceRisk,
          },
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Risk prediction error:', error);
    return NextResponse.json(
      {
        code: 500,
        message: '风险预测服务内部错误',
        result: null,
      },
      { status: 500 }
    );
  }
}

// GET方法用于测试
export async function GET() {
  return NextResponse.json({
    code: 200,
    message: '风险预测API服务正常运行',
    usage: {
      method: 'POST',
      endpoint: '/api/risk/predict',
      body: {
        company_name: 'string (required)',
        recent_data: 'string (required)',
        policy_news: 'string[] (optional)',
        user_complaints: 'string[] (optional)',
        graph_structure: 'object (optional)',
      },
    },
  });
}
